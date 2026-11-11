begin;
do $$
declare
  v_admin uuid := tests.make_user('admin1', 'admin');
  v_sales uuid := tests.make_user('sales1', 'sales');
  v_wh uuid := tests.make_user('wh1', 'warehouse');
  v_drv uuid := tests.make_user('aref', 'driver');
  v_drv2 uuid := tests.make_user('naeem', 'driver');
  v_cust uuid; v_branch uuid; v_rep uuid; v_o uuid; v_ext uuid; v_row orders;
begin
  insert into customers(name) values ('الحسين توب') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'مخرج ٦', 24.75, 46.72) returning id into v_branch;
  insert into sales_reps(name) values ('مجد') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
    values (v_branch, v_rep, 'PO-1', v_drv, v_sales) returning id into v_o;
  insert into orders(branch_id, sales_rep_id, po_number, external, created_by)
    values (v_branch, v_rep, 'PO-2', true, v_sales) returning id into v_ext;

  -- sales cannot mark ready
  perform tests.login(v_sales);
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'ready'), 'invalid_transition');
  -- warehouse marks ready, ready_at set, event written
  perform tests.login(v_wh);
  v_row := transition_order(v_o, 'ready');
  perform tests.expect_eq(v_row.status, 'ready'::order_status, 'status after ready');
  perform tests.expect_eq(v_row.ready_at is not null, true, 'ready_at set');
  -- other driver cannot start
  perform tests.login(v_drv2);
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'on_the_way'), 'invalid_transition');
  -- assigned driver can
  perform tests.login(v_drv);
  v_row := transition_order(v_o, 'on_the_way');
  v_row := transition_order(v_o, 'failed', '{"reason":"closed"}');
  perform tests.expect_eq(v_row.status, 'failed'::order_status, 'failed');
  -- reschedule to naeem tomorrow
  perform tests.login(v_sales);
  v_row := transition_order(v_o, 'new', jsonb_build_object('delivery_date', current_date + 1, 'driver_id', v_drv2, 'external', false));
  perform tests.expect_eq(v_row.driver_id, v_drv2, 'rescheduled driver');
  perform tests.expect_eq(v_row.delivery_date, current_date + 1, 'rescheduled date');
  perform tests.expect_eq(v_row.ready_at, null::timestamptz, 'ready_at cleared');
  -- reschedule to a non-driver is rejected
  perform tests.login(v_admin);
  v_row := transition_order(v_o, 'cancelled');
  -- terminal
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'new'), 'invalid_transition');
  -- external: sales confirms delivery directly from ready
  perform tests.login(v_wh);
  perform transition_order(v_ext, 'ready');
  perform tests.login(v_sales);
  v_row := transition_order(v_ext, 'delivered');
  perform tests.expect_eq(v_row.delivered_at is not null, true, 'external delivered_at');
  -- events written for every transition of v_o (ready, on_the_way, failed, new, cancelled)
  perform tests.logout();
  perform tests.expect_eq((select count(*) from order_events where order_id = v_o), 5::bigint, 'event count');
  -- unauthenticated
  perform tests.expect_error(format('select transition_order(%L, %L)', v_ext, 'cancelled'), 'not_authorized');
end $$;

-- undo window
do $$
declare v_wh uuid := (select user_id from profiles where username='wh1');
        v_o uuid; v_row orders;
begin
  select id into v_o from orders where po_number = 'PO-1';
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
    select branch_id, sales_rep_id, 'PO-3', driver_id, created_by from orders where id = v_o returning id into v_o;
  perform tests.login(v_wh);
  perform transition_order(v_o, 'ready');
  v_row := transition_order(v_o, 'new');
  perform tests.expect_eq(v_row.status, 'new'::order_status, 'undo inside window');
  perform transition_order(v_o, 'ready');
  perform tests.logout();
  update orders set ready_at = now() - interval '6 minutes' where id = v_o;
  perform tests.login(v_wh);
  perform tests.expect_error(format('select transition_order(%L, %L)', v_o, 'new'), 'undo_window_passed');
  perform tests.logout();
end $$;

-- driver_id must be an active driver
do $$
begin
  perform tests.expect_error(
    format($q$insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by)
             select branch_id, sales_rep_id, 'PO-X', %L, created_by from orders limit 1$q$,
           (select user_id from profiles where username = 'sales1')),
    'invalid_driver');
  perform tests.expect_error(
    $q$insert into orders(branch_id, sales_rep_id, po_number, created_by)
       select branch_id, sales_rep_id, 'PO-Y', created_by from orders limit 1$q$,
    'driver_or_external');
end $$;
rollback;
