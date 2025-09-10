-- Stores candidate responses to job application questions
create table if not exists public.application_question_responses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  job_question_id uuid not null references public.job_application_questions(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  answer_text text,
  answer_multi text[],
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aqr_application_id_idx on public.application_question_responses(application_id);
create index if not exists aqr_job_question_id_idx on public.application_question_responses(job_question_id);

-- Keep updated_at fresh
create trigger set_aqr_updated_at
before update on public.application_question_responses
for each row execute function public.set_updated_at();

-- Trigger to copy company_id from applications
create or replace function public.set_aqr_company_id()
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

create trigger trg_aqr_set_company
before insert or update of application_id on public.application_question_responses
for each row execute function public.set_aqr_company_id();

-- RLS
alter table public.application_question_responses enable row level security;

create policy "Read AQR in company" on public.application_question_responses
for select using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.company_id = application_question_responses.company_id
  )
);

create policy "Insert AQR in company" on public.application_question_responses
for insert with check (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.company_id = application_question_responses.company_id
  )
);

create policy "Update AQR in company" on public.application_question_responses
for update using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.company_id = application_question_responses.company_id
  )
);

create policy "Delete AQR in company" on public.application_question_responses
for delete using (
  exists (
    select 1 from public.users u where u.id = auth.uid() and u.company_id = application_question_responses.company_id
  )
);
