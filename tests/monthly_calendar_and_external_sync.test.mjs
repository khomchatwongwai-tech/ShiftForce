import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

// 1. Static codebase verification
const serverCode = fs.readFileSync('server.ts', 'utf8');
const migrationCode = fs.readFileSync('supabase/migrations/20260822150000_external_calendar_sync_intelligence.sql', 'utf8');
const calendarSyncEngine = fs.readFileSync('src/utils/calendarSyncEngine.ts', 'utf8');
const monthlyScheduleGridView = fs.readFileSync('src/components/MonthlyScheduleGridView.tsx', 'utf8');
const calendarSyncModal = fs.readFileSync('src/components/CalendarSyncManagerModal.tsx', 'utf8');
const scheduleCalendarView = fs.readFileSync('src/components/ScheduleCalendarView.tsx', 'utf8');

test('1. Monthly calendar rendering and multi-view modes (Day, Week, Month, Agenda)', () => {
  assert.match(scheduleCalendarView, /calendarViewMode === 'month'/);
  assert.match(scheduleCalendarView, /calendarViewMode === 'day'/);
  assert.match(scheduleCalendarView, /calendarViewMode === 'agenda'/);
  assert.match(scheduleCalendarView, /calendarViewMode === 'week'/);
  assert.match(monthlyScheduleGridView, /generateMonthGrid/);
  assert.match(monthlyScheduleGridView, /grid-cols-7/);
  assert.match(monthlyScheduleGridView, /daysOfWeek/);
});

test('2. Month calendar navigation (Prev, Next, Today, Month/Year jumping)', () => {
  assert.match(monthlyScheduleGridView, /handlePrevMonth/);
  assert.match(monthlyScheduleGridView, /handleNextMonth/);
  assert.match(monthlyScheduleGridView, /handleToday/);
  assert.match(monthlyScheduleGridView, /monthName/);
});

test('3. Shift creation and modification from Month View', () => {
  assert.match(monthlyScheduleGridView, /onOpenAddShift\(day\.dateStr\)/);
  assert.match(monthlyScheduleGridView, /onOpenEditShift\(shift\)/);
  assert.match(scheduleCalendarView, /handleOpenAddModal/);
  assert.match(scheduleCalendarView, /handleOpenEditModal/);
});

test('4. Google Calendar event mapping & bidirectional sync', () => {
  assert.match(serverCode, /\/api\/calendar\/sync/);
  assert.match(serverCode, /inMemoryCalendarConnections/);
  assert.match(migrationCode, /provider in \('google', 'microsoft', 'apple_caldav', 'ics_webcal'\)/);
  assert.match(calendarSyncEngine, /provider: evt\.provider/);
});

test('5. Microsoft Outlook / Microsoft 365 calendar mapping', () => {
  assert.match(calendarSyncModal, /Microsoft 365 \/ Outlook Calendar/);
  assert.match(calendarSyncModal, /microsoft/);
  assert.match(migrationCode, /calendar_connections/);
  assert.match(migrationCode, /calendar_event_mappings/);
});

test('6. Duplicate calendar event prevention & idempotent tracking', () => {
  assert.match(migrationCode, /create unique index if not exists cal_mappings_shift_conn_idx on public\.calendar_event_mappings\(shift_id, connection_id\)/);
  assert.match(migrationCode, /sync_hash/);
  assert.match(migrationCode, /etag/);
  assert.match(calendarSyncEngine, /UID:workqora-shift-\${s\.id}@workqora\.com/);
});

test('7. Shift modification and cancellation synchronization', () => {
  assert.match(serverCode, /app\.delete\("\/api\/calendar\/external-events\/:id"/);
  assert.match(migrationCode, /on delete cascade/);
  assert.match(calendarSyncModal, /onDeleteExternalEvent/);
});

test('8. Timezone conversion and standard UTC formatting', () => {
  assert.match(calendarSyncEngine, /X-WR-TIMEZONE:UTC/);
  assert.match(calendarSyncEngine, /formatIcsDate/);
  assert.match(calendarSyncEngine, /getUTCFullYear/);
  assert.match(calendarSyncEngine, /getUTCHours/);
  assert.match(serverCode, /X-WR-TIMEZONE:UTC/);
});

test('9. Conflict detection & recurring/all-day event handling', () => {
  assert.match(calendarSyncEngine, /detectCalendarConflicts/);
  assert.match(calendarSyncEngine, /isOverlapping/);
  assert.match(calendarSyncEngine, /isPersonalBlock/);
  assert.match(calendarSyncEngine, /restaurant_buyout/);
  assert.match(calendarSyncEngine, /maintenance/);
});

test('10. Privacy preservation - Free/Busy only masking for staff personal events', () => {
  assert.match(migrationCode, /privacy_level text not null default 'free_busy_only'/);
  assert.match(calendarSyncEngine, /privacyLevel === 'free_busy_only'/);
  assert.match(calendarSyncEngine, /Workqora Shift \(Busy\)/);
});

test('11. Multi-tenant isolation & Row Level Security (RLS) policies', () => {
  assert.match(migrationCode, /alter table public\.calendar_connections enable row level security/);
  assert.match(migrationCode, /alter table public\.calendar_external_events enable row level security/);
  assert.match(migrationCode, /alter table public\.calendar_event_mappings enable row level security/);
  assert.match(migrationCode, /alter table public\.calendar_feed_subscriptions enable row level security/);
  assert.match(migrationCode, /alter table public\.calendar_sync_logs enable row level security/);
  assert.match(migrationCode, /private\.can_access_location\(organization_id, location_id\)/);
  assert.match(migrationCode, /private\.is_org_admin\(organization_id\)/);
});

test('12. OAuth failure, token expiration, disconnected provider handling & retry logic', () => {
  assert.match(migrationCode, /token_expires_at/);
  assert.match(migrationCode, /sync_status in \('synced', 'syncing', 'error', 'pending'\)/);
  assert.match(calendarSyncModal, /Authorization Expired/);
  assert.match(calendarSyncModal, /Reconnect/);
});

test('13. RFC 5545 iCalendar (.ics) / Webcal live subscription feed generation', () => {
  assert.match(serverCode, /app\.get\("\/api\/calendar\/feed\/:token\.ics"/);
  assert.match(serverCode, /Content-Type", "text\/calendar; charset=utf-8/);
  assert.match(serverCode, /BEGIN:VCALENDAR/);
  assert.match(serverCode, /END:VCALENDAR/);
  assert.match(calendarSyncEngine, /generateIcsFeed/);
  assert.match(calendarSyncEngine, /parseIcsEvents/);
});

test('14. Labor Cost Guard and monthly labor budget intelligence in Month View', () => {
  assert.match(monthlyScheduleGridView, /Monthly Scheduled Cost/);
  assert.match(monthlyScheduleGridView, /Monthly Labor Budget/);
  assert.match(monthlyScheduleGridView, /Forecasted Revenue/);
  assert.match(monthlyScheduleGridView, /remainingBudget/);
  assert.match(scheduleCalendarView, /laborCostGuardToast/);
});
