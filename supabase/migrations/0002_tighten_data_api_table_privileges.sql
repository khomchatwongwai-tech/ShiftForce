-- Remove broad Supabase default table privileges that bypass or sit outside RLS.
alter default privileges for role postgres in schema public
revoke all on tables from anon, authenticated;

revoke all privileges on
  public.organizations,
  public.organization_members,
  public.users,
  public.regions,
  public.locations,
  public.departments,
  public.employees,
  public.shifts,
  public.punches,
  public.shift_trades,
  public.time_off_requests,
  public.shift_swap_requests,
  public.sick_reports,
  public.availability_requests,
  public.shift_slot_requests,
  public.announcements,
  public.audit_logs,
  public.organization_subscriptions
from anon, authenticated;

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.users,
  public.regions,
  public.locations,
  public.departments,
  public.employees,
  public.shifts,
  public.punches,
  public.shift_trades,
  public.time_off_requests,
  public.shift_swap_requests,
  public.sick_reports,
  public.availability_requests,
  public.shift_slot_requests,
  public.announcements,
  public.organization_subscriptions
to authenticated;

grant select on
  public.organizations,
  public.organization_members,
  public.audit_logs
to authenticated;
