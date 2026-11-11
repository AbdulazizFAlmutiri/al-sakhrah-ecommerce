create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'sales', 'warehouse', 'driver');
create type public.app_locale as enum ('ar', 'en', 'ur');
create type public.order_status as enum ('new', 'ready', 'on_the_way', 'delivered', 'failed', 'cancelled');
create type public.proof_outcome as enum ('delivered', 'failed');

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  name text not null,
  phone text,
  google_place_id text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address_text text,
  created_at timestamptz not null default now(),
  unique (customer_id, name)
);

create table public.sales_reps (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,32}$'),
  full_name text not null,
  role public.app_role not null,
  locale public.app_locale not null default 'ar',
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(user_id),
  warehouse_id uuid not null references public.warehouses(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in ('manual', 'geofence', 'timeout')),
  polyline text,
  distance_m integer
);
create unique index trips_one_active_per_driver on public.trips(driver_id) where ended_at is null;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  sales_rep_id uuid not null references public.sales_reps(id),
  po_number text not null check (length(trim(po_number)) > 0),
  po_photo_path text,
  driver_id uuid references public.profiles(user_id),
  external boolean not null default false,
  delivery_date date not null default ((now() at time zone 'Asia/Riyadh')::date),
  status public.order_status not null default 'new',
  notes text,
  trip_id uuid references public.trips(id),
  stop_seq integer,
  eta timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  created_by uuid not null references public.profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint driver_or_external check ((driver_id is not null and not external) or (driver_id is null and external))
);
create index orders_date_status on public.orders(delivery_date, status);
create index orders_driver_date on public.orders(driver_id, delivery_date);

create table public.failure_reasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]{2,32}$'),
  label_ar text not null,
  label_en text not null,
  label_ur text not null,
  icon text not null,
  active boolean not null default true,
  sort integer not null default 0
);

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  outcome public.proof_outcome not null,
  reason_id uuid references public.failure_reasons(id),
  note text,
  photo_path text,
  lat double precision,
  lng double precision,
  accuracy_m real,
  far_from_store boolean not null default false,
  recorded_at timestamptz not null,
  synced_at timestamptz not null default now()
);

create table public.driver_locations (
  id bigint generated always as identity primary key,
  client_id uuid not null unique,
  trip_id uuid not null references public.trips(id) on delete cascade,
  driver_id uuid not null references public.profiles(user_id),
  lat double precision not null,
  lng double precision not null,
  accuracy_m real,
  speed real,
  recorded_at timestamptz not null
);
create index driver_locations_latest on public.driver_locations(driver_id, recorded_at desc);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references auth.users(id),
  from_status public.order_status,
  to_status public.order_status not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index order_events_order on public.order_events(order_id, created_at);

create table public.login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);
create index login_attempts_user_time on public.login_attempts(username, attempted_at desc);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create function public.check_order_driver() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.driver_id is not null and not exists (
    select 1 from profiles where user_id = new.driver_id and role = 'driver' and active
  ) then
    raise exception 'invalid_driver' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger orders_driver_check before insert or update of driver_id on public.orders
  for each row execute function public.check_order_driver();
