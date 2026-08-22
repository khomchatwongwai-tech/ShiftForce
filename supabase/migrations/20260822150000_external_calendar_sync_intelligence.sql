-- Workqora Production External Business Calendar Synchronization Migration
-- Multi-tenant isolation by organization_id & location_id with Row Level Security (RLS)

-- 1. Calendar Connections Table (Google Workspace, Microsoft 365, Apple CalDAV, ICS Feeds)
create table if not exists public.calendar_connections (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  employee_id text,
  provider text not null check (provider in ('google', 'microsoft', 'apple_caldav', 'ics_webcal')),
  account_email text not null,
  calendar_name text not null default 'Primary Calendar',
  external_calendar_id text,
  connection_type text not null default 'location' check (connection_type in ('organization', 'location', 'employee')),
  sync_direction text not null default 'two_way' check (sync_direction in ('two_way', 'workqora_to_external', 'external_to_workqora')),
  privacy_level text not null default 'free_busy_only' check (privacy_level in ('full_details', 'free_busy_only', 'work_hours_only')),
  color text not null default '#0284c7',
  is_active boolean not null default true,
  auto_sync_interval_minutes integer not null default 15 check (auto_sync_interval_minutes >= 5),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  sync_status text not null default 'synced' check (sync_status in ('synced', 'syncing', 'error', 'pending')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_conn_org_loc_idx on public.calendar_connections(organization_id, location_id);
create index if not exists calendar_conn_emp_idx on public.calendar_connections(employee_id);
create index if not exists calendar_conn_provider_idx on public.calendar_connections(provider);

-- 2. External Calendar Events (Catering, Buyouts, Private Dining, Maintenance, Holidays, OOO)
create table if not exists public.calendar_external_events (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  employee_id text,
  employee_name text,
  connection_id text references public.calendar_connections(id) on delete set null,
  provider text not null default 'ics_webcal' check (provider in ('google', 'microsoft', 'apple_caldav', 'ics_webcal')),
  external_event_id text,
  title text not null,
  description text,
  location text,
  event_date date not null,
  start_time text not null,
  end_time text not null,
  is_all_day boolean not null default false,
  is_busy boolean not null default true,
  privacy_level text not null default 'free_busy_only' check (privacy_level in ('full_details', 'free_busy_only', 'work_hours_only')),
  event_type text not null default 'custom' check (event_type in (
    'catering_event',
    'restaurant_buyout',
    'vip_reservation',
    'maintenance',
    'holiday',
    'payday',
    'employee_ooo',
    'personal_busy',
    'delivery_window',
    'custom'
  )),
  color text,
  attendees_count integer,
  revenue_forecast numeric(12,2),
  is_manager_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cal_ext_events_org_loc_idx on public.calendar_external_events(organization_id, location_id);
create index if not exists cal_ext_events_date_idx on public.calendar_external_events(event_date);
create index if not exists cal_ext_events_emp_idx on public.calendar_external_events(employee_id);

-- 3. Calendar Event Mappings (Idempotent tracking for Workqora Shift <-> External Calendar Event)
create table if not exists public.calendar_event_mappings (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  shift_id text not null references public.shifts(id) on delete cascade,
  connection_id text not null references public.calendar_connections(id) on delete cascade,
  external_event_id text not null,
  provider text not null check (provider in ('google', 'microsoft', 'apple_caldav', 'ics_webcal')),
  etag text,
  sync_hash text,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists cal_mappings_shift_conn_idx on public.calendar_event_mappings(shift_id, connection_id);
create index if not exists cal_mappings_ext_event_idx on public.calendar_event_mappings(external_event_id);

-- 4. Calendar Feed Subscriptions (Live Webcal & .ics tokens for Apple, Google, Outlook)
create table if not exists public.calendar_feed_subscriptions (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  employee_id text,
  department text,
  feed_type text not null check (feed_type in ('employee_personal', 'location_all_staff', 'department_schedule')),
  token text not null unique,
  name text not null,
  is_active boolean not null default true,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cal_feeds_org_loc_idx on public.calendar_feed_subscriptions(organization_id, location_id);
create index if not exists cal_feeds_token_idx on public.calendar_feed_subscriptions(token);

-- 5. Calendar Sync Logs
create table if not exists public.calendar_sync_logs (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  connection_id text references public.calendar_connections(id) on delete set null,
  provider text not null,
  account_email text not null,
  direction text not null,
  status text not null check (status in ('success', 'warning', 'error')),
  events_imported integer not null default 0,
  events_exported integer not null default 0,
  conflicts_found integer not null default 0,
  details text not null,
  created_at timestamptz not null default now()
);

create index if not exists cal_sync_logs_org_idx on public.calendar_sync_logs(organization_id, created_at desc);

-- Enable RLS on all tables
alter table public.calendar_connections enable row level security;
alter table public.calendar_external_events enable row level security;
alter table public.calendar_event_mappings enable row level security;
alter table public.calendar_feed_subscriptions enable row level security;
alter table public.calendar_sync_logs enable row level security;

-- Row Level Security Policies
create policy "Users can view calendar connections for accessible locations"
  on public.calendar_connections for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage calendar connections"
  on public.calendar_connections for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view external events for accessible locations"
  on public.calendar_external_events for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage external events"
  on public.calendar_external_events for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view event mappings for accessible locations"
  on public.calendar_event_mappings for select
  using (private.is_org_admin(organization_id));

create policy "Admins can manage event mappings"
  on public.calendar_event_mappings for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view feed subscriptions"
  on public.calendar_feed_subscriptions for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage feed subscriptions"
  on public.calendar_feed_subscriptions for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Admins can view calendar sync logs"
  on public.calendar_sync_logs for select
  using (private.is_org_admin(organization_id));

-- Grant access to authenticated and service_role
grant select, insert, update, delete on public.calendar_connections to authenticated, service_role;
grant select, insert, update, delete on public.calendar_external_events to authenticated, service_role;
grant select, insert, update, delete on public.calendar_event_mappings to authenticated, service_role;
grant select, insert, update, delete on public.calendar_feed_subscriptions to authenticated, service_role;
grant select, insert, update, delete on public.calendar_sync_logs to authenticated, service_role;
