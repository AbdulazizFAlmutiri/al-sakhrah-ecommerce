-- Al-Sakhrah quality system (نظام الجودة) — initial schema.
-- Reads: any signed-in, active staff member (row level security).
-- Writes: only through the app's server code, which checks the user's role
-- and then uses the service role. Browsers never write tables directly.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- roles & people
create type public.app_role as enum ('admin', 'manager', 'inspector');

create table public.departments (
  code     text primary key,                 -- QC, PR, WH, MO, HR, TECH …
  name_ar  text not null,
  name_en  text not null,
  sort     int  not null default 100,
  holds_copies boolean not null default true -- appears in "distributed copies"
);

create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  username   text not null unique,           -- e.g. qc@alsakhrah.com
  role       public.app_role not null default 'manager',
  department text references public.departments (code),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.active);
$$;

-- ---------------------------------------------------------------- documents
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- SOP-QC-0001, QMD-QC-0001
  title_ar    text not null,
  title_en    text,
  doc_type    text not null default 'sop' check (doc_type in ('sop', 'manual')),
  department  text not null references public.departments (code),
  version     text not null default '1.0',
  status      text not null default 'active' check (status in ('active', 'obsolete')),
  prepared_at date,
  reviewed_at date,
  approved_at date,
  issued_at   date,
  effective_at date,
  implementation_start_at date,
  next_review_at date generated always as ((issued_at + interval '2 years')::date) stored,
  file_ar     text,                          -- storage path of the approved Arabic original
  file_en     text,
  sort        int not null default 100,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.forms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,          -- F01-QC-0001
  title_ar    text not null,
  title_en    text,
  document_id uuid not null references public.documents (id) on delete cascade,
  file        text,
  sort        int not null default 100,
  created_at  timestamptz not null default now()
);

-- Controlled copies: one row per copy handed to a department.
create table public.distributed_copies (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  copy_number  int  not null check (copy_number > 0),
  department   text not null references public.departments (code),
  status       text not null default 'distributed' check (status in ('distributed', 'cancelled')),
  issued_at    date not null default current_date,
  withdrawn_at date,
  withdraw_reason text,
  unique (document_id, copy_number)
);

-- ---------------------------------------------------------------- self-assessment
create table public.clauses (
  number      int primary key check (number > 0),
  text_ar     text not null,
  text_en     text,
  reference   text,                          -- regulator reference, e.g. "1/2/4"
  severity    text not null default 'minor' check (severity in ('minor', 'major')),
  assessor_notes   text,
  inspection_notes text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);

-- Official papers, calibration certificates and contracts share one table.
create table public.papers (
  id         uuid primary key default gen_random_uuid(),
  category   text not null check (category in ('general', 'calibration', 'contract')),
  title_ar   text not null,
  title_en   text,
  file       text,
  sort       int not null default 100,
  created_at timestamptz not null default now()
);

create table public.clause_evidence (
  id            uuid primary key default gen_random_uuid(),
  clause_number int  not null references public.clauses (number) on delete cascade,
  document_id   uuid references public.documents (id) on delete cascade,
  form_id       uuid references public.forms (id) on delete cascade,
  paper_id      uuid references public.papers (id) on delete cascade,
  label         text,
  file          text,                        -- a standalone attachment
  created_at    timestamptz not null default now(),
  check (num_nonnulls(document_id, form_id, paper_id, file) = 1)
);

create table public.audit_log (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  user_id   uuid references auth.users (id),
  action    text not null,
  entity    text not null,
  entity_id text,
  details   jsonb
);

create index on public.forms (document_id);
create index on public.distributed_copies (document_id);
create index on public.distributed_copies (department);
create index on public.clause_evidence (clause_number);
create index on public.documents (department);

-- ---------------------------------------------------------------- row level security
do $$
declare t text;
begin
  foreach t in array array['departments','profiles','documents','forms','distributed_copies',
                           'clauses','papers','clause_evidence','audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "active staff can read" on public.%I for select to authenticated using (public.is_active_user())', t);
  end loop;
end $$;

-- Private bucket for every PDF; files are streamed through the app after a login check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('files', 'files', false, 52428800, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------- departments
insert into public.departments (code, name_ar, name_en, sort, holds_copies) values
  ('TECH', 'الإدارة الفنية',          'Technical',               10, true),
  ('QC',   'الجودة',                  'Quality control',         20, true),
  ('PR',   'الإنتاج',                 'Production',              30, true),
  ('WH',   'المستودعات',              'Warehouses',              40, true),
  ('MO',   'الصيانة والتشغيل',         'Maintenance & operation', 50, true),
  ('HR',   'الموارد البشرية',          'Human resources',         60, true),
  ('CL',   'النظافة',                 'Cleaning',                70, true),
  ('MS',   'التسويق والمبيعات',        'Marketing & sales',       80, true),
  ('PU',   'المشتريات',               'Purchasing',              90, true)
on conflict (code) do nothing;
