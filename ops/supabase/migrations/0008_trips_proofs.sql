-- Plan 3: trips, driver locations, proof of delivery.

create or replace function public.haversine_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable set search_path = public as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)))
$$;

-- Read policies (writes go through the functions below, except location inserts).
create policy trips_read on public.trips for select to authenticated
  using (app_role() in ('admin', 'sales') or driver_id = auth.uid());
create policy driver_locations_read on public.driver_locations for select to authenticated
  using (app_role() in ('admin', 'sales') or driver_id = auth.uid());
create policy driver_locations_insert on public.driver_locations for insert to authenticated
  with check (driver_id = auth.uid() and exists (
    select 1 from public.trips t where t.id = trip_id and t.driver_id = auth.uid() and t.ended_at is null));
create policy proofs_read on public.proofs for select to authenticated
  using (app_role() in ('admin', 'sales')
         or exists (select 1 from public.orders o where o.id = order_id and o.driver_id = auth.uid()));

-- Start a trip with every ready order assigned to the calling driver.
create function public.start_trip(p_lat double precision default null, p_lng double precision default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_trip uuid; v_wh uuid; r record;
begin
  if app_role() is distinct from 'driver' then raise exception 'not_authorized' using errcode = '42501'; end if;
  if exists (select 1 from trips where driver_id = auth.uid() and ended_at is null) then
    raise exception 'trip_already_active' using errcode = '22023';
  end if;
  if not exists (select 1 from orders where driver_id = auth.uid() and status = 'ready' and not external) then
    raise exception 'no_ready_orders' using errcode = '22023';
  end if;
  select id into v_wh from warehouses order by created_at limit 1;
  insert into trips (driver_id, warehouse_id) values (auth.uid(), v_wh) returning id into v_trip;
  for r in select id from orders where driver_id = auth.uid() and status = 'ready' and not external order by ready_at loop
    perform transition_order(r.id, 'on_the_way', jsonb_build_object('trip_id', v_trip));
    update orders set trip_id = v_trip where id = r.id;
  end loop;
  if p_lat is not null and p_lng is not null then
    insert into driver_locations (client_id, trip_id, driver_id, lat, lng, recorded_at)
    values (gen_random_uuid(), v_trip, auth.uid(), p_lat, p_lng, now());
  end if;
  return v_trip;
end $$;

-- Save the optimised stop order / ETAs for a trip. p_stops: [{"order_id":..., "seq":1, "eta":"…"}]
create function public.set_trip_route(p_trip uuid, p_stops jsonb, p_polyline text default null, p_distance_m integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_driver uuid; s jsonb;
begin
  select driver_id into v_driver from trips where id = p_trip;
  if v_driver is null then raise exception 'trip_not_found' using errcode = 'P0002'; end if;
  if not (v_driver = auth.uid() or app_role() in ('admin', 'sales')) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  for s in select * from jsonb_array_elements(coalesce(p_stops, '[]'::jsonb)) loop
    update orders set stop_seq = (s->>'seq')::int, eta = nullif(s->>'eta', '')::timestamptz
    where id = (s->>'order_id')::uuid and trip_id = p_trip and status = 'on_the_way';
  end loop;
  update trips set polyline = coalesce(p_polyline, polyline), distance_m = coalesce(p_distance_m, distance_m) where id = p_trip;
end $$;

-- Record delivered / not delivered for one stop. Idempotent on p_client_id (offline replays).
create function public.record_proof(
  p_client_id uuid, p_order_id uuid, p_outcome public.proof_outcome,
  p_reason_id uuid default null, p_note text default null, p_photo_path text default null,
  p_lat double precision default null, p_lng double precision default null, p_accuracy real default null,
  p_recorded_at timestamptz default now())
returns public.proofs language plpgsql security definer set search_path = public as $$
declare v_proof proofs; v_o orders; v_b branches; v_far boolean := false;
begin
  select * into v_proof from proofs where client_id = p_client_id;
  if found then return v_proof; end if;
  if app_role() is distinct from 'driver' then raise exception 'not_authorized' using errcode = '42501'; end if;
  select * into v_o from orders where id = p_order_id;
  if not found or v_o.driver_id is distinct from auth.uid() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_outcome = 'delivered' and coalesce(p_photo_path, '') = '' then
    raise exception 'photo_required' using errcode = '22023';
  end if;
  if p_outcome = 'failed' and p_reason_id is null then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select * into v_b from branches where id = v_o.branch_id;
  if p_lat is not null and p_lng is not null then
    v_far := haversine_m(p_lat, p_lng, v_b.lat, v_b.lng) > 300;
  end if;
  insert into proofs (client_id, order_id, outcome, reason_id, note, photo_path, lat, lng, accuracy_m, far_from_store, recorded_at)
  values (p_client_id, p_order_id, p_outcome, p_reason_id, nullif(trim(p_note), ''), p_photo_path, p_lat, p_lng, p_accuracy, v_far, p_recorded_at)
  returning * into v_proof;
  perform transition_order(p_order_id, p_outcome::text::order_status,
    jsonb_strip_nulls(jsonb_build_object('proof_id', v_proof.id, 'reason_id', p_reason_id, 'note', nullif(trim(p_note), ''), 'far_from_store', v_far)));
  return v_proof;
end $$;

create function public.end_trip(p_reason text default 'manual')
returns void language plpgsql security definer set search_path = public as $$
begin
  if app_role() is distinct from 'driver' then raise exception 'not_authorized' using errcode = '42501'; end if;
  if exists (select 1 from orders o join trips t on t.id = o.trip_id
             where t.driver_id = auth.uid() and t.ended_at is null and o.status = 'on_the_way') then
    raise exception 'stops_remaining' using errcode = '22023';
  end if;
  update trips set ended_at = now(), end_reason = coalesce(p_reason, 'manual')
  where driver_id = auth.uid() and ended_at is null;
end $$;

revoke execute on function public.haversine_m(double precision, double precision, double precision, double precision) from public;
revoke execute on function public.start_trip(double precision, double precision) from public;
revoke execute on function public.set_trip_route(uuid, jsonb, text, integer) from public;
revoke execute on function public.record_proof(uuid, uuid, public.proof_outcome, uuid, text, text, double precision, double precision, real, timestamptz) from public;
revoke execute on function public.end_trip(text) from public;
grant execute on function public.haversine_m(double precision, double precision, double precision, double precision) to authenticated;
grant execute on function public.start_trip(double precision, double precision) to authenticated;
grant execute on function public.set_trip_route(uuid, jsonb, text, integer) to authenticated;
grant execute on function public.record_proof(uuid, uuid, public.proof_outcome, uuid, text, text, double precision, double precision, real, timestamptz) to authenticated;
grant execute on function public.end_trip(text) to authenticated;

-- Supabase-only parts (not present in the local test cluster).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.driver_locations, public.trips;
  end if;
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('proofs', 'proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
    execute $p$create policy proofs_upload on storage.objects for insert to authenticated
      with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy proofs_view on storage.objects for select to authenticated
      using (bucket_id = 'proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.app_role() in ('admin', 'sales')))$p$;
  end if;
end $$;
