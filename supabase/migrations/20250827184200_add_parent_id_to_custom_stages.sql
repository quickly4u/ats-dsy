-- Add hierarchical parent-child support for custom_stages
-- Adds parent_id (self-referencing) with ON DELETE SET NULL and relevant indexes

alter table if exists public.custom_stages
  add column if not exists parent_id uuid null;

alter table if exists public.custom_stages
  add constraint custom_stages_parent_fk
  foreign key (parent_id)
  references public.custom_stages (id)
  on delete set null;

-- Helpful indexes
create index if not exists idx_custom_stages_parent_id on public.custom_stages(parent_id);
create index if not exists idx_custom_stages_company_parent_order on public.custom_stages(company_id, parent_id, order_index);
