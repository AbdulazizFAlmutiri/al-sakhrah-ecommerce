begin;
do $$
declare v_admin uuid; v_sales uuid; v_new uuid;
begin
  -- bootstrap works once
  v_admin := bootstrap_admin('owner', 'Owner', 'start-pass-1');
  perform tests.expect_eq((select role from profiles where user_id = v_admin), 'admin'::app_role, 'bootstrap role');
  perform tests.expect_eq((select must_change_password from profiles where user_id = v_admin), true, 'must change');
  perform tests.expect_error($q$select bootstrap_admin('owner2','O','start-pass-1')$q$, 'admin_exists');
  perform tests.expect_eq(
    (select encrypted_password = extensions.crypt('start-pass-1', encrypted_password) from auth.users where id = v_admin),
    true, 'password hash');

  -- admin creates users
  perform tests.login(v_admin);
  v_new := admin_create_user(' Aref ', 'عارف', 'driver', 'ur', 'temp-pass-1');
  perform tests.expect_eq((select username from profiles where user_id = v_new), 'aref', 'normalized');
  perform tests.logout();
  perform tests.expect_eq((select email from auth.users where id = v_new)::text, 'aref@users.ops.local', 'email');
  perform tests.expect_eq((select count(*) from auth.identities where user_id = v_new), 1::bigint, 'identity');
  perform tests.login(v_admin);
  perform tests.expect_error($q$select admin_create_user('aref','x','driver','en','temp-pass-1')$q$, 'username_taken');
  perform tests.expect_error($q$select admin_create_user('عارف','x','driver','en','temp-pass-1')$q$, 'invalid_username');
  perform tests.expect_error($q$select admin_create_user('bob','x','driver','en','short')$q$, 'weak_password');
  perform tests.expect_error(format($q$select admin_update_user(%L,'O','sales','ar',true)$q$, v_admin), 'cannot_modify_self');

  -- deactivate bans the auth user
  perform admin_update_user(v_new, 'عارف', 'driver', 'ur', false);
  perform tests.logout();
  perform tests.expect_eq((select banned_until from auth.users where id = v_new), 'infinity'::timestamptz, 'banned');

  -- non-admin cannot manage accounts
  v_sales := tests.make_user('sales1', 'sales');
  perform tests.login(v_sales);
  perform tests.expect_error($q$select admin_create_user('x1','x','driver','en','temp-pass-1')$q$, 'not_authorized');
  perform tests.expect_error(format($q$select admin_reset_password(%L,'new-pass-12')$q$, v_new), 'not_authorized');
  perform tests.expect_error($q$select bootstrap_admin('x2','x','temp-pass-1')$q$, 'permission denied');

  -- own locale + clear flag
  perform set_my_locale('en');
  perform tests.logout();
  perform tests.expect_eq((select locale from profiles where user_id = v_sales), 'en'::app_locale, 'locale');

  -- lockout after 5 failures; another user cannot unlock with a fake success
  perform set_config('role', 'anon', true);
  for i in 1..5 loop perform record_login_attempt('sales1', false); end loop;
  perform tests.expect_eq(login_is_locked('sales1'), true, 'locked');
  perform record_login_attempt('sales1', true);
  perform tests.expect_eq(login_is_locked('sales1'), true, 'anon success ignored');
  perform set_config('role', 'none', true);
  perform tests.login(v_sales);
  perform record_login_attempt('sales1', true);
  perform tests.expect_eq(login_is_locked('sales1'), false, 'unlocked by own success');
  perform tests.logout();
end $$;
rollback;
