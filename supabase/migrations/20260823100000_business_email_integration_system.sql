-- Workqora Production Business Email Integration System Migration
-- Multi-tenant isolation by organization_id & location_id with Row Level Security (RLS)

-- 1. Email Connections Table (Google Workspace, Microsoft 365, IMAP/SMTP, Enterprise)
create table if not exists public.email_connections (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  region_id text,
  district_id text,
  department_id text,
  scope_level text not null default 'location' check (scope_level in ('organization', 'region', 'district', 'location', 'department')),
  provider text not null check (provider in ('google', 'microsoft', 'imap_smtp', 'enterprise_custom')),
  email_address text not null,
  display_name text not null,
  category text not null default 'general' check (category in ('general', 'operations', 'manager', 'hiring', 'inventory', 'foh', 'kitchen', 'billing')),
  connection_status text not null default 'connected' check (connection_status in ('connected', 'syncing', 'needs_reauthorization', 'permission_changed', 'error', 'disconnected')),
  scopes text[] not null default '{}'::text[],
  is_default_org_sender boolean not null default false,
  is_default_location_sender boolean not null default false,
  auto_sync_interval_minutes integer not null default 15 check (auto_sync_interval_minutes >= 5),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  error_message text,
  smtp_host text,
  smtp_port integer,
  imap_host text,
  imap_port integer,
  signature text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_conn_org_loc_idx on public.email_connections(organization_id, location_id);
create index if not exists email_conn_provider_idx on public.email_connections(provider);
create index if not exists email_conn_address_idx on public.email_connections(email_address);

-- 2. Email Permissions Table (Mailbox RBAC Mapping)
create table if not exists public.email_permissions (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  connection_id text not null references public.email_connections(id) on delete cascade,
  role_code text not null,
  can_read boolean not null default true,
  can_send boolean not null default false,
  can_reply boolean not null default false,
  can_forward boolean not null default false,
  can_access_attachments boolean not null default true,
  can_manage_integration boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists email_perm_conn_role_idx on public.email_permissions(connection_id, role_code);

-- 3. Email Messages Table (Synchronized & Indexed Operational Messages)
create table if not exists public.email_messages (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  connection_id text not null references public.email_connections(id) on delete cascade,
  thread_id text not null,
  provider_message_id text not null,
  from_name text not null,
  from_email text not null,
  to_recipients jsonb not null default '[]'::jsonb,
  cc_recipients jsonb not null default '[]'::jsonb,
  bcc_recipients jsonb not null default '[]'::jsonb,
  reply_to text,
  subject text not null,
  snippet text not null,
  body_text text not null,
  body_html text,
  message_date timestamptz not null,
  is_read boolean not null default false,
  is_starred boolean not null default false,
  is_archived boolean not null default false,
  is_draft boolean not null default false,
  is_sent boolean not null default false,
  folder text not null default 'inbox' check (folder in ('inbox', 'sent', 'drafts', 'starred', 'archived', 'trash')),
  category text not null default 'general' check (category in ('operations', 'schedules', 'maintenance', 'hiring', 'inventory', 'vendor', 'general')),
  labels text[] not null default '{}'::text[],
  attachments jsonb not null default '[]'::jsonb,
  ai_summary text,
  ai_action_items jsonb not null default '[]'::jsonb,
  ai_suggested_action jsonb,
  has_converted_action boolean not null default false,
  converted_action_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_msg_org_loc_idx on public.email_messages(organization_id, location_id);
create index if not exists email_msg_conn_folder_idx on public.email_messages(connection_id, folder);
create index if not exists email_msg_thread_idx on public.email_messages(thread_id);
create index if not exists email_msg_date_idx on public.email_messages(message_date desc);
create unique index if not exists email_msg_prov_id_conn_idx on public.email_messages(connection_id, provider_message_id);

-- 4. Email Templates Table (Standardized Workqora Operational Email Templates)
create table if not exists public.email_templates (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'general' check (category in ('scheduling', 'hr', 'operations', 'maintenance', 'attendance', 'general')),
  subject text not null,
  body text not null,
  variables text[] not null default '{}'::text[],
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_tmpl_org_idx on public.email_templates(organization_id);

-- 5. Email Signatures Table (Organization & Location Email Signatures)
create table if not exists public.email_signatures (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  title text not null,
  content text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_sig_org_loc_idx on public.email_signatures(organization_id, location_id);

-- 6. Email Audit Events Table (Security Logging for Connection, Sending, Forwarding, Permissions)
create table if not exists public.email_audit_events (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text references public.locations(id) on delete cascade,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  details text not null,
  status text not null default 'success' check (status in ('success', 'warning', 'denied')),
  created_at timestamptz not null default now()
);

create index if not exists email_audit_org_date_idx on public.email_audit_events(organization_id, created_at desc);

-- 7. Email Sync Logs Table
create table if not exists public.email_sync_logs (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  connection_id text references public.email_connections(id) on delete set null,
  provider text not null check (provider in ('google', 'microsoft', 'imap_smtp', 'enterprise_custom')),
  account_email text not null,
  status text not null check (status in ('success', 'warning', 'error')),
  messages_imported integer not null default 0,
  messages_exported integer not null default 0,
  details text not null,
  created_at timestamptz not null default now()
);

create index if not exists email_sync_logs_org_idx on public.email_sync_logs(organization_id, created_at desc);

-- Enable RLS on all tables
alter table public.email_connections enable row level security;
alter table public.email_permissions enable row level security;
alter table public.email_messages enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_signatures enable row level security;
alter table public.email_audit_events enable row level security;
alter table public.email_sync_logs enable row level security;

-- Row Level Security Policies
create policy "Users can view email connections for accessible locations"
  on public.email_connections for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage email connections"
  on public.email_connections for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view email permissions"
  on public.email_permissions for select
  using (private.is_org_admin(organization_id));

create policy "Admins can manage email permissions"
  on public.email_permissions for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view email messages for accessible locations"
  on public.email_messages for select
  using (private.can_access_location(organization_id, location_id));

create policy "Authorized users can manage email messages"
  on public.email_messages for all
  using (private.can_access_location(organization_id, location_id))
  with check (private.can_access_location(organization_id, location_id));

create policy "Users can view email templates"
  on public.email_templates for select
  using (private.is_org_admin(organization_id));

create policy "Admins can manage email templates"
  on public.email_templates for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view email signatures for accessible locations"
  on public.email_signatures for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage email signatures"
  on public.email_signatures for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Admins can view email audit events"
  on public.email_audit_events for select
  using (private.is_org_admin(organization_id));

create policy "Admins can view email sync logs"
  on public.email_sync_logs for select
  using (private.is_org_admin(organization_id));

-- Grant access to authenticated and service_role
grant select, insert, update, delete on public.email_connections to authenticated, service_role;
grant select, insert, update, delete on public.email_permissions to authenticated, service_role;
grant select, insert, update, delete on public.email_messages to authenticated, service_role;
grant select, insert, update, delete on public.email_templates to authenticated, service_role;
grant select, insert, update, delete on public.email_signatures to authenticated, service_role;
grant select, insert, update, delete on public.email_audit_events to authenticated, service_role;
grant select, insert, update, delete on public.email_sync_logs to authenticated, service_role;
