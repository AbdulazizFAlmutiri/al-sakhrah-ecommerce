create schema tests;

-- Act as a signed-in user for the rest of the transaction.
create function tests.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- Assert that a SQL string raises an error whose message contains p_expected.
create function tests.expect_error(p_sql text, p_expected text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if position(p_expected in sqlerrm) = 0 then
      raise exception 'expected error "%" but got "%" for: %', p_expected, sqlerrm, p_sql;
    end if;
    return;
  end;
  raise exception 'expected error "%" but statement succeeded: %', p_expected, p_sql;
end $$;

create function tests.expect_eq(p_actual anyelement, p_expected anyelement, p_label text) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception '%: expected %, got %', p_label, p_expected, p_actual;
  end if;
end $$;

-- Create a user with a profile directly (as superuser), bypassing admin checks.
create function tests.make_user(p_username text, p_role app_role) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (v_id, p_username || '@users.ops.local');
  insert into public.profiles (user_id, username, full_name, role, must_change_password)
  values (v_id, p_username, initcap(p_username), p_role, false);
  return v_id;
end $$;

grant usage on schema tests to authenticated, anon;
grant execute on all functions in schema tests to authenticated, anon;
