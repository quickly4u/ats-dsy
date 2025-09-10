-- Repoint stage foreign keys from public.stages to public.custom_stages
-- This migration aligns DB schema with the custom stages system used by the app

begin;

-- Drop existing FKs referencing public.stages to allow updates
alter table if exists public.application_stage_history
  drop constraint if exists application_stage_history_from_stage_id_fkey;
alter table if exists public.application_stage_history
  drop constraint if exists application_stage_history_to_stage_id_fkey;
alter table if exists public.applications
  drop constraint if exists applications_stage_id_fkey;

-- Map applications.stage_id from stages -> custom_stages by name within company
update public.applications a
set stage_id = cs.id
from public.stages s, public.custom_stages cs
where a.stage_id = s.id
  and cs.name = s.name
  and cs.company_id = a.company_id;

-- Fallback 1: default application-type custom stage per company
with cs_def as (
  select distinct on (company_id) company_id, id
  from public.custom_stages
  where is_active = true and stage_type = 'application' and is_default = true
  order by company_id, order_index asc
)
update public.applications a
set stage_id = cs_def.id
from cs_def
where not exists (select 1 from public.custom_stages c where c.id = a.stage_id)
  and a.company_id = cs_def.company_id;

-- Fallback 2: first active custom stage per company
with first_stage as (
  select distinct on (company_id) company_id, id
  from public.custom_stages
  where is_active = true
  order by company_id, order_index asc
)
update public.applications a
set stage_id = fs.id
from first_stage fs
where not exists (select 1 from public.custom_stages c where c.id = a.stage_id)
  and a.company_id = fs.company_id;

-- Map application_stage_history.from_stage_id by app.company_id + stage name
update public.application_stage_history ash
set from_stage_id = cs.id
from public.applications a, public.stages s, public.custom_stages cs
where ash.application_id = a.id
  and ash.from_stage_id = s.id
  and cs.name = s.name
  and cs.company_id = a.company_id;

-- Map application_stage_history.to_stage_id similarly
update public.application_stage_history ash
set to_stage_id = cs.id
from public.applications a, public.stages s, public.custom_stages cs
where ash.application_id = a.id
  and ash.to_stage_id = s.id
  and cs.name = s.name
  and cs.company_id = a.company_id;

-- Fallbacks for any unmapped history rows
with first_stage as (
  select distinct on (company_id) company_id, id
  from public.custom_stages
  where is_active = true
  order by company_id, order_index asc
)
update public.application_stage_history ash
set from_stage_id = fs.id
from public.applications a
join first_stage fs on fs.company_id = a.company_id
where ash.application_id = a.id
  and not exists (select 1 from public.custom_stages c where c.id = ash.from_stage_id);

with first_stage as (
  select distinct on (company_id) company_id, id
  from public.custom_stages
  where is_active = true
  order by company_id, order_index asc
)
update public.application_stage_history ash
set to_stage_id = fs.id
from public.applications a
join first_stage fs on fs.company_id = a.company_id
where ash.application_id = a.id
  and not exists (select 1 from public.custom_stages c where c.id = ash.to_stage_id);

-- Recreate FKs to reference public.custom_stages
alter table public.applications
  add constraint applications_stage_id_fkey
  foreign key (stage_id) references public.custom_stages(id) on delete restrict;

alter table public.application_stage_history
  add constraint application_stage_history_from_stage_id_fkey
  foreign key (from_stage_id) references public.custom_stages(id) on delete set null;

alter table public.application_stage_history
  add constraint application_stage_history_to_stage_id_fkey
  foreign key (to_stage_id) references public.custom_stages(id) on delete restrict;

commit;
