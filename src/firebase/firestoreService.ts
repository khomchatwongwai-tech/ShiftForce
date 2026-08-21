// Compatibility surface for legacy workforce callers. Firebase in the browser
// is Auth-only; reads continue through the Supabase-backed workforce store,
// while protected labor mutations are always authorized by the application API.
import type { AttendancePunch, Shift, ShiftTradeRequest } from '../types';
import { firestoreService as workforceStore } from '../supabase/workforceService';
import { authenticatedFetch } from '../utils/apiClient';

async function workforceMutation<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  const response = await authenticatedFetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'Workforce update failed');
  return payload as T;
}

async function createShift(shift: Shift): Promise<{ id: string }> {
  return workforceMutation('/api/workforce/shifts', 'POST', shift);
}

async function updateShift(shift: Shift): Promise<{ ok: true }> {
  return workforceMutation(`/api/workforce/shifts/${encodeURIComponent(shift.id)}`, 'PATCH', shift);
}

async function deleteShift(shiftId: string): Promise<{ ok: true }> {
  return workforceMutation(`/api/workforce/shifts/${encodeURIComponent(shiftId)}`, 'DELETE');
}

async function recordPunch(punch: AttendancePunch): Promise<{ id: string }> {
  return workforceMutation('/api/workforce/punches', 'POST', punch);
}

async function syncPunches(punches: AttendancePunch[]): Promise<{ ok: true; count: number; ids: string[] }> {
  return workforceMutation('/api/workforce/punches/bulk', 'POST', { punches });
}

async function requestTrade(trade: ShiftTradeRequest): Promise<{ id: string }> {
  return workforceMutation('/api/workforce/trades', 'POST', trade);
}

async function updateTrade(tradeId: string, input: Pick<ShiftTradeRequest, 'status'> & { adminNote?: string }): Promise<{ ok: true }> {
  return workforceMutation(`/api/workforce/trades/${encodeURIComponent(tradeId)}`, 'PATCH', input);
}

export const firestoreService = {
  ...workforceStore,
  createShift,
  updateShift,
  deleteShift,
  recordPunch,
  syncPunches,
  requestTrade,
  updateTrade,
};
