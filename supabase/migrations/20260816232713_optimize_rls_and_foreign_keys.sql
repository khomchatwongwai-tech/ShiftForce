-- Cover every foreign key used by tenant and location access paths.
create index if not exists locations_region_id_idx on public.locations(region_id);
create index if not exists departments_location_id_idx on public.departments(location_id);
create index if not exists employees_location_id_idx on public.employees(location_id);
create index if not exists shifts_location_id_idx on public.shifts(location_id);
create index if not exists punches_location_id_idx on public.punches(location_id);
create index if not exists shift_trades_organization_id_idx on public.shift_trades(organization_id);
create index if not exists shift_trades_employee_id_idx on public.shift_trades(employee_id);
create index if not exists time_off_requests_organization_id_idx on public.time_off_requests(organization_id);
create index if not exists time_off_requests_employee_id_idx on public.time_off_requests(employee_id);

-- Cache the Firebase JWT lookup once per statement instead of once per row.
drop policy if exists "members read memberships" on public.organization_members;
create policy "members read memberships" on public.organization_members for select to authenticated
using (firebase_uid = ((select auth.jwt())->>'sub') or private.is_org_admin(organization_id));

drop policy if exists "users read self" on public.users;
create policy "users read self" on public.users for select to authenticated
using (firebase_uid = ((select auth.jwt())->>'sub'));

drop policy if exists "users update self inside membership" on public.users;
create policy "users update self inside membership" on public.users for update to authenticated
using (firebase_uid = ((select auth.jwt())->>'sub') and private.has_org_access(organization_id))
with check (firebase_uid = ((select auth.jwt())->>'sub') and private.has_org_access(organization_id));

drop policy if exists "region assigned read" on public.regions;
create policy "region assigned read" on public.regions for select to authenticated using (
  private.is_org_admin(organization_id) or exists (
    select 1 from public.organization_members m where m.organization_id = regions.organization_id
      and m.firebase_uid = ((select auth.jwt())->>'sub') and m.active
      and (regions.id = any(m.region_ids) or exists (
        select 1 from public.locations l where l.region_id = regions.id and l.id = any(m.location_ids)
      ))
  )
);

do $$
declare t text;
begin
  foreach t in array array['shift_trades','time_off_requests','shift_swap_requests','sick_reports','availability_requests','shift_slot_requests'] loop
    execute format('drop policy if exists %I on public.%I', t || ' own or admin insert', t);
    execute format($policy$
      create policy %I on public.%I for insert to authenticated
      with check (
        private.can_manage_employee(organization_id, employee_id)
        or exists (
          select 1 from public.employees e
          where e.id = employee_id and e.organization_id = organization_id
            and e.firebase_uid = ((select auth.jwt())->>'sub')
        )
      )
    $policy$, t || ' own or admin insert', t);
  end loop;
end $$;

drop policy if exists "punch self or admin insert" on public.punches;
create policy "punch self or admin insert" on public.punches for insert to authenticated
with check (
  private.can_manage_employee(organization_id, employee_id)
  or exists (
    select 1 from public.employees e
    where e.id = employee_id and e.organization_id = organization_id
      and e.firebase_uid = ((select auth.jwt())->>'sub')
  )
);
