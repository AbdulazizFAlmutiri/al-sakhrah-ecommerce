-- Internal: create an auth user + identity + profile. Not callable by clients.
create function public._create_user(p_username text, p_full_name text, p_role public.app_role,
                                    p_locale public.app_locale, p_password text, p_must_change boolean)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_id uuid := gen_random_uuid(); v_email text; v_username text := lower(trim(p_username));
begin
  if v_username !~ '^[a-z0-9._-]{3,32}$' then raise exception 'invalid_username' using errcode = '22023'; end if;
  if coalesce(length(p_password), 0) < 8 then raise exception 'weak_password' using errcode = '22023'; end if;
  if exists (select 1 from profiles where username = v_username) then
    raise exception 'username_taken' using errcode = '23505';
  end if;
  v_email := v_username || '@users.ops.local';
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          crypt(p_password, gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('username', v_username),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());
  insert into profiles (user_id, username, full_name, role, locale, must_change_password)
  values (v_id, v_username, trim(p_full_name), p_role, p_locale, p_must_change);
  return v_id;
end $$;
revoke all on function public._create_user(text, text, public.app_role, public.app_locale, text, boolean) from public, anon, authenticated;

create function public.admin_create_user(p_username text, p_full_name text, p_role public.app_role,
                                         p_locale public.app_locale, p_password text)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'not_authorized' using errcode = '42501'; end if;
  return _create_user(p_username, p_full_name, p_role, p_locale, p_password, true);
end $$;

-- One-time: creates the first admin. Only works while no admin exists; not callable by clients.
create function public.bootstrap_admin(p_username text, p_full_name text, p_password text)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from profiles where role = 'admin') then
    raise exception 'admin_exists' using errcode = '22023';
  end if;
  return _create_user(p_username, p_full_name, 'admin', 'ar', p_password, true);
end $$;
revoke all on function public.bootstrap_admin(text, text, text) from public, anon, authenticated;

create function public.admin_reset_password(p_user_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'not_authorized' using errcode = '42501'; end if;
  if coalesce(length(p_password), 0) < 8 then raise exception 'weak_password' using errcode = '22023'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = p_user_id;
  update profiles set must_change_password = true where user_id = p_user_id;
end $$;

create function public.admin_update_user(p_user_id uuid, p_full_name text, p_role public.app_role,
                                         p_locale public.app_locale, p_active boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if app_role() is distinct from 'admin' then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_user_id = auth.uid() and (not p_active or p_role <> 'admin') then
    raise exception 'cannot_modify_self' using errcode = '22023';
  end if;
  update profiles set full_name = trim(p_full_name), role = p_role, locale = p_locale, active = p_active
  where user_id = p_user_id;
  update auth.users set banned_until = case when p_active then null else 'infinity'::timestamptz end
  where id = p_user_id;
end $$;

create function public.set_my_locale(p_locale public.app_locale)
returns void language sql security definer set search_path = public as $$
  update profiles set locale = p_locale where user_id = auth.uid()
$$;

create function public.clear_must_change_password()
returns void language sql security definer set search_path = public as $$
  update profiles set must_change_password = false where user_id = auth.uid()
$$;

create function public.login_is_locked(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select count(*) >= 5 from login_attempts
  where username = lower(trim(p_username)) and not success
    and attempted_at > now() - interval '15 minutes'
    and attempted_at > coalesce((select max(attempted_at) from login_attempts
                                 where username = lower(trim(p_username)) and success), '-infinity')
$$;

-- Failures can be recorded by anyone (pre-login). Successes only by that user, so nobody can unlock someone else.
create function public.record_login_attempt(p_username text, p_success boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_success and not exists (
    select 1 from profiles where user_id = auth.uid() and username = lower(trim(p_username))
  ) then
    return;
  end if;
  insert into login_attempts(username, success) values (lower(trim(p_username)), p_success);
end $$;
