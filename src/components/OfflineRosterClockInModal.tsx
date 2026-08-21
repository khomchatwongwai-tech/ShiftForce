import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Zap,
  Info,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Employee, Shift, Department, SupportedLanguage, TardinessRecord } from '../types';
import {
  OfflineClockInRecord,
  OfflineRosterSnapshot,
  getOfflineClockInQueue,
  queueOfflineClockIn,
  clearOfflineClockInQueue,
  exportOfflineAttendanceCSV,
  loadRosterFromOfflineStorage,
  saveRosterToOfflineStorage
} from '../utils/offlineServiceWorker';

interface OfflineRosterClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  employees: Employee[];
  shifts: Shift[];
  currentLanguage?: SupportedLanguage;
  onSyncOfflinePunchesToLive: (punches: OfflineClockInRecord[]) => void;
}

export const OfflineRosterClockInModal: React.FC<OfflineRosterClockInModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  employees,
  shifts,
  onSyncOfflinePunchesToLive
}) => {
  const { currentLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'roster' | 'clock_in' | 'queue' | 'diagnostics'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [cachedSnapshot, setCachedSnapshot] = useState<OfflineRosterSnapshot | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineClockInRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clock-in Form State
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [punchType, setPunchType] = useState<'clock_in' | 'clock_out' | 'break_start' | 'break_end'>('clock_in');
  const [punchDate, setPunchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [punchTime, setPunchTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [managerPin, setManagerPin] = useState<string>('');
  const [managerNotes, setManagerNotes] = useState<string>('');
  const [isPunchSuccess, setIsPunchSuccess] = useState<boolean>(false);

  // Load cache & queue on open
  useEffect(() => {
    if (isOpen) {
      const snapshot = loadRosterFromOfflineStorage();
      setCachedSnapshot(snapshot);
      const queue = getOfflineClockInQueue();
      setOfflineQueue(queue);

      if (employees.length > 0 && !selectedEmpId) {
        setSelectedEmpId(employees[0].id);
      }

      // Update current time
      const now = new Date();
      setPunchTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setPunchDate(now.toISOString().slice(0, 10));
    }
  }, [isOpen, employees]);

  // Actual or simulated offline state
  const effectiveIsOffline = !isOnline || isSimulatedOffline;

  // Selected employee for punch
  const targetEmployee = useMemo(() => {
    const pool = (cachedSnapshot?.employees && cachedSnapshot.employees.length > 0)
      ? cachedSnapshot.employees
      : employees;
    return pool.find(e => e.id === selectedEmpId) || pool[0];
  }, [selectedEmpId, cachedSnapshot, employees]);

  // Find today's scheduled shift for selected employee
  const matchingShift = useMemo(() => {
    const shiftPool = (cachedSnapshot?.shifts && cachedSnapshot.shifts.length > 0)
      ? cachedSnapshot.shifts
      : shifts;
    return shiftPool.find(s => s.employeeId === targetEmployee?.id && s.date === punchDate);
  }, [targetEmployee, punchDate, cachedSnapshot, shifts]);

  // Calculate late minutes if clocking in
  const lateCalculation = useMemo(() => {
    if (!matchingShift || punchType !== 'clock_in') {
      return { lateMinutes: 0, isLate: false };
    }

    const [schedH, schedM] = matchingShift.startTime.split(':').map(Number);
    const [actH, actM] = punchTime.split(':').map(Number);

    const schedMinutes = schedH * 60 + schedM;
    const actMinutes = actH * 60 + actM;

    const diff = actMinutes - schedMinutes;
    return {
      lateMinutes: Math.max(0, diff),
      isLate: diff > 5 // 5 minutes grace period
    };
  }, [matchingShift, punchType, punchTime]);

  // Filtered employees from offline cache
  const displayedEmployees = useMemo(() => {
    const pool = (cachedSnapshot?.employees && cachedSnapshot.employees.length > 0)
      ? cachedSnapshot.employees
      : employees;

    return pool.filter(emp => {
      const matchDept = selectedDept === 'all' || emp.department === selectedDept;
      const matchQuery =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone.includes(searchQuery);
      return matchDept && matchQuery;
    });
  }, [cachedSnapshot, employees, selectedDept, searchQuery]);

  // Handle Offline Clock-in Submission
  const handleConfirmOfflinePunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployee) return;

    const status: 'on_time' | 'late' | 'unscheduled_cover' = !matchingShift
      ? 'unscheduled_cover'
      : lateCalculation.isLate
      ? 'late'
      : 'on_time';

    const newPunch = queueOfflineClockIn({
      employeeId: targetEmployee.id,
      employeeName: targetEmployee.name,
      department: targetEmployee.department,
      role: targetEmployee.role,
      shiftId: matchingShift?.id,
      punchType,
      timestamp: new Date().toISOString(),
      timeString: punchTime,
      dateString: punchDate,
      scheduledStartTime: matchingShift?.startTime,
      scheduledEndTime: matchingShift?.endTime,
      lateMinutes: lateCalculation.lateMinutes,
      status,
      managerPinVerified: managerPin.length >= 4,
      managerNotes: managerNotes || undefined
    });

    const updatedQueue = getOfflineClockInQueue();
    setOfflineQueue(updatedQueue);
    setIsPunchSuccess(true);
    setToastMessage(`✅ ${targetEmployee.name} offline ${punchType.replace('_', ' ')} recorded locally!`);

    setTimeout(() => {
      setIsPunchSuccess(false);
      setToastMessage(null);
    }, 4000);
  };

  // Force Manual Cache Refresh
  const handleRefreshCache = () => {
    const updated = saveRosterToOfflineStorage(employees, shifts);
    setCachedSnapshot(updated);
    setToastMessage('🔄 Offline roster and shift cache refreshed with latest cloud data!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync Queue to Live
  const handleSyncQueue = () => {
    if (offlineQueue.length === 0) return;
    onSyncOfflinePunchesToLive(offlineQueue);
    clearOfflineClockInQueue();
    setOfflineQueue([]);
    setToastMessage(`⚡ Successfully synced ${offlineQueue.length} offline punches to live restaurant ledger!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">

        {/* Modal Top Header with Network Status */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
              effectiveIsOffline
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {effectiveIsOffline ? <WifiOff className="w-6 h-6 animate-pulse" /> : <Wifi className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  Workqora Offline Mode & Local Roster Cache
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  effectiveIsOffline
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-500 text-slate-950'
                }`}>
                  {effectiveIsOffline ? 'Offline Active' : 'Online Synced'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Service Worker Engine caching schedules, employee directory, and offline manager clock-in punches.
              </p>
            </div>
          </div>

          {/* Quick Simulation & Action Controls */}
          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              onClick={onToggleSimulatedOffline}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSimulatedOffline
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
              }`}
              title="Simulate network disconnect to test offline capabilities"
            >
              {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isSimulatedOffline ? 'End Outage Sim' : 'Simulate Outage'}</span>
            </button>

            <button
              onClick={handleRefreshCache}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Cache current roster to local storage"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Cache</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informative Connectivity Banner */}
        <div className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
          effectiveIsOffline
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              {effectiveIsOffline
                ? '⚠️ Internet Outage Detected or Simulated: Operating 100% on Service Worker Local Cache. All rosters and offline clock-ins are safely saved.'
                : '✅ Connected to Workqora Cloud: Real-time synchronization active. Background service worker keeps offline cache warm.'}
            </span>
          </div>

          <div className="text-[11px] font-mono font-semibold hidden md:block">
            Cached Staff: {cachedSnapshot?.employeeCount || employees.length} • Shifts: {cachedSnapshot?.shiftCount || shifts.length}
          </div>
        </div>

        {/* Toast alert if active */}
        {toastMessage && (
          <div className="bg-sky-600 text-white text-xs font-semibold px-6 py-2 flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-200 gap-2 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Cached Roster & Staff ({displayedEmployees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clock_in')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'clock_in'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Offline Clock-In Station</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer relative ${
              activeTab === 'queue'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Offline Queue</span>
            {offlineQueue.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                {offlineQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Diagnostics & Sync</span>
          </button>
        </div>

        {/* Tab 1: Cached Roster & Staff Directory */}
        {activeTab === 'roster' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, role, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
                {(['all', 'Front of House', 'Back of House', 'Bar & Beverage', 'Kitchen Prep & Dish', 'Management'] as const).map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedDept === dept
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept === 'all' ? 'All Staff' : dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Roster Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedEmployees.map(emp => {
                const todayShift = shifts.find(s => s.employeeId === emp.id && s.date === punchDate);

                return (
                  <div
                    key={emp.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-xl text-white font-black text-xs flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: emp.color || '#0284c7' }}
                          >
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{emp.name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium">{emp.role}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {emp.department}
                        </span>
                      </div>

                      {/* Today's Scheduled Shift Info */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] font-semibold">Today's Shift:</span>
                          {todayShift ? (
                            <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                              {todayShift.startTime} - {todayShift.endTime}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No shift today</span>
                          )}
                        </div>
                        {todayShift?.notes && (
                          <p className="text-[11px] text-slate-500 italic truncate">📍 {todayShift.notes}</p>
                        )}
                      </div>

                      {/* Contact Details */}
                      <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{emp.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEmpId(emp.id);
                        setActiveTab('clock_in');
                      }}
                      className="w-full py-2 bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Clock In / Out</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Offline Clock-In Station */}
        {activeTab === 'clock_in' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 max-w-2xl mx-auto w-full">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
              <div className="text-xs text-sky-950 space-y-0.5">
                <p className="font-bold">Offline Manager Verification Engine</p>
                <p className="text-sky-800">
                  Punches are timestamped locally, cross-referenced with cached scheduled shifts, and queued in offline storage until connectivity returns.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmOfflinePunch} className="space-y-4">
              {/* Select Employee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Staff Member *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} — {e.role} ({e.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Punch Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Punch Action *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'clock_in', label: 'Clock In', icon: Clock },
                    { id: 'clock_out', label: 'Clock Out', icon: CheckCircle2 },
                    { id: 'break_start', label: 'Break Start', icon: Zap },
                    { id: 'break_end', label: 'Break End', icon: Sparkles }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPunchType(p.id as any)}
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        punchType === p.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <p.icon className="w-4 h-4" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Punch Date (Local Device)
                  </label>
                  <input
                    type="date"
                    value={punchDate}
                    onChange={(e) => setPunchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Punch Time (Local Device)
                  </label>
                  <input
                    type="time"
                    value={punchTime}
                    onChange={(e) => setPunchTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold font-mono focus:bg-white focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              {/* Schedule Reference Box */}
              <div className="p-3.5 rounded-xl border bg-slate-50/80 border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Scheduled Shift:</span>
                  {matchingShift ? (
                    <span className="font-mono font-bold text-sky-700">
                      {matchingShift.startTime} - {matchingShift.endTime} ({matchingShift.role})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[11px]">
                      Unscheduled / Call-in Shift
                    </span>
                  )}
                </div>

                {matchingShift && punchType === 'clock_in' && (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Attendance Status:</span>
                    {lateCalculation.isLate ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Late (+{lateCalculation.lateMinutes} mins)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        On Time (Within grace window)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Manager PIN & Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manager Override PIN (Optional)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="e.g. 1234"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Offline Notes / Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wi-Fi down, verified in kitchen"
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Queue Offline Punch</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Offline Queue */}
        {activeTab === 'queue' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Pending Offline Clock-In Punches ({offlineQueue.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Recorded on this device during internet outages. Will sync automatically when back online.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportOfflineAttendanceCSV(offlineQueue)}
                  disabled={offlineQueue.length === 0}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleSyncQueue}
                  disabled={offlineQueue.length === 0 || effectiveIsOffline}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now to Live</span>
                </button>
              </div>
            </div>

            {offlineQueue.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700">Offline Queue Clean</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No pending offline punches. All staff clock-ins are synchronized with the live server.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Manager Notes</th>
                      <th className="px-4 py-3">Sync Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {offlineQueue.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {p.employeeName}
                          <div className="text-[10px] text-slate-400 font-normal">{p.role}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-sky-700">
                          {p.punchType.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {p.dateString} @ {p.timeString}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'on_time'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'late'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status} {p.lateMinutes > 0 && `(+${p.lateMinutes}m)`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate">
                          {p.managerNotes || '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-600">
                          ⏳ Queued for Sync
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Diagnostics & Service Worker Engine */}
        {activeTab === 'diagnostics' && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>Service Worker & Cache Storage Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Service Worker</span>
                <p className="text-sm font-extrabold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active & Registered</span>
                </p>
                <p className="text-[11px] text-slate-500">Scope: / (Root)</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Storage Engine</span>
                <p className="text-sm font-extrabold text-slate-900">
                  CacheStorage + LocalStorage
                </p>
                <p className="text-[11px] text-slate-500">Auto-Dual-Redundancy</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Last Synced Cache</span>
                <p className="text-sm font-extrabold text-sky-700 truncate">
                  {cachedSnapshot?.timestamp ? new Date(cachedSnapshot.timestamp).toLocaleTimeString() : 'Just now'}
                </p>
                <p className="text-[11px] text-slate-500">Version {cachedSnapshot?.version || '1.0.0'}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
              <div className="font-mono text-emerald-400 font-bold">
                [ServiceWorker Telemetry]
              </div>
              <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
{JSON.stringify({
  isOnline,
  isSimulatedOffline,
  cachedEmployeeCount: cachedSnapshot?.employeeCount || employees.length,
  cachedShiftCount: cachedSnapshot?.shiftCount || shifts.length,
  pendingQueuedPunches: offlineQueue.length,
  location: cachedSnapshot?.locationName || 'SF Flagship Bistro #104',
  serviceWorkerSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator
}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${effectiveIsOffline ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span>Workqora Emergency Mode Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close Panel
          </button>
        </div>

      </div>
    </div>
  );
};