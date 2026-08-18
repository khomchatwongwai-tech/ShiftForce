import type {
  Announcement,
  AttendancePunch,
  AuditLogEntry,
  Employee,
  Shift,
  ShiftTradeRequest,
} from '../types';
import { getSupabase } from './client';

type Unsubscribe = () => void;

function requireOrganizationId(value?: string): string {
  if (!value?.trim()) throw new Error('organizationId is required');
  return value.trim();
}

function payload<T>(row: any): T {
  return (row?.payload ?? row) as T;
}

async function list<T>(table: string, organizationId: string, order = 'updated_at'): Promise<T[]> {
  let query = getSupabase().from(table).select('*').eq('organization_id', requireOrganizationId(organizationId));
  if (order) query = query.order(order, { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(payload<T>);
}

function subscribe<T>(table: string, organizationId: string, onUpdate: (items: T[]) => void, order = 'updated_at'): Unsubscribe {
  const supabase = getSupabase();
  const scopedOrganizationId = requireOrganizationId(organizationId);
  let closed = false;
  const refresh = async () => {
    try {
      const items = await list<T>(table, scopedOrganizationId, order);
      if (!closed) onUpdate(items);
    } catch (error) {
      console.error('[Supabase read model]', table, error);
    }
  };
  void refresh();
  const channel = supabase
    .channel(`sf-read:${table}:${scopedOrganizationId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter: `organization_id=eq.${scopedOrganizationId}` }, () => void refresh())
    .subscribe();
  return () => {
    closed = true;
    void supabase.removeChannel(channel);
  };
}

// Supabase is intentionally read-only in the browser. Workforce mutations go through
// authenticated server endpoints backed by the authoritative Firestore store.
export const supabaseWorkforceReader = {
  subscribeEmployees: (organizationId: string, onUpdate: (items: Employee[]) => void) => subscribe<Employee>('employees', organizationId, onUpdate),
  subscribeShifts: (organizationId: string, onUpdate: (items: Shift[]) => void) => subscribe<Shift>('shifts', organizationId, onUpdate, 'starts_at'),
  subscribePunches: (organizationId: string, onUpdate: (items: AttendancePunch[]) => void) => subscribe<AttendancePunch>('punches', organizationId, onUpdate, 'punched_at'),
  subscribeTrades: (organizationId: string, onUpdate: (items: ShiftTradeRequest[]) => void) => subscribe<ShiftTradeRequest>('shift_trades', organizationId, onUpdate),
  subscribeAnnouncements: (organizationId: string, onUpdate: (items: Announcement[]) => void) => subscribe<Announcement>('announcements', organizationId, onUpdate, 'created_at'),
  subscribeAuditLogs: (organizationId: string, onUpdate: (items: AuditLogEntry[]) => void) => subscribe<AuditLogEntry>('audit_logs', organizationId, onUpdate, 'created_at'),
};
