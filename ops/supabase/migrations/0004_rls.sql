alter table public.warehouses enable row level security;
alter table public.customers enable row level security;
alter table public.branches enable row level security;
alter table public.sales_reps enable row level security;
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.orders enable row level security;
alter table public.failure_reasons enable row level security;
alter table public.proofs enable row level security;
alter table public.driver_locations enable row level security;
alter table public.order_events enable row level security;
alter table public.login_attempts enable row level security;

revoke all on all tables in schema public from anon;

-- Reference data: everyone signed in reads, admin writes.
create policy warehouses_read on public.warehouses for select to authenticated using (true);
create policy warehouses_admin on public.warehouses for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy sales_reps_read on public.sales_reps for select to authenticated using (true);
create policy sales_reps_admin on public.sales_reps for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');
create policy failure_reasons_read on public.failure_reasons for select to authenticated using (true);
create policy failure_reasons_admin on public.failure_reasons for all to authenticated
  using (app_role() = 'admin') with check (app_role() = 'admin');

-- Profiles: office roles see everyone (to pick drivers); drivers see themselves. Writes via functions only.
create policy profiles_read on public.profiles for select to authenticated
  using (user_id = auth.uid() or app_role() in ('admin', 'sales', 'warehouse'));

-- Customers and branches
create policy customers_read on public.customers for select to authenticated
  using (app_role() in ('admin', 'sales', 'warehouse'));
create policy customers_write on public.customers for insert to authenticated
  with check (app_role() in ('admin', 'sales'));
create policy customers_update on public.customers for update to authenticated
  using (app_role() in ('admin', 'sales')) with check (app_role() in ('admin', 'sales'));
create policy branches_read on public.branches for select to authenticated
  using (app_role() in ('admin', 'sales', 'warehouse')
         or exists (select 1 from orders o where o.branch_id = branches.id and o.driver_id = auth.uid()));
create policy branches_write on public.branches for insert to authenticated
  with check (app_role() in ('admin', 'sales'));
create policy branches_update on public.branches for update to authenticated
  using (app_role() in ('admin', 'sales')) with check (app_role() in ('admin', 'sales'));

-- Orders: status only changes through transition_order (security definer).
create policy orders_read on public.orders for select to authenticated using (
  app_role() in ('admin', 'sales')
  or (app_role() = 'warehouse' and delivery_date = riyadh_today())
  or (app_role() = 'driver' and driver_id = auth.uid())
);
create policy orders_insert on public.orders for insert to authenticated
  with check (app_role() in ('admin', 'sales') and status = 'new' and created_by = auth.uid());
create policy orders_update on public.orders for update to authenticated
  using (app_role() in ('admin', 'sales') and status in ('new', 'ready'))
  with check (app_role() in ('admin', 'sales'));
revoke update on public.orders from authenticated;
grant update (branch_id, sales_rep_id, po_number, po_photo_path, driver_id, external, delivery_date, notes)
  on public.orders to authenticated;

create policy order_events_read on public.order_events for select to authenticated
  using (app_role() in ('admin', 'sales'));

-- trips, proofs, driver_locations: policies added in plan 3. login_attempts: functions only.

revoke execute on all functions in schema public from anon;
grant execute on function public.login_is_locked(text) to anon, authenticated;
grant execute on function public.record_login_attempt(text, boolean) to anon, authenticated;
revoke execute on function public._create_user(text, text, public.app_role, public.app_locale, text, boolean) from authenticated;
revoke execute on function public.bootstrap_admin(text, text, text) from authenticated;
