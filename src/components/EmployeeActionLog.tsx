import React, { useState, useMemo } from 'react';
import {
  Employee,
  Shift,
  TimeOffRequest,
  ShiftSwapRequest,
  SickDayReport,
  TardinessRecord,
  SupportedLanguage
} from '../types';
import {
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Filter,
  Search,
  FileText,
  ArrowUpRight,
  CheckCheck,
  Sparkles,
  ChevronRight,
  TrendingUp,
  MapPin,
  Wifi,
  Download
} from 'lucide-react';

interface EmployeeActionLogProps {
  currentEmployee: Employee;
  shifts: Shift[];
  timeOffRequests: TimeOffRequest[];
  shiftSwapRequests: ShiftSwapRequest[];
  sickReports: SickDayReport[];
  tardinessLog: TardinessRecord[];
  currentLanguage?: SupportedLanguage;
}

type LogCategory = 'all' | 'shifts' | 'requests' | 'attendance';

interface UnifiedAuditEntry {
  id: string;
  type: 'shift' | 'timeoff' | 'swap' | 'sick' | 'attendance';
  title: string;
  subtitle: string;
  timestamp: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected' | 'completed' | 'on_time' | 'late' | 'verified';
  statusLabel: string;
  statusColor: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'purple';
  details: string;
  metadata?: {
    hours?: number;
    hourlyWage?: number;
    earned?: number;
    department?: string;
    reason?: string;
    verifiedBy?: string;
    minutesLate?: number;
    station?: string;
    source?: string;
  };
}

