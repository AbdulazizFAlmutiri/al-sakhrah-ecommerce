-- Drivers need the store (customer) name for the stops on their own orders.
create policy customers_read_driver on public.customers for select to authenticated
  using (app_role() = 'driver' and exists (
    select 1 from public.branches b join public.orders o on o.branch_id = b.id
    where b.customer_id = customers.id and o.driver_id = auth.uid()));
