create function public.app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from profiles where user_id = auth.uid() and active
$$;

create function public.riyadh_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Riyadh')::date
$$;

-- Single entry point for every order status change. Mirrors lib/orders/status.ts.
create function public.transition_order(p_order_id uuid, p_to public.order_status, p_meta jsonb default '{}'::jsonb)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_role app_role := app_role();
  v_o orders;
  v_from order_status;
  v_office boolean;
  v_ok boolean;
  v_resched boolean;
begin
  if v_role is null then raise exception 'not_authorized' using errcode = '42501'; end if;
  select * into v_o from orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  v_from := v_o.status;
  v_office := v_role in ('sales', 'admin');

  v_ok := case
    when v_from = 'new' and p_to = 'ready' then v_role in ('warehouse', 'admin')
    when v_from = 'ready' and p_to = 'new' then v_role in ('warehouse', 'admin')
    when v_from = 'ready' and p_to = 'on_the_way' then v_role = 'driver' and not v_o.external and v_o.driver_id = auth.uid()
    when v_from = 'on_the_way' and p_to in ('delivered', 'failed') then v_role = 'driver' and v_o.driver_id = auth.uid()
    when v_from = 'ready' and p_to in ('delivered', 'failed') then v_office and v_o.external
    when v_from = 'failed' and p_to in ('new', 'cancelled') then v_office
    when v_from in ('new', 'ready') and p_to = 'cancelled' then v_office
    else false
  end;
  if not v_ok then raise exception 'invalid_transition' using errcode = '22023'; end if;

  if v_from = 'ready' and p_to = 'new' and v_role = 'warehouse'
     and v_o.ready_at < now() - interval '5 minutes' then
    raise exception 'undo_window_passed' using errcode = '22023';
  end if;

  v_resched := v_from = 'failed' and p_to = 'new';

  update orders set
    status = p_to,
    ready_at = case when p_to = 'ready' then now() when p_to = 'new' then null else ready_at end,
    delivered_at = case when p_to = 'delivered' then now() else delivered_at end,
    delivery_date = case when v_resched and p_meta ? 'delivery_date'
                         then (p_meta->>'delivery_date')::date else delivery_date end,
    external = case when v_resched and p_meta ? 'external'
                    then (p_meta->>'external')::boolean else external end,
    driver_id = case when v_resched and p_meta ? 'external'
                     then case when (p_meta->>'external')::boolean then null else (p_meta->>'driver_id')::uuid end
                     else driver_id end,
    trip_id = case when p_to = 'new' then null else trip_id end,
    stop_seq = case when p_to = 'new' then null else stop_seq end,
    eta = case when p_to in ('new', 'delivered', 'failed', 'cancelled') then null else eta end
  where id = p_order_id
  returning * into v_o;

  insert into order_events(order_id, actor_id, from_status, to_status, meta)
  values (p_order_id, auth.uid(), v_from, p_to, coalesce(p_meta, '{}'::jsonb));

  return v_o;
end $$;
