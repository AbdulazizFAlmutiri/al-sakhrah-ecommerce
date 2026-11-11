begin;
do $$
declare
  v_sales uuid := tests.make_user('sales3', 'sales');
  v_wh uuid := tests.make_user('wh3', 'warehouse');
  v_drv uuid := tests.make_user('aref3', 'driver');
  v_drv2 uuid := tests.make_user('naeem3', 'driver');
  v_cust uuid; v_b1 uuid; v_b2 uuid; v_rep uuid; v_o1 uuid; v_o2 uuid; v_trip uuid; v_reason uuid; v_p proofs; v_p2 proofs;
begin
  insert into warehouses(name, lat, lng) values ('wh', 24.60, 46.70);
  insert into customers(name) values ('الحسين توب') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'مخرج ٦', 24.7500, 46.7200) returning id into v_b1;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'الربوة', 24.6900, 46.7600) returning id into v_b2;
  insert into sales_reps(name) values ('مجد') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by) values (v_b1, v_rep, 'PO-1', v_drv, v_sales) returning id into v_o1;
  insert into orders(branch_id, sales_rep_id, po_number, driver_id, created_by) values (v_b2, v_rep, 'PO-2', v_drv, v_sales) returning id into v_o2;
  select id into v_reason from failure_reasons where code = 'closed';

  -- nothing ready yet
  perform tests.login(v_drv);
  perform tests.expect_error('select start_trip()', 'no_ready_orders');
  perform tests.login(v_wh);
  perform transition_order(v_o1, 'ready'); perform transition_order(v_o2, 'ready');

  -- only drivers start trips
  perform tests.login(v_sales);
  perform tests.expect_error('select start_trip()', 'not_authorized');

  perform tests.login(v_drv);
  v_trip := start_trip(24.60, 46.70);
  perform tests.expect_eq((select count(*) from orders where trip_id = v_trip and status = 'on_the_way'), 2::bigint, 'orders on the way');
  perform tests.expect_eq((select count(*) from driver_locations where trip_id = v_trip), 1::bigint, 'start location');
  perform tests.expect_error('select start_trip()', 'trip_already_active');

  -- route + ETAs
  perform set_trip_route(v_trip, jsonb_build_array(
    jsonb_build_object('order_id', v_o2, 'seq', 1, 'eta', '2026-11-11T08:00:00Z'),
    jsonb_build_object('order_id', v_o1, 'seq', 2, 'eta', '2026-11-11T08:30:00Z')), 'abc', 12000);
  perform tests.expect_eq((select stop_seq from orders where id = v_o2), 1, 'seq saved');

  -- location insert allowed for own active trip only
  insert into driver_locations(client_id, trip_id, driver_id, lat, lng, recorded_at) values (gen_random_uuid(), v_trip, v_drv, 24.65, 46.72, now());
  perform tests.login(v_drv2);
  perform tests.expect_error(format($q$insert into driver_locations(client_id, trip_id, driver_id, lat, lng, recorded_at) values (gen_random_uuid(), %L, %L, 1, 1, now())$q$, v_trip, v_drv2), 'row-level security');
  perform tests.expect_eq((select count(*) from driver_locations), 0::bigint, 'other driver sees no locations');
  perform tests.expect_error(format($q$select record_proof(gen_random_uuid(), %L, 'delivered', null, null, 'x.jpg')$q$, v_o1), 'not_authorized');

  -- delivered needs a photo; failed needs a reason
  perform tests.login(v_drv);
  perform tests.expect_error(format($q$select record_proof(gen_random_uuid(), %L, 'delivered')$q$, v_o2), 'photo_required');
  perform tests.expect_error(format($q$select record_proof(gen_random_uuid(), %L, 'failed')$q$, v_o1), 'reason_required');
  -- delivered near the store
  v_p := record_proof('00000000-0000-0000-0000-0000000000a1', v_o2, 'delivered', null, null, 'aref3/o2.jpg', 24.6901, 46.7601, 8);
  perform tests.expect_eq(v_p.far_from_store, false, 'near store');
  perform tests.expect_eq((select status from orders where id = v_o2), 'delivered'::order_status, 'delivered');
  -- replay is idempotent
  v_p2 := record_proof('00000000-0000-0000-0000-0000000000a1', v_o2, 'delivered', null, null, 'aref3/o2.jpg', 24.6901, 46.7601, 8);
  perform tests.expect_eq(v_p2.id, v_p.id, 'idempotent replay');
  -- cannot end with stops remaining
  perform tests.expect_error('select end_trip()', 'stops_remaining');
  -- failed far from store
  v_p := record_proof(gen_random_uuid(), v_o1, 'failed', v_reason, 'مقفل', null, 24.60, 46.70, 10);
  perform tests.expect_eq(v_p.far_from_store, true, 'far from store flagged');
  perform end_trip();
  perform tests.expect_eq((select ended_at is not null from trips where id = v_trip), true, 'trip ended');

  -- office sees proofs and locations
  perform tests.login(v_sales);
  perform tests.expect_eq((select count(*) from proofs), 2::bigint, 'sales sees proofs');
  perform tests.expect_eq((select count(*) from driver_locations where trip_id = v_trip), 2::bigint, 'sales sees locations');
  perform tests.logout();
  perform tests.expect_eq(round(haversine_m(24.0, 46.0, 24.0, 46.01)::numeric, -1), 1020::numeric, 'haversine ~1km');
end $$;
rollback;
