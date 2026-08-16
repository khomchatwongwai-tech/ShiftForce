-- ShiftForce Supabase foundation
-- Firebase Auth is trusted through Supabase Third-Party Auth.
-- Firebase UIDs are text, so authorization uses auth.jwt()->>'sub' instead of auth.uid().

create schema if not exists private;
revoke all on schema private from public, anon;

-- Make Data API exposure opt-in for every future public object.
alter default privileges for role postgres in schema public revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke usage, select on sequences from anon, authenticated;

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  owner_firebase_uid text not null,
  plan_code text not null default 'free',
  active_location_count integer not null default 0 check (active_location_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id text not null references public.organizations(id) on delete cascade,
  firebase_uid text not null,
  role text not null check (role in ('owner','corporate_admin','regional_manager','general_manager','assistant_manager','employee')),
  region_ids text[] not null default '{}',
  location_ids text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id, firebase_uid)
);
create index if not exists organization_members_uid_idx on public.organization_members(firebase_uid) where active;

create or replace function private.current_firebase_uid()
returns text language sql stable security invoker
set search_path = ''
as $$ select auth.jwt()->>'sub' $$;

create or replace function private.has_org_access(org_id text)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.firebase_uid = auth.jwt()->>'sub'
      and m.active
  )
$$;

create or replace function private.is_org_admin(org_id text)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.firebase_uid = auth.jwt()->>'sub'
      and m.active
      and m.role in ('owner','corporate_admin')
  )
$$;

