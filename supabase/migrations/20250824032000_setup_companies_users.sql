-- Enable required extensions
create extension if not exists pgcrypto;

-- Companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  size text,
  subscription_plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Users table (application users; separate from auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  email text not null,
  first_name text,
  last_name text,
  avatar text,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Ensure updated_at exists on existing tables
alter table if exists public.companies add column if not exists updated_at timestamptz not null default now();
alter table if exists public.users add column if not exists updated_at timestamptz not null default now();

-- Attach updated_at triggers
create trigger set_companies_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

-- RLS
alter table public.companies enable row level security;
alter table public.users enable row level security;

-- Policies: users can view/update only their own user row
create policy "Users can view own row" on public.users
for select using (id = auth.uid());

create policy "Users can update own row" on public.users
for update using (id = auth.uid());

-- Policy: users can view their own company only
create policy "Users can view own company" on public.companies
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.company_id = companies.id
  )
);

-- Signup trigger: create company and user rows on new auth user
create or replace function public.handle_auth_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  company jsonb := coalesce(md->'company', '{}'::jsonb);
  v_company_id uuid;
  v_company_name text := coalesce(company->>'name', '');
  v_company_slug text := coalesce(company->>'slug', '');
  v_company_size text := company->>'size';
  v_subscription_plan text := coalesce(company->>'subscriptionPlan', 'free');
  v_first_name text := coalesce(md->>'firstName', md->>'first_name');
  v_last_name text := coalesce(md->>'lastName', md->>'last_name');
  v_avatar text := coalesce(md->>'avatar_url', md->>'avatar');
begin
  -- derive slug if missing
  if v_company_slug = '' and v_company_name <> '' then
    v_company_slug := regexp_replace(lower(v_company_name), '[^a-z0-9\s-]', '', 'g');
    v_company_slug := regexp_replace(v_company_slug, '\s+', '-', 'g');
    v_company_slug := regexp_replace(v_company_slug, '-+', '-', 'g');
  end if;

  -- upsert company if we have basic details
  if v_company_name <> '' and v_company_slug <> '' then
    insert into public.companies as c (name, slug, size, subscription_plan)
    values (v_company_name, v_company_slug, v_company_size, v_subscription_plan)
    on conflict (slug) do update set
      name = excluded.name,
      size = excluded.size,
      subscription_plan = excluded.subscription_plan,
      updated_at = now()
    returning c.id into v_company_id;
  end if;

  -- create application user profile row
  insert into public.users (id, company_id, email, first_name, last_name, avatar)
  values (new.id, v_company_id, new.email, v_first_name, v_last_name, v_avatar)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Ensure trigger exists on auth.users
create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_signup();

-- Grants: allow authenticated users to use the function (not strictly required for trigger)
grant execute on function public.handle_auth_user_signup() to authenticated, anon;
