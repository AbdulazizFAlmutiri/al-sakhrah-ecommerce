-- Postgres grants EXECUTE to PUBLIC by default, which includes anon. Only the two
-- pre-login functions should be callable without signing in.
revoke execute on all functions in schema public from public;
grant execute on function public.app_role() to authenticated;
grant execute on function public.riyadh_today() to authenticated;
grant execute on function public.transition_order(uuid, public.order_status, jsonb) to authenticated;
grant execute on function public.admin_create_user(text, text, public.app_role, public.app_locale, text) to authenticated;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;
grant execute on function public.admin_update_user(uuid, text, public.app_role, public.app_locale, boolean) to authenticated;
grant execute on function public.set_my_locale(public.app_locale) to authenticated;
grant execute on function public.clear_must_change_password() to authenticated;
grant execute on function public.login_is_locked(text) to anon, authenticated;
grant execute on function public.record_login_attempt(text, boolean) to anon, authenticated;
-- Trigger functions run as the table owner; nobody needs to call them directly.
revoke execute on function public.touch_updated_at() from anon, authenticated;
revoke execute on function public.check_order_driver() from anon, authenticated;

alter function public.touch_updated_at() set search_path = public;
alter function public.riyadh_today() set search_path = public;
