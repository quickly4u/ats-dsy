-- Job Application Questions schema
-- Creates table to store per-job custom questions and an RPC to replace questions atomically

-- Safety: required extensions
create extension if not exists pgcrypto;

-- Table
create table if not exists public.job_application_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  question text not null,
  question_type text not null check (question_type in ('text','textarea','select','radio','checkbox','file')),
  is_required boolean not null default false,
  options text[] default null,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists job_application_questions_job_id_idx on public.job_application_questions(job_id);
create index if not exists job_application_questions_company_id_idx on public.job_application_questions(company_id);
create index if not exists job_application_questions_order_idx on public.job_application_questions(job_id, order_index);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_job_application_questions_updated_at
before update on public.job_application_questions
for each row execute function public.set_updated_at();

-- Trigger to copy company_id from jobs
create or replace function public.set_jaq_company_id()
returns trigger as $$
declare
  v_company_id uuid;
begin
  select company_id into v_company_id from public.jobs where id = new.job_id;
  if v_company_id is null then
    raise exception 'Job % not found to set company_id', new.job_id;
  end if;
  new.company_id := v_company_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_jaq_set_company
before insert or update of job_id on public.job_application_questions
for each row execute function public.set_jaq_company_id();

-- RLS
alter table public.job_application_questions enable row level security;

-- Policies: company scoped access
create policy "Read JAQ in company" on public.job_application_questions
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = job_application_questions.company_id
  )
);

create policy "Insert JAQ in company" on public.job_application_questions
for insert with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = job_application_questions.company_id
  )
);

create policy "Update JAQ in company" on public.job_application_questions
for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = job_application_questions.company_id
  )
);

create policy "Delete JAQ in company" on public.job_application_questions
for delete using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = job_application_questions.company_id
  )
);

-- RPC to atomically replace questions for a job
create or replace function public.replace_job_questions(
  p_job_id uuid,
  p_questions jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete existing
  delete from public.job_application_questions where job_id = p_job_id;

  -- Insert new if provided
  if p_questions is not null then
    insert into public.job_application_questions (job_id, company_id, question, question_type, is_required, options, order_index)
    select 
      p_job_id,
      j.company_id,
      coalesce(q->>'question','')::text,
      coalesce(q->>'type','text')::text,
      coalesce((q->>'required')::boolean, false),
      case 
        when (q ? 'options') then array(select jsonb_array_elements_text(q->'options'))
        else null
      end,
      coalesce((q->>'order_index')::int, idx)
    from jobs j
    cross join lateral jsonb_array_elements(p_questions) with ordinality as q(q, idx)
    where j.id = p_job_id;
  end if;
end;
$$;

grant execute on function public.replace_job_questions(uuid, jsonb) to authenticated, anon;
