-- Inventory, Waste Management & Financial Cost Intelligence Migration
-- Strict multi-tenant isolation via organization_id and location_id with Row-Level Security

create table if not exists public.inventory_items (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  name text not null,
  sku text not null,
  barcode text,
  category text not null,
  category_group text not null check (category_group in ('Food', 'Beverage & Bar', 'Operating Supplies')),
  department text not null,
  unit_of_measure text not null,
  secondary_unit text,
  pack_size numeric(12,4) not null default 1 check (pack_size > 0),
  pack_unit text not null default 'Unit',
  conversion_ratio numeric(12,4) not null default 1 check (conversion_ratio > 0),
  unit_cost numeric(12,4) not null default 0 check (unit_cost >= 0),
  pack_cost numeric(12,4) not null default 0 check (pack_cost >= 0),
  par_level numeric(12,4) not null default 0 check (par_level >= 0),
  reorder_point numeric(12,4) not null default 0 check (reorder_point >= 0),
  reorder_quantity numeric(12,4) not null default 0 check (reorder_quantity >= 0),
  quantity_on_hand numeric(12,4) not null default 0,
  beginning_inventory numeric(12,4) not null default 0,
  purchases_received numeric(12,4) not null default 0,
  transfers_in numeric(12,4) not null default 0,
  transfers_out numeric(12,4) not null default 0,
  depletions_sales_usage numeric(12,4) not null default 0,
  waste_quantity numeric(12,4) not null default 0,
  ending_inventory numeric(12,4) not null default 0,
  theoretical_usage numeric(12,4) not null default 0,
  actual_usage numeric(12,4) not null default 0,
  variance_quantity numeric(12,4) not null default 0,
  variance_cost numeric(12,4) not null default 0,
  storage_area text not null,
  storage_bin text,
  supplier_name text not null default 'Primary Distributor',
  supplier_sku text,
  lead_time_days integer not null default 1 check (lead_time_days >= 0),
  is_perishable boolean not null default false,
  shelf_life_days integer,
  expiration_date date,
  status text not null default 'in_stock' check (status in ('in_stock', 'low_stock', 'critical', 'overstocked', 'out_of_stock')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_org_loc_idx on public.inventory_items(organization_id, location_id);
create index if not exists inventory_items_sku_idx on public.inventory_items(sku);
create index if not exists inventory_items_category_idx on public.inventory_items(category);

create table if not exists public.inventory_count_sessions (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  count_type text not null check (count_type in ('full_inventory', 'spot_check', 'cycle_count', 'par_check', 'bar_audit')),
  period_type text not null check (period_type in ('day', 'week', 'month', 'year')),
  period_label text not null,
  count_date date not null,
  department_filter text not null default 'All',
  category_filter text not null default 'All',
  storage_area_filter text not null default 'All',
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'approved', 'rejected', 'reconciled')),
  conducted_by_employee_id text not null references public.employees(id) on delete cascade,
  conducted_by_name text not null,
  conducted_by_role text not null,
  approved_by_employee_id text references public.employees(id) on delete set null,
  approved_by_name text,
  approved_at timestamptz,
  total_items_counted integer not null default 0 check (total_items_counted >= 0),
  total_inventory_value numeric(14,2) not null default 0 check (total_inventory_value >= 0),
  total_theoretical_value numeric(14,2) not null default 0,
  total_variance_value numeric(14,2) not null default 0,
  items_with_variance_count integer not null default 0,
  notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  items_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists inventory_count_sessions_org_loc_idx on public.inventory_count_sessions(organization_id, location_id);
create index if not exists inventory_count_sessions_date_idx on public.inventory_count_sessions(count_date desc);

create table if not exists public.waste_records (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  department text not null,
  item_id text not null references public.inventory_items(id) on delete cascade,
  item_name text not null,
  sku text not null,
  category text not null,
  category_group text not null,
  quantity_wasted numeric(12,4) not null check (quantity_wasted > 0),
  unit_of_measure text not null,
  unit_cost numeric(12,4) not null check (unit_cost >= 0),
  total_waste_cost numeric(12,2) not null check (total_waste_cost >= 0),
  reason_code text not null check (reason_code in (
    'spoilage_expired', 'prep_trimming_loss', 'overcooked_kitchen_error',
    'customer_return_dissatisfaction', 'spill_breakage_drop', 'bar_overpour_comp',
    'storage_temp_failure', 'expired_shelf_life', 'theft_unaccounted', 'quality_inspection_fail'
  )),
  reason_description text,
  shift text not null check (shift in ('morning', 'mid', 'closing', 'overnight')),
  timestamp timestamptz not null default now(),
  logged_by_employee_id text not null references public.employees(id) on delete cascade,
  logged_by_name text not null,
  logged_by_role text not null,
  supervisor_id text references public.employees(id) on delete set null,
  supervisor_name text,
  supervisor_verified boolean not null default false,
  supervisor_notes text,
  corrective_action text,
  disposal_method text default 'trash',
  is_recurring_anomaly boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists waste_records_org_loc_idx on public.waste_records(organization_id, location_id);
create index if not exists waste_records_timestamp_idx on public.waste_records(timestamp desc);
create index if not exists waste_records_reason_idx on public.waste_records(reason_code);

create table if not exists public.purchase_orders (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  vendor_name text not null,
  vendor_contact text,
  vendor_account_number text,
  invoice_number text not null,
  order_date date not null,
  delivery_date date not null,
  status text not null default 'received' check (status in ('draft', 'ordered', 'received', 'partially_received', 'paid', 'disputed')),
  payment_terms text not null default 'net_30',
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  freight_amount numeric(12,2) not null default 0 check (freight_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  received_by_employee_id text references public.employees(id) on delete set null,
  received_by_name text,
  received_at timestamptz,
  notes text,
  line_items_payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists purchase_orders_org_loc_idx on public.purchase_orders(organization_id, location_id);
create index if not exists purchase_orders_invoice_idx on public.purchase_orders(invoice_number);

create table if not exists public.recipe_cost_cards (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  location_id text not null references public.locations(id) on delete cascade,
  name text not null,
  category text not null,
  department text not null,
  portion_size text not null default '1 Serving',
  yield_servings numeric(10,2) not null default 1 check (yield_servings > 0),
  menu_price numeric(10,2) not null check (menu_price >= 0),
  total_batch_cost numeric(10,2) not null default 0 check (total_batch_cost >= 0),
  cost_per_serving numeric(10,2) not null default 0 check (cost_per_serving >= 0),
  food_cost_percentage numeric(6,2) not null default 0,
  target_food_cost_percentage numeric(6,2) not null default 28.0,
  gross_profit_margin numeric(10,2) not null default 0,
  contribution_margin_percentage numeric(6,2) not null default 0,
  prep_time_minutes integer not null default 15 check (prep_time_minutes >= 0),
  cook_time_minutes integer not null default 10 check (cook_time_minutes >= 0),
  shelf_life_hours integer,
  allergens text[] not null default '{}',
  station text not null default 'Main Kitchen',
  instructions text[] not null default '{}',
  ingredients_payload jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'in_development', 'seasonal', 'archived')),
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists recipe_cost_cards_org_loc_idx on public.recipe_cost_cards(organization_id, location_id);

-- Enable RLS on all new tables
alter table public.inventory_items enable row level security;
alter table public.inventory_count_sessions enable row level security;
alter table public.waste_records enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.recipe_cost_cards enable row level security;

-- Row Level Security policies using private.can_access_location and private.is_org_admin
create policy "Users can view inventory items for accessible locations"
  on public.inventory_items for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage inventory items"
  on public.inventory_items for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view count sessions for accessible locations"
  on public.inventory_count_sessions for select
  using (private.can_access_location(organization_id, location_id));

create policy "Staff and managers can record inventory counts"
  on public.inventory_count_sessions for insert
  with check (private.can_access_location(organization_id, location_id));

create policy "Admins can manage inventory count sessions"
  on public.inventory_count_sessions for update
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view waste records for accessible locations"
  on public.waste_records for select
  using (private.can_access_location(organization_id, location_id));

create policy "Staff and managers can log waste records"
  on public.waste_records for insert
  with check (private.can_access_location(organization_id, location_id));

create policy "Admins can manage waste records"
  on public.waste_records for update
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view purchase orders for accessible locations"
  on public.purchase_orders for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage purchase orders"
  on public.purchase_orders for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

create policy "Users can view recipe cards for accessible locations"
  on public.recipe_cost_cards for select
  using (private.can_access_location(organization_id, location_id));

create policy "Admins can manage recipe cards"
  on public.recipe_cost_cards for all
  using (private.is_org_admin(organization_id))
  with check (private.is_org_admin(organization_id));

-- Grant access to authenticated and service_role
grant select, insert, update, delete on public.inventory_items to authenticated, service_role;
grant select, insert, update, delete on public.inventory_count_sessions to authenticated, service_role;
grant select, insert, update, delete on public.waste_records to authenticated, service_role;
grant select, insert, update, delete on public.purchase_orders to authenticated, service_role;
grant select, insert, update, delete on public.recipe_cost_cards to authenticated, service_role;