export function EmployeeActionLog({
  currentEmployee,
  shifts,
  timeOffRequests,
  shiftSwapRequests,
  sickReports,
  tardinessLog,
  currentLanguage = 'en'
}: EmployeeActionLogProps) {
  const [selectedCategory, setSelectedCategory] = useState<LogCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter'>('all');
  const [selectedEntry, setSelectedEntry] = useState<UnifiedAuditEntry | null>(null);

  // Filter shifts belonging to current employee
  const employeeShifts = useMemo(() => {
    return shifts.filter(s => s.employeeId === currentEmployee.id);
  }, [shifts, currentEmployee.id]);

  // Filter requests belonging to current employee
  const employeeTimeOff = useMemo(() => {
    return timeOffRequests.filter(r => r.employeeId === currentEmployee.id);
  }, [timeOffRequests, currentEmployee.id]);

  const employeeSwaps = useMemo(() => {
    return shiftSwapRequests.filter(r => r.requesterEmployeeId === currentEmployee.id || r.targetEmployeeId === currentEmployee.id);
  }, [shiftSwapRequests, currentEmployee.id]);

  const employeeSickReports = useMemo(() => {
    return sickReports.filter(r => r.employeeId === currentEmployee.id);
  }, [sickReports, currentEmployee.id]);

  const employeeTardiness = useMemo(() => {
    return tardinessLog.filter(r => r.employeeId === currentEmployee.id);
  }, [tardinessLog, currentEmployee.id]);

  // Build unified audit feed
  const unifiedEntries = useMemo<UnifiedAuditEntry[]>(() => {
    const entries: UnifiedAuditEntry[] = [];

    // 1. Shift Records (Past and Scheduled)
    employeeShifts.forEach(shift => {
      const shiftDate = new Date(shift.date);
      const isPast = shiftDate < new Date();
      const hours = 8; // standard shift duration
      const earned = Number((hours * (currentEmployee.hourlyWage || 18.5)).toFixed(2));

      entries.push({
        id: `log-shift-${shift.id}`,
        type: 'shift',
        title: `${shift.role} Shift - ${shift.department.toUpperCase()}`,
        subtitle: `${shift.startTime} - ${shift.endTime} • ${shift.location || 'Main Floor'}`,
        timestamp: `${shift.date}T${shift.startTime}:00`,
        date: shift.date,
        status: isPast ? 'completed' : 'verified',
        statusLabel: isPast ? 'Completed & Logged' : 'Confirmed & Scheduled',
        statusColor: isPast ? 'emerald' : 'sky',
        details: isPast
          ? `Completed ${hours} hrs shift. Gross pay calculated at $${earned} (${shift.color || 'Standard schedule'}).`
          : `Upcoming rostered shift on ${shift.date}. Report to ${shift.department} station on time.`,
        metadata: {
          hours,
          hourlyWage: currentEmployee.hourlyWage || 18.5,
          earned,
          department: shift.department,
          station: shift.role,
          source: 'Live Roster'
        }
      });
    });

    // 2. Time-Off Requests
    employeeTimeOff.forEach(to => {
      const statusColor = to.status === 'approved' ? 'emerald' : to.status === 'rejected' ? 'rose' : 'amber';
      const daysDiff = Math.max(1, Math.ceil((new Date(to.endDate).getTime() - new Date(to.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      entries.push({
        id: `log-timeoff-${to.id}`,
        type: 'timeoff',
        title: `Time-Off Request (${to.type.toUpperCase()})`,
        subtitle: `${to.startDate} to ${to.endDate} • ${daysDiff} day(s)`,
        timestamp: `${to.createdAt || to.startDate}T09:00:00`,
        date: to.startDate,
        status: to.status as any,
        statusLabel: to.status.toUpperCase(),
        statusColor,
        details: `Reason: "${to.reason}". Status: ${to.status}. ${to.reviewNotes ? `Manager note: "${to.reviewNotes}"` : 'Awaiting scheduling review.'}`,
        metadata: {
          reason: to.reason,
          source: 'Self-Service Request'
        }
      });
    });

    // 3. Shift Swaps
    employeeSwaps.forEach(swap => {
      const isRequester = swap.requesterEmployeeId === currentEmployee.id;
      const statusColor = swap.adminApprovalStatus === 'approved' ? 'emerald' : swap.adminApprovalStatus === 'rejected' ? 'rose' : 'indigo';
      entries.push({
        id: `log-swap-${swap.id}`,
        type: 'swap',
        title: isRequester ? `Shift Swap Requested with ${swap.targetEmployeeName}` : `Shift Swap Offer from ${swap.requesterEmployeeName}`,
        subtitle: `Requested on ${swap.createdAt ? swap.createdAt.split('T')[0] : 'Recent'}`,
        timestamp: swap.createdAt || '2026-08-10T10:00:00',
        date: swap.createdAt ? swap.createdAt.split('T')[0] : '2026-08-10',
        status: swap.adminApprovalStatus as any,
        statusLabel: `SWAP ${swap.adminApprovalStatus.toUpperCase()}`,
        statusColor,
        details: `Peer status: ${swap.peerApprovalStatus}, Manager status: ${swap.adminApprovalStatus}. Target shift date: ${swap.targetShiftDate || 'Scheduled slot'}. Reason: "${swap.reason}"`,
        metadata: {
          reason: swap.reason || 'Personal schedule adjustment',
          source: 'Peer Swap Network'
        }
      });
    });

    // 4. Sick Day Reports
    employeeSickReports.forEach(sick => {
      const statusColor = sick.status === 'covered' ? 'emerald' : sick.status === 'acknowledged' ? 'sky' : 'purple';
      entries.push({
        id: `log-sick-${sick.id}`,
        type: 'sick',
        title: `Sick Call-In / Absence Notice`,
        subtitle: `Shift Date: ${sick.shiftDate} • Reported: ${sick.shiftTime}`,
        timestamp: `${sick.shiftDate}T08:00:00`,
        date: sick.shiftDate,
        status: sick.status as any,
        statusLabel: `SICK ${sick.status.toUpperCase()}`,
        statusColor,
        details: `Symptoms: "${sick.symptomsSummary}". Immediate coverage needed: ${sick.needsImmediateCoverage ? 'Yes' : 'No'}. Coverage: ${sick.coverageEmployeeName ? `Covered by ${sick.coverageEmployeeName}` : 'Unassigned/Open'}.`,
        metadata: {
          reason: sick.symptomsSummary,
          source: 'Direct Notice'
        }
      });
    });

    // 5. Clock-in & Attendance Verification Records
    employeeTardiness.forEach(tard => {
      const isLate = (tard.minutesLate || 0) > 0;
      entries.push({
        id: `log-tard-${tard.id}`,
        type: 'attendance',
        title: isLate ? `Attendance Variance: ${tard.minutesLate}m Late` : `Verified Punctual Clock-In`,
        subtitle: `Date: ${tard.date} • Expected ${tard.expectedTime || '09:00'} / Actual ${tard.actualTime || '09:12'}`,
        timestamp: `${tard.date}T${tard.actualTime || '09:00'}:00`,
        date: tard.date,
        status: isLate ? 'late' : 'on_time',
        statusLabel: isLate ? `${tard.minutesLate}m Late Variance` : '100% Punctual',
        statusColor: isLate ? 'amber' : 'emerald',
        details: `Clocked in at ${tard.actualTime || 'N/A'}. Reason/Excusal: ${tard.isExcused ? 'Excused by Manager' : tard.reason || 'Standard punch'}. Point penalty: ${tard.pointsAssigned || 0} pts.`,
        metadata: {
          minutesLate: tard.minutesLate,
          reason: tard.reason,
          source: 'Biometric / PIN Punch'
        }
      });
    });

    // Sort descending by date/timestamp
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [employeeShifts, employeeTimeOff, employeeSwaps, employeeSickReports, employeeTardiness, currentEmployee]);

  // Filtered by category and search
  const filteredEntries = useMemo(() => {
    return unifiedEntries.filter(entry => {
      // Category filter
      if (selectedCategory === 'shifts' && entry.type !== 'shift') return false;
      if (selectedCategory === 'requests' && !['timeoff', 'swap', 'sick'].includes(entry.type)) return false;
      if (selectedCategory === 'attendance' && entry.type !== 'attendance') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.subtitle.toLowerCase().includes(q) ||
          entry.details.toLowerCase().includes(q) ||
          entry.date.includes(q)
        );
      }

      return true;
    });
  }, [unifiedEntries, selectedCategory, searchQuery]);

  // Aggregate Metrics for Employee
  const stats = useMemo(() => {
    const totalCompletedShifts = employeeShifts.filter(s => new Date(s.date) < new Date()).length;
    const totalHoursLogged = totalCompletedShifts * 8;
    const approvedRequests = employeeTimeOff.filter(t => t.status === 'approved').length;
    const pendingRequests = employeeTimeOff.filter(t => t.status === 'pending').length;
    const punctualPunches = employeeTardiness.filter(t => !t.minutesLate || t.minutesLate === 0).length;
    const totalPunches = Math.max(employeeTardiness.length, totalCompletedShifts);
    const punctualityRate = totalPunches > 0 ? Math.round(((totalPunches - employeeTardiness.filter(t => (t.minutesLate || 0) > 5).length) / totalPunches) * 100) : 100;

    return {
      totalCompletedShifts,
      totalHoursLogged,
      approvedRequests,
      pendingRequests,
      punctualityRate
    };
  }, [employeeShifts, employeeTimeOff, employeeTardiness]);

  const getStatusBadge = (statusColor: UnifiedAuditEntry['statusColor'], label: string) => {
    const colorClasses = {
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      rose: 'bg-rose-50 text-rose-700 border-rose-200',
      sky: 'bg-sky-50 text-sky-700 border-sky-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
    }[statusColor];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
        {label}
      </span>
    );
  };

  const getTypeIcon = (type: UnifiedAuditEntry['type']) => {
    switch (type) {
      case 'shift':
        return <Calendar className="w-4 h-4 text-sky-600" />;
      case 'timeoff':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'swap':
        return <ArrowUpRight className="w-4 h-4 text-indigo-600" />;
      case 'sick':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'attendance':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div id="employee-action-log-container" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Personal Action Log & Audit History
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Transparent, immutable record of all shifts worked, clock-ins, time-off requests, and peer swap approvals for <span className="font-semibold text-slate-700">{currentEmployee.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Full Staff Transparency Mode</span>
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Logged Shifts</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.totalCompletedShifts}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stats.totalHoursLogged} total hours logged</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Approved Requests</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.approvedRequests}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Time-off & Swaps granted</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Pending Approvals</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.pendingRequests}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Under manager review</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs text-slate-500 font-medium">Punctuality Score</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{stats.punctualityRate}%</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">On-time arrival record</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Records ({unifiedEntries.length})
          </button>
          <button
            onClick={() => setSelectedCategory('shifts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'shifts'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shifts ({employeeShifts.length})
          </button>
          <button
            onClick={() => setSelectedCategory('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'requests'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Requests ({employeeTimeOff.length + employeeSwaps.length + employeeSickReports.length})
          </button>
          <button
            onClick={() => setSelectedCategory('attendance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'attendance'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attendance Punches ({employeeTardiness.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role, date, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Audit Log Timeline / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Showing {filteredEntries.length} Activity Entries
          </div>
          <div className="text-xs text-slate-500">
            Updated in real time
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-700 mb-1">No action records found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No audit entries match the current category or search criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getTypeIcon(entry.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800">
                        {entry.title}
                      </h4>
                      {getStatusBadge(entry.statusColor, entry.statusLabel)}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {entry.subtitle}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                      {entry.details}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700">{entry.date}</div>
                    <div className="text-[10px] text-slate-400">{entry.metadata?.source || 'ShiftForce'}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-100">
                  {getTypeIcon(selectedEntry.type)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">{selectedEntry.title}</h3>
                  <div className="text-xs text-slate-500">{selectedEntry.date}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status & Review</div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedEntry.statusColor, selectedEntry.statusLabel)}
                  <span className="text-slate-600">Recorded in restaurant ledger</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Details & Remarks</div>
                <p className="text-slate-700 leading-relaxed">{selectedEntry.details}</p>
              </div>

              {selectedEntry.metadata && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedEntry.metadata.hours !== undefined && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px]">Hours Worked</span>
                      <span className="font-bold text-slate-800">{selectedEntry.metadata.hours} hrs</span>
                    </div>
                  )}
                  {selectedEntry.metadata.earned !== undefined && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px]">Estimated Gross</span>
                      <span className="font-bold text-emerald-600">${selectedEntry.metadata.earned}</span>
                    </div>
                  )}
                  {selectedEntry.metadata.department && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px]">Department</span>
                      <span className="font-bold text-slate-800">{selectedEntry.metadata.department}</span>
                    </div>
                  )}
                  {selectedEntry.metadata.source && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-400 block text-[10px]">Recorded Via</span>
                      <span className="font-bold text-slate-800">{selectedEntry.metadata.source}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedEntry(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
