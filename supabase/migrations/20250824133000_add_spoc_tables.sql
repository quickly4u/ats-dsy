-- SPOC tables and RLS
-- Create tables for external and internal SPOCs and their client assignments

-- External SPOCs: client-side PoCs
create table if not exists public.external_spocs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  designation text not null,
  department text,
  is_primary boolean not null default false,
  avatar text,
  linkedin_url text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, client_id, email)
);

-- Internal SPOCs: our team PoCs
create table if not exists public.internal_spocs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete cascade,
  level text not null check (level in ('primary','secondary')),
  is_active boolean not null default true,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- Mapping internal SPOCs to clients
create table if not exists public.internal_spoc_clients (
  internal_spoc_id uuid not null references public.internal_spocs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (internal_spoc_id, client_id)
);

-- Ensure updated_at triggers exist (drop then create to avoid duplicates)
drop trigger if exists set_external_spocs_updated_at on public.external_spocs;
create trigger set_external_spocs_updated_at
before update on public.external_spocs
for each row execute function public.set_updated_at();

drop trigger if exists set_internal_spocs_updated_at on public.internal_spocs;
create trigger set_internal_spocs_updated_at
before update on public.internal_spocs
for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.external_spocs enable row level security;
alter table public.internal_spocs enable row level security;
alter table public.internal_spoc_clients enable row level security;

-- Policies: company scoped access
-- external_spocs
create policy if not exists "Select external_spocs by company" on public.external_spocs
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = external_spocs.company_id
  )
);

create policy if not exists "Insert external_spocs for own company" on public.external_spocs
for insert with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = external_spocs.company_id
  )
);

create policy if not exists "Update external_spocs for own company" on public.external_spocs
for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = external_spocs.company_id
  )
);

create policy if not exists "Delete external_spocs for own company" on public.external_spocs
for delete using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = external_spocs.company_id
  )
);

-- internal_spocs
create policy if not exists "Select internal_spocs by company" on public.internal_spocs
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = internal_spocs.company_id
  )
);

create policy if not exists "Insert internal_spocs for own company" on public.internal_spocs
for insert with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = internal_spocs.company_id
  )
);

create policy if not exists "Update internal_spocs for own company" on public.internal_spocs
for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = internal_spocs.company_id
  )
);

create policy if not exists "Delete internal_spocs for own company" on public.internal_spocs
for delete using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = internal_spocs.company_id
  )
);

-- internal_spoc_clients: scope by the parent internal_spoc company
create policy if not exists "Select internal_spoc_clients by company" on public.internal_spoc_clients
for select using (
  exists (
    select 1 from public.internal_spocs s
    join public.users u on u.id = auth.uid()
    where s.id = internal_spoc_id and s.company_id = u.company_id
  )
);

create policy if not exists "Insert internal_spoc_clients for own company" on public.internal_spoc_clients
for insert with check (
  exists (
    select 1 from public.internal_spocs s
    join public.users u on u.id = auth.uid()
    where s.id = internal_spoc_id and s.company_id = u.company_id
  )
);

create policy if not exists "Delete internal_spoc_clients for own company" on public.internal_spoc_clients
for delete using (
  exists (
    select 1 from public.internal_spocs s
    join public.users u on u.id = auth.uid()
    where s.id = internal_spoc_clients.internal_spoc_id and s.company_id = u.company_id
  )
);
