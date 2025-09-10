-- Store files uploaded during application (e.g., updated resume)
create table if not exists public.application_files (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  file_name text,
  file_type text,
  file_size bigint,
  file_url text not null,
  storage_path text,
  file_category text default 'resume',
  created_at timestamptz not null default now()
);

create index if not exists app_files_app_idx on public.application_files(application_id);
create index if not exists app_files_candidate_idx on public.application_files(candidate_id);

-- Function and trigger to set company_id from applications
create or replace function public.set_application_files_company_id()
returns trigger as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id from public.applications where id = new.application_id;
  if v_company_id is null then
    raise exception 'Application % not found to set company_id', new.application_id;
  end if;
  new.company_id := v_company_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_application_files_set_company
before insert or update of application_id on public.application_files
for each row execute function public.set_application_files_company_id();

alter table public.application_files enable row level security;

create policy if not exists "read_application_files_in_company" on public.application_files
for select using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = application_files.company_id)
);

create policy if not exists "insert_application_files_in_company" on public.application_files
for insert with check (
  exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = application_files.company_id)
);

create policy if not exists "update_application_files_in_company" on public.application_files
for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = application_files.company_id)
);

create policy if not exists "delete_application_files_in_company" on public.application_files
for delete using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.company_id = application_files.company_id)
);
