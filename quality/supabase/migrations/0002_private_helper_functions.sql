-- Keep helper functions out of the public API (Supabase security advisor 0028/0029).
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.active);
$$;
revoke all on function private.is_active_user() from public, anon;
grant execute on function private.is_active_user() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['departments','profiles','documents','forms','distributed_copies',
                           'clauses','papers','clause_evidence','audit_log'] loop
    execute format('drop policy if exists "active staff can read" on public.%I', t);
    execute format('create policy "active staff can read" on public.%I for select to authenticated using (private.is_active_user())', t);
  end loop;
end $$;

drop function if exists public.is_active_user();

-- Only present when "Enable automatic RLS" was ticked at project creation.
do $$ begin
  if exists (select 1 from pg_proc where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
