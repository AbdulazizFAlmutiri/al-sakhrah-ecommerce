begin;
do $$
declare
  v_sales uuid := tests.make_user('sales2', 'sales');
  v_wh uuid := tests.make_user('wh2', 'warehouse');
  v_cust uuid; v_branch uuid; v_rep uuid; v_o uuid; v_reason uuid; v_row orders; v_before timestamptz;
begin
  insert into customers(name) values ('مترو ماركت') returning id into v_cust;
  insert into branches(customer_id, name, lat, lng) values (v_cust, 'لبن', 24.62, 46.58) returning id into v_branch;
  insert into sales_reps(name) values ('أبو عبدالله') returning id into v_rep;
  insert into orders(branch_id, sales_rep_id, po_number, external, created_by)
    values (v_branch, v_rep, 'PO-9', true, v_sales) returning id into v_o;
  select status_changed_at into v_before from orders where id = v_o;
  perform tests.expect_eq(v_before is not null, true, 'status_changed_at default');
  update orders set status_changed_at = now() - interval '1 hour' where id = v_o;

  perform tests.login(v_wh);
  v_row := transition_order(v_o, 'ready');
  perform tests.expect_eq(v_row.status_changed_at > now() - interval '1 minute', true, 'status_changed_at bumped');

  select id into v_reason from failure_reasons where code = 'closed';
  perform tests.login(v_sales);
  v_row := transition_order(v_o, 'failed', jsonb_build_object('reason_id', v_reason, 'note', 'مقفل الظهر'));
  perform tests.logout();
  perform tests.expect_eq(
    (select meta->>'reason_id' from order_events where order_id = v_o and to_status = 'failed'),
    v_reason::text, 'reason stored in event meta');
end $$;
rollback;