revoke all on function private.has_org_access(text) from public, anon;
revoke all on function private.is_org_admin(text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_org_access(text) to authenticated;
grant execute on function private.is_org_admin(text) to authenticated;

create table if not exists public.users (
  firebase_uid text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  email text,
  display_name text,
  role text not null,
  employee_id text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists users_org_idx on public.users(organization_id);

create table if not exists public.regions (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists regions_org_idx on public.regions(organization_id);

create table if not exists public.locations (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  region_id text references public.regions(id) on delete set null,
  name text not null,
  active boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists locations_org_active_idx on public.locations(organization_id, active);

create table if not exists public.departments (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists departments_org_location_idx on public.departments(organization_id, location_id);

create table if not exists public.employees (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  firebase_uid text,
  location_id text references public.locations(id) on delete set null,
  email text,
  display_name text,
  active boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists employees_org_idx on public.employees(organization_id);
create index if not exists employees_firebase_uid_idx on public.employees(firebase_uid) where firebase_uid is not null;

create or replace function private.can_access_location(org_id text, loc_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    left join public.locations l on l.id = loc_id and l.organization_id = org_id
    where m.organization_id = org_id and m.firebase_uid = auth.jwt()->>'sub' and m.active
      and (m.role in ('owner','corporate_admin') or loc_id = any(m.location_ids)
        or (l.region_id is not null and l.region_id = any(m.region_ids))
        or exists (select 1 from public.employees e where e.organization_id = org_id and e.location_id = loc_id and e.firebase_uid = auth.jwt()->>'sub' and e.active))
  )
$$;
create or replace function private.can_manage_location(org_id text, loc_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    left join public.locations l on l.id = loc_id and l.organization_id = org_id
    where m.organization_id = org_id and m.firebase_uid = auth.jwt()->>'sub' and m.active
      and m.role in ('owner','corporate_admin','regional_manager','general_manager','assistant_manager')
      and (m.role in ('owner','corporate_admin') or loc_id = any(m.location_ids) or (l.region_id is not null and l.region_id = any(m.region_ids)))
  )
$$;
create or replace function private.can_access_employee(org_id text, emp_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.employees e where e.id = emp_id and e.organization_id = org_id
    and (e.firebase_uid = auth.jwt()->>'sub' or private.can_access_location(org_id, e.location_id)))
$$;
create or replace function private.can_manage_employee(org_id text, emp_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.employees e where e.id = emp_id and e.organization_id = org_id
    and private.can_manage_location(org_id, e.location_id))
$$;
revoke all on function private.can_access_location(text,text) from public, anon;
revoke all on function private.can_manage_location(text,text) from public, anon;
revoke all on function private.can_access_employee(text,text) from public, anon;
revoke all on function private.can_manage_employee(text,text) from public, anon;
grant execute on function private.can_access_location(text,text) to authenticated;
grant execute on function private.can_manage_location(text,text) to authenticated;
grant execute on function private.can_access_employee(text,text) to authenticated;
grant execute on function private.can_manage_employee(text,text) to authenticated;

create table if not exists public.shifts (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete set null,
  employee_id text references public.employees(id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shifts_org_starts_idx on public.shifts(organization_id, starts_at desc);
create index if not exists shifts_employee_starts_idx on public.shifts(employee_id, starts_at desc);

create table if not exists public.punches (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete set null,
  employee_id text references public.employees(id) on delete cascade,
  punched_at timestamptz not null default now(),
  punch_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists punches_org_time_idx on public.punches(organization_id, punched_at desc);
create index if not exists punches_employee_time_idx on public.punches(employee_id, punched_at desc);

create table if not exists public.shift_trades (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_off_requests (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  employee_id text references public.employees(id) on delete set null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.shift_swap_requests (like public.time_off_requests including all);
create table if not exists public.sick_reports (like public.time_off_requests including all);
create table if not exists public.availability_requests (like public.time_off_requests including all);
create table if not exists public.shift_slot_requests (like public.time_off_requests including all);

create table if not exists public.announcements (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  created_by text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists announcements_org_time_idx on public.announcements(organization_id, created_at desc);

create table if not exists public.audit_logs (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  actor_firebase_uid text,
  action text,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_org_time_idx on public.audit_logs(organization_id, created_at desc);

create table if not exists public.organization_subscriptions (
  organization_id text primary key references public.organizations(id) on delete cascade,
  plan_code text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Explicit Data API grants (required for projects where automatic exposure is disabled).
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.users, public.regions, public.locations, public.departments, public.employees,
  public.shifts, public.punches, public.shift_trades, public.time_off_requests,
  public.shift_swap_requests, public.sick_reports, public.availability_requests,
  public.shift_slot_requests, public.announcements, public.organization_subscriptions
to authenticated;
grant select on public.organizations, public.organization_members, public.audit_logs to authenticated;

-- RLS
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','organization_members','users','regions','locations','departments','employees',
    'shifts','punches','shift_trades','time_off_requests','shift_swap_requests','sick_reports',
    'availability_requests','shift_slot_requests','announcements','audit_logs','organization_subscriptions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

create policy "org members read organization" on public.organizations for select to authenticated
using (private.has_org_access(id));
create policy "members read memberships" on public.organization_members for select to authenticated
using (firebase_uid = (auth.jwt()->>'sub') or private.is_org_admin(organization_id));

create policy "users read self" on public.users for select to authenticated
using (firebase_uid = (auth.jwt()->>'sub'));
create policy "users update self inside membership" on public.users for update to authenticated
using (firebase_uid = (auth.jwt()->>'sub') and private.has_org_access(organization_id))
with check (firebase_uid = (auth.jwt()->>'sub') and private.has_org_access(organization_id));

create policy "region assigned read" on public.regions for select to authenticated using (
  private.is_org_admin(organization_id) or exists (
    select 1 from public.organization_members m where m.organization_id = regions.organization_id
      and m.firebase_uid = auth.jwt()->>'sub' and m.active
      and (regions.id = any(m.region_ids) or exists (select 1 from public.locations l where l.region_id = regions.id and l.id = any(m.location_ids)))
  )
);
create policy "region corporate insert" on public.regions for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "region corporate update" on public.regions for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "region corporate delete" on public.regions for delete to authenticated using (private.is_org_admin(organization_id));

create policy "location assigned read" on public.locations for select to authenticated using (private.can_access_location(organization_id, id));
create policy "location corporate insert" on public.locations for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "location assigned update" on public.locations for update to authenticated using (private.can_manage_location(organization_id, id)) with check (private.can_manage_location(organization_id, id));
create policy "location corporate delete" on public.locations for delete to authenticated using (private.is_org_admin(organization_id));

create policy "department assigned read" on public.departments for select to authenticated using (private.can_access_location(organization_id, location_id));
create policy "department assigned insert" on public.departments for insert to authenticated with check (private.can_manage_location(organization_id, location_id));
create policy "department assigned update" on public.departments for update to authenticated using (private.can_manage_location(organization_id, location_id)) with check (private.can_manage_location(organization_id, location_id));
create policy "department assigned delete" on public.departments for delete to authenticated using (private.can_manage_location(organization_id, location_id));

create policy "employee assigned read" on public.employees for select to authenticated using (private.can_access_employee(organization_id, id));
create policy "employee assigned insert" on public.employees for insert to authenticated with check (private.can_manage_location(organization_id, location_id));
create policy "employee assigned update" on public.employees for update to authenticated using (private.can_manage_employee(organization_id, id)) with check (private.can_manage_location(organization_id, location_id));
create policy "employee assigned delete" on public.employees for delete to authenticated using (private.can_manage_employee(organization_id, id));

create policy "shift assigned read" on public.shifts for select to authenticated using (private.can_access_location(organization_id, location_id));
create policy "shift assigned insert" on public.shifts for insert to authenticated with check (private.can_manage_location(organization_id, location_id));
create policy "shift assigned update" on public.shifts for update to authenticated using (private.can_manage_location(organization_id, location_id)) with check (private.can_manage_location(organization_id, location_id));
create policy "shift assigned delete" on public.shifts for delete to authenticated using (private.can_manage_location(organization_id, location_id));

create policy "announcement org read" on public.announcements for select to authenticated using (private.has_org_access(organization_id));
create policy "announcement corporate insert" on public.announcements for insert to authenticated with check (private.is_org_admin(organization_id));
create policy "announcement corporate update" on public.announcements for update to authenticated using (private.is_org_admin(organization_id)) with check (private.is_org_admin(organization_id));
create policy "announcement corporate delete" on public.announcements for delete to authenticated using (private.is_org_admin(organization_id));

-- Requests: members read; own employee may create/update pending payload; admins can manage all.
do $$
declare t text;
begin
  foreach t in array array['shift_trades','time_off_requests','shift_swap_requests','sick_reports','availability_requests','shift_slot_requests'] loop
    execute format('create policy %I on public.%I for select to authenticated using (private.can_access_employee(organization_id, employee_id))', t || ' assigned read', t);
    execute format($p$
      create policy %I on public.%I for insert to authenticated
      with check (
        private.can_manage_employee(organization_id, employee_id)
        or exists (
          select 1 from public.employees e
          where e.id = employee_id and e.organization_id = organization_id
            and e.firebase_uid = (auth.jwt()->>'sub')
        )
      )
    $p$, t || ' own or admin insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (private.can_manage_employee(organization_id, employee_id)) with check (private.can_manage_employee(organization_id, employee_id))', t || ' assigned admin update', t);
  end loop;
end $$;

-- Punches: all members can read; employees can insert for themselves; admins can insert/update.
create policy "punch member read" on public.punches for select to authenticated
using (private.can_access_employee(organization_id, employee_id));
create policy "punch self or admin insert" on public.punches for insert to authenticated
with check (
  private.can_manage_employee(organization_id, employee_id)
  or exists (
    select 1 from public.employees e
    where e.id = employee_id and e.organization_id = organization_id
      and e.firebase_uid = (auth.jwt()->>'sub')
  )
);
create policy "punch admin update" on public.punches for update to authenticated
using (private.can_manage_employee(organization_id, employee_id))
with check (private.can_manage_employee(organization_id, employee_id));

create policy "audit admin read" on public.audit_logs for select to authenticated
using (private.is_org_admin(organization_id));

create policy "subscription member read" on public.organization_subscriptions for select to authenticated
using (private.has_org_access(organization_id));

-- Realtime for core live workforce tables.
do $$
declare t text;
begin
  foreach t in array array[
    'users','employees','shifts','punches','shift_trades','time_off_requests','shift_swap_requests',
    'sick_reports','availability_requests','shift_slot_requests','announcements','audit_logs'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Private storage bucket for workforce attachments.
insert into storage.buckets (id, name, public)
values ('shiftforce-files','shiftforce-files',false)
on conflict (id) do update set public=false;

create policy "shiftforce organization file read" on storage.objects for select to authenticated
using (bucket_id='shiftforce-files' and private.has_org_access((storage.foldername(name))[1]));
create policy "shiftforce uid scoped file upload" on storage.objects for insert to authenticated
with check (bucket_id='shiftforce-files' and private.has_org_access((storage.foldername(name))[1]) and (storage.foldername(name))[2] = (auth.jwt()->>'sub'));
create policy "shiftforce owner file update" on storage.objects for update to authenticated
using (bucket_id='shiftforce-files' and owner_id = (auth.jwt()->>'sub') and private.has_org_access((storage.foldername(name))[1]))
with check (bucket_id='shiftforce-files' and owner_id = (auth.jwt()->>'sub') and private.has_org_access((storage.foldername(name))[1]) and (storage.foldername(name))[2] = (auth.jwt()->>'sub'));
create policy "shiftforce owner file delete" on storage.objects for delete to authenticated
using (bucket_id='shiftforce-files' and owner_id = (auth.jwt()->>'sub') and private.has_org_access((storage.foldername(name))[1]));
