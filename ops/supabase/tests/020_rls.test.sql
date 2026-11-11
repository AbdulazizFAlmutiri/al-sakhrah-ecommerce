begin;
do $$
declare
  v_admin uuid := tests.make_user('admin1', 'admin');
  v_sales uuid := tests.make_user('sales1', 'sales');
  v_wh uuid := tests.make_user('wh1', 'warehouse');
  v_drv uuid := tests.make_user('aref', 'driver');
  v_drv2 uuid := tests.make_user('naeem', 'driver');
  v_cust uuid; v_b1 uuid; v_b2 uuid; v_rep uuid; v_o1 uuid;
begin
  insert into customers(name) values ('الحسين توب') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'مخرج ٦', 24.75, 46.72) returning id into v_b1;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'الربوة', 24.69, 46.76) returning id into v_b2;
  insert into sales_reps(name) values ('مجد') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
    values (v_b1, v_rep, 'PO-1', v_drv, v_sales) returning id into v_o1;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by, delivery_date)
    values (v_b2, v_rep, 'PO-2', v_drv2, v_sales, riyadh_today() + 1);

  -- driver sees only own order and only that order's branch
  perform tests.login(v_drv);
  perform tests.expect_eq((select count(*) from orders), 1::bigint, 'driver orders');
  perform tests.expect_eq((select count(*) from branches), 1::bigint, 'driver branches');
  perform tests.expect_eq((select count(*) from profiles), 1::bigint, 'driver profiles');
  perform tests.expect_eq((select count(*) from customers), 0::bigint, 'driver customers');
  -- driver cannot insert orders or change po_number
  perform tests.expect_error(
    format($q$insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by) values (%L,%L,'X',%L,%L)$q$, v_b1, v_rep, v_drv, v_drv),
    'row-level security');
  update orders set po_number = 'HACK' where id = v_o1;

  -- warehouse sees only today's orders
  perform tests.login(v_wh);
  perform tests.expect_eq((select count(*) from orders), 1::bigint, 'warehouse today only');
  -- warehouse has the column grant but no UPDATE policy: the update silently matches 0 rows
  update orders set notes = 'wh';
  perform tests.logout();
  perform tests.expect_eq((select notes from orders where id = v_o1), null::text, 'warehouse update blocked');

  -- sales sees all, can insert, cannot write status directly
  perform tests.login(v_sales);
  perform tests.expect_eq((select count(*) from orders), 2::bigint, 'sales all orders');
  perform tests.expect_error(format($q$update orders set status = 'delivered' where id = %L$q$, v_o1), 'permission denied');
  update orders set notes = 'back door' where id = v_o1;
  perform tests.expect_error($q$insert into sales_reps(name) values ('x')$q$, 'row-level security');
  perform tests.expect_eq((select count(*) from order_events), 0::bigint, 'sales reads events');

  -- admin manages reference data
  perform tests.login(v_admin);
  insert into sales_reps(name) values ('ناصر');

  perform tests.logout();
  perform tests.expect_eq((select po_number from orders where id = v_o1), 'PO-1', 'driver update blocked');
  perform tests.expect_eq((select notes from orders where id = v_o1), 'back door', 'sales update applied');
end $$;

-- anon sees nothing
do $$
begin
  perform set_config('role', 'anon', true);
  perform tests.expect_error('select count(*) from orders', 'permission denied');
  perform tests.expect_error('select count(*) from profiles', 'permission denied');
  perform tests.expect_error($q$select admin_create_user('x1','x','driver','en','temp-pass-1')$q$, 'permission denied');
  perform tests.expect_error($q$select transition_order(gen_random_uuid(), 'ready')$q$, 'permission denied');
  perform tests.expect_eq(login_is_locked('nobody'), false, 'anon can check lock');
  perform tests.expect_error('select start_trip()', 'permission denied');
  perform tests.expect_error('select end_trip()', 'permission denied');
  perform set_config('role', 'none', true);
end $$;
rollback;
