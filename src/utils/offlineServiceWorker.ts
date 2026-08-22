import { Employee, Shift, Department, RestaurantRole } from '../types';

export interface OfflineClockInRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  role: RestaurantRole;
  shiftId?: string;
  punchType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  timestamp: string; // ISO string
  timeString: string; // HH:MM (e.g. 09:15)
  dateString: string; // YYYY-MM-DD
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  lateMinutes: number;
  status: 'on_time' | 'late' | 'unscheduled_cover';
  managerPinVerified: boolean;
  managerNotes?: string;
  synced: boolean;
  offlineRecordedAt: string;
}

export interface OfflineRosterSnapshot {
  timestamp: string;
  employeeCount: number;
  shiftCount: number;
  employees: Employee[];
  shifts: Shift[];
  locationName: string;
  version: string;
}

const ROSTER_STORAGE_KEY = 'workqora_offline_roster_snapshot_v1';
const LEGACY_ROSTER_STORAGE_KEY = 'shiftsky_offline_roster_snapshot_v1';
const CLOCKIN_QUEUE_KEY = 'workqora_offline_clockin_queue_v1';
const LEGACY_CLOCKIN_QUEUE_KEY = 'shiftsky_offline_clockin_queue_v1';

/**
 * Register Service Worker for offline asset & data caching
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.info('[ServiceWorker] Service Workers not supported in current browser environment.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.info('[ServiceWorker] Registered successfully with scope:', registration.scope);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('[ServiceWorker] New version installed and ready for activation.');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.warn('[ServiceWorker] Registration failed or running in non-secure context:', error);
    return null;
  }
}

/**
 * Persist current active roster, employee directory, and shifts into offline local storage & ServiceWorker cache
 */
export function saveRosterToOfflineStorage(
  employees: Employee[],
  shifts: Shift[],
  locationName: string = 'Workqora Flagship Bistro #104'
): OfflineRosterSnapshot {
  const snapshot: OfflineRosterSnapshot = {
    timestamp: new Date().toISOString(),
    employeeCount: employees.length,
    shiftCount: shifts.length,
    employees,
    shifts,
    locationName,
    version: '1.0.0'
  };

  try {
    // Save to local storage for instant sync
    localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(snapshot));

    // Also dispatch message to Service Worker for CacheStorage backup
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_ROSTER_SNAPSHOT',
        payload: snapshot
      });
    }
  } catch (e) {
    console.warn('[OfflineStorage] Failed to serialize roster to localStorage:', e);
  }

  return snapshot;
}

/**
 * Retrieve cached roster snapshot from storage during internet outages
 */
export function loadRosterFromOfflineStorage(): OfflineRosterSnapshot | null {
  try {
    const raw = localStorage.getItem(ROSTER_STORAGE_KEY) ?? localStorage.getItem(LEGACY_ROSTER_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as OfflineRosterSnapshot;
    }
  } catch (e) {
    console.warn('[OfflineStorage] Failed to read cached roster:', e);
  }
  return null;
}

/**
 * Queue an offline manager-confirmed clock-in or punch
 */
export function queueOfflineClockIn(punch: Omit<OfflineClockInRecord, 'id' | 'synced' | 'offlineRecordedAt'>): OfflineClockInRecord {
  const record: OfflineClockInRecord = {
    ...punch,
    id: `off-punch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    synced: false,
    offlineRecordedAt: new Date().toISOString()
  };

  try {
    const existingQueue = getOfflineClockInQueue();
    const updatedQueue = [record, ...existingQueue];
    localStorage.setItem(CLOCKIN_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (e) {
    console.warn('[OfflineStorage] Failed to queue offline clock-in:', e);
  }

  return record;
}

/**
 * Get list of all queued offline clock-in punches
 */
export function getOfflineClockInQueue(): OfflineClockInRecord[] {
  try {
    const raw = localStorage.getItem(CLOCKIN_QUEUE_KEY) ?? localStorage.getItem(LEGACY_CLOCKIN_QUEUE_KEY);
    if (raw) {
      return JSON.parse(raw) as OfflineClockInRecord[];
    }
  } catch (e) {
    console.warn('[OfflineStorage] Failed to read offline clock-in queue:', e);
  }
  return [];
}

/**
 * Mark punches as synced or remove them from offline queue
 */
export function clearOfflineClockInQueue(): void {
  try {
    localStorage.removeItem(CLOCKIN_QUEUE_KEY);
  } catch (e) {
    console.warn('[OfflineStorage] Failed to clear offline queue:', e);
  }
}

/**
 * Export offline punches as emergency physical CSV ledger
 */
export function exportOfflineAttendanceCSV(punches: OfflineClockInRecord[]): void {
  if (!punches.length) return;

  const headers = [
    'Offline Record ID',
    'Employee Name',
    'Employee ID',
    'Department',
    'Role',
    'Punch Type',
    'Date',
    'Time',
    'Scheduled Start',
    'Late Minutes',
    'Status',
    'Manager Verified',
    'Manager Notes',
    'Recorded At (ISO)'
  ];

  const rows = punches.map(p => [
    `"${p.id}"`,
    `"${p.employeeName}"`,
    `"${p.employeeId}"`,
    `"${p.department}"`,
    `"${p.role}"`,
    `"${p.punchType}"`,
    `"${p.dateString}"`,
    `"${p.timeString}"`,
    `"${p.scheduledStartTime || 'N/A'}"`,
    p.lateMinutes,
    `"${p.status}"`,
    p.managerPinVerified ? 'YES' : 'NO',
    `"${p.managerNotes || ''}"`,
    `"${p.offlineRecordedAt}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Workqora_Offline_ClockIns_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}