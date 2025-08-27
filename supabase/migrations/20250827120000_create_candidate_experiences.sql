-- candidate_experiences: store candidate work history with location
create table if not exists public.candidate_experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  company text not null,
  title text not null,
  location text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_candidate_experiences_candidate_id on public.candidate_experiences(candidate_id);
create index if not exists idx_candidate_experiences_company_id on public.candidate_experiences(company_id);

-- Keep updated_at fresh
create trigger set_candidate_experiences_updated_at
before update on public.candidate_experiences
for each row execute function public.set_updated_at();

-- Ensure company_id is aligned with candidate's company via trigger
create or replace function public.set_candidate_experience_company_id()
returns trigger as $$
begin
  if new.company_id is null then
    select c.company_id into new.company_id
    from public.candidates c
    where c.id = new.candidate_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_set_candidate_experience_company
before insert on public.candidate_experiences
for each row execute function public.set_candidate_experience_company_id();

-- RLS
alter table public.candidate_experiences enable row level security;

create policy "Select candidate_experiences by company" on public.candidate_experiences
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = candidate_experiences.company_id
  )
);

create policy "Insert candidate_experiences by company" on public.candidate_experiences
for insert with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = candidate_experiences.company_id
  )
);

create policy "Update candidate_experiences by company" on public.candidate_experiences
for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = candidate_experiences.company_id
  )
);

create policy "Delete candidate_experiences by company" on public.candidate_experiences
for delete using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = candidate_experiences.company_id
  )
);
