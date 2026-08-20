import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { authenticatedFetch } from '../utils/apiClient';
import { handleFirestoreError, OperationType } from './errorHandling';
import { Employee, Shift, AttendancePunch, ShiftTradeRequest, Announcement, TimeOffRequest, ShiftSwapRequest, SickDayReport, AvailabilityRequest, ShiftSlotRequest, AuditLogEntry } from '../types';

function requireOrganizationId(organizationId?: string): string {
  if (!organizationId?.trim()) throw new Error('organizationId is required for tenant-scoped data');
  return organizationId.trim();
}

function scopedQuery(collectionName: string, organizationId: string) {
  return query(collection(db, collectionName), where('organizationId', '==', requireOrganizationId(organizationId)));
}

export const firestoreService = {
  subscribeEmployees(organizationId: string, onUpdate: (employees: Employee[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('employees', organizationId), (snapshot) => {
      onUpdate(snapshot.docs.map(d => d.data() as Employee));
    }, error => handleFirestoreError(error, OperationType.GET, 'employees'));
  },

  async saveEmployee(emp: Employee): Promise<void> {
    requireOrganizationId(emp.organizationId);
    const existing = await getDoc(doc(db, 'employees', emp.id));
    const response = await authenticatedFetch(existing.exists() ? `/api/workforce/employees/${encodeURIComponent(emp.id)}` : '/api/workforce/employees', {
      method: existing.exists() ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emp),
    });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Employee save failed'); }
  },

  async deleteEmployee(empId: string): Promise<void> {
    const response = await authenticatedFetch(`/api/workforce/employees/${encodeURIComponent(empId)}`, { method: 'DELETE' });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Employee delete failed'); }
  },

  async seedEmployeesIfEmpty(employees: Employee[]): Promise<void> {
    if (!(import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true')) return;
    try {
      for (const emp of employees) {
        requireOrganizationId(emp.organizationId);
        await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
      }
    } catch (error) { console.warn('[Firebase] Demo seed skipped:', error); }
  },

  subscribeShifts(organizationId: string, onUpdate: (shifts: Shift[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('shifts', organizationId), snapshot => {
      onUpdate(snapshot.docs.map(d => d.data() as Shift));
    }, error => handleFirestoreError(error, OperationType.GET, 'shifts'));
  },

  async saveShift(shift: Shift): Promise<void> {
    requireOrganizationId(shift.organizationId);
    const existing = await getDoc(doc(db, 'shifts', shift.id));
    const response = await authenticatedFetch(existing.exists() ? `/api/workforce/shifts/${encodeURIComponent(shift.id)}` : '/api/workforce/shifts', {
      method: existing.exists() ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Shift save failed'); }
  },

  async deleteShift(shiftId: string): Promise<void> {
    const response = await authenticatedFetch(`/api/workforce/shifts/${encodeURIComponent(shiftId)}`, { method: 'DELETE' });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Shift delete failed'); }
  },

  subscribePunches(organizationId: string, onUpdate: (punches: AttendancePunch[]) => void): Unsubscribe {
    const q = query(collection(db, 'punches'), where('organizationId', '==', requireOrganizationId(organizationId)), orderBy('timestamp', 'desc'));
    return onSnapshot(q, snapshot => onUpdate(snapshot.docs.map(d => d.data() as AttendancePunch)),
      error => handleFirestoreError(error, OperationType.GET, 'punches'));
  },

  async recordPunch(punch: AttendancePunch): Promise<void> {
    requireOrganizationId(punch.organizationId);
    const response = await authenticatedFetch('/api/workforce/punches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(punch),
    });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Punch record failed'); }
  },

  subscribeTrades(organizationId: string, onUpdate: (trades: ShiftTradeRequest[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('shiftTrades', organizationId), snapshot => {
      onUpdate(snapshot.docs.map(d => d.data() as ShiftTradeRequest));
    }, error => handleFirestoreError(error, OperationType.GET, 'shiftTrades'));
  },

  async saveTrade(trade: ShiftTradeRequest): Promise<void> {
    requireOrganizationId(trade.organizationId);
    const existing = await getDoc(doc(db, 'shiftTrades', trade.id));
    const response = await authenticatedFetch(existing.exists() ? `/api/workforce/trades/${encodeURIComponent(trade.id)}` : '/api/workforce/trades', {
      method: existing.exists() ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trade),
    });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Shift trade save failed'); }
  },

  async getUserProfile(userId: string): Promise<any | null> {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      return snap.exists() ? snap.data() : null;
    } catch (error) { handleFirestoreError(error, OperationType.GET, `users/${userId}`); }
  },

  async saveUserProfile(profile: {
    userId: string; email: string; displayName: string; photoURL?: string; role: string;
    isHostOrAdmin: boolean; userType?: string; employeeId?: string; organizationId?: string;
    createdAt?: string; updatedAt?: string; lastLoginAt?: string;
  }): Promise<void> {
    try {
      await setDoc(doc(db, 'users', profile.userId), { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `users/${profile.userId}`); }
  },

  subscribeUserProfile(userId: string, onUpdate: (profile: any) => void): Unsubscribe {
    return onSnapshot(doc(db, 'users', userId), snapshot => {
      if (snapshot.exists()) onUpdate(snapshot.data());
    }, error => handleFirestoreError(error, OperationType.GET, `users/${userId}`));
  },

  subscribeTimeOffRequests(organizationId: string, onUpdate: (items: TimeOffRequest[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('timeOffRequests', organizationId), snapshot => onUpdate(snapshot.docs.map(d => d.data() as TimeOffRequest)),
      error => handleFirestoreError(error, OperationType.GET, 'timeOffRequests'));
  },

  async saveTimeOffRequest(item: TimeOffRequest): Promise<void> {
    requireOrganizationId(item.organizationId);
    try { await setDoc(doc(db, 'timeOffRequests', item.id), item, { merge: true }); }
    catch (error) { handleFirestoreError(error, OperationType.WRITE, `timeOffRequests/${item.id}`); }
  },

  subscribeShiftSwapRequests(organizationId: string, onUpdate: (items: ShiftSwapRequest[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('shiftSwapRequests', organizationId), snapshot => onUpdate(snapshot.docs.map(d => d.data() as ShiftSwapRequest)),
      error => handleFirestoreError(error, OperationType.GET, 'shiftSwapRequests'));
  },

  async saveShiftSwapRequest(item: ShiftSwapRequest): Promise<void> {
    requireOrganizationId(item.organizationId);
    try { await setDoc(doc(db, 'shiftSwapRequests', item.id), item, { merge: true }); }
    catch (error) { handleFirestoreError(error, OperationType.WRITE, `shiftSwapRequests/${item.id}`); }
  },

  subscribeSickReports(organizationId: string, onUpdate: (items: SickDayReport[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('sickReports', organizationId), snapshot => onUpdate(snapshot.docs.map(d => d.data() as SickDayReport)),
      error => handleFirestoreError(error, OperationType.GET, 'sickReports'));
  },

  async saveSickReport(item: SickDayReport): Promise<void> {
    requireOrganizationId(item.organizationId);
    try { await setDoc(doc(db, 'sickReports', item.id), item, { merge: true }); }
    catch (error) { handleFirestoreError(error, OperationType.WRITE, `sickReports/${item.id}`); }
  },

  subscribeAvailabilityRequests(organizationId: string, onUpdate: (items: AvailabilityRequest[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('availabilityRequests', organizationId), snapshot => onUpdate(snapshot.docs.map(d => d.data() as AvailabilityRequest)),
      error => handleFirestoreError(error, OperationType.GET, 'availabilityRequests'));
  },

  async saveAvailabilityRequest(item: AvailabilityRequest): Promise<void> {
    requireOrganizationId(item.organizationId);
    try { await setDoc(doc(db, 'availabilityRequests', item.id), item, { merge: true }); }
    catch (error) { handleFirestoreError(error, OperationType.WRITE, `availabilityRequests/${item.id}`); }
  },

  subscribeShiftSlotRequests(organizationId: string, onUpdate: (items: ShiftSlotRequest[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('shiftSlotRequests', organizationId), snapshot => onUpdate(snapshot.docs.map(d => d.data() as ShiftSlotRequest)),
      error => handleFirestoreError(error, OperationType.GET, 'shiftSlotRequests'));
  },

  async saveShiftSlotRequest(item: ShiftSlotRequest): Promise<void> {
    requireOrganizationId(item.organizationId);
    try { await setDoc(doc(db, 'shiftSlotRequests', item.id), item, { merge: true }); }
    catch (error) { handleFirestoreError(error, OperationType.WRITE, `shiftSlotRequests/${item.id}`); }
  },

  subscribeAuditLogs(organizationId: string, onUpdate: (items: AuditLogEntry[]) => void): Unsubscribe {
    const q = query(collection(db, 'auditLogs'), where('organizationId', '==', requireOrganizationId(organizationId)), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snapshot => onUpdate(snapshot.docs.map(d => d.data() as AuditLogEntry)),
      error => handleFirestoreError(error, OperationType.GET, 'auditLogs'));
  },

  subscribeAnnouncements(organizationId: string, onUpdate: (announcements: Announcement[]) => void): Unsubscribe {
    return onSnapshot(scopedQuery('announcements', organizationId), snapshot => {
      onUpdate(snapshot.docs.map(d => d.data() as Announcement));
    }, error => handleFirestoreError(error, OperationType.GET, 'announcements'));
  },

  async saveAnnouncement(announcement: Announcement): Promise<void> {
    requireOrganizationId(announcement.organizationId);
    const response = await authenticatedFetch('/api/workforce/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(announcement),
    });
    if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body?.error || 'Announcement publish failed'); }
  },
};