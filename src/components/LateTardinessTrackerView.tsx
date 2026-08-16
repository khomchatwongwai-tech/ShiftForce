import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  UserX,
  TrendingDown,
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Flame
} from 'lucide-react';
import { TardinessRecord, Employee, SupportedLanguage } from '../types';
import { translations } from '../utils/i18n';

interface LateTardinessTrackerViewProps {
  tardinessLog: TardinessRecord[];
  employees: Employee[];
  currentLanguage: SupportedLanguage;
  onAddTardinessRecord: (record: Omit<TardinessRecord, 'id'>) => void;
}

export const LateTardinessTrackerView: React.FC<LateTardinessTrackerViewProps> = ({
  tardinessLog,
  employees,
  currentLanguage,
  onAddTardinessRecord,
}) => {
  const t = translations[currentLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_time' | 'late' | 'excused' | 'no_show'>('all');
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState('16:00');
  const [actualTime, setActualTime] = useState('16:15');
  const [status, setStatus] = useState<'on_time' | 'late' | 'excused' | 'no_show'>('late');
  const [reason, setReason] = useState('Public transit delay');
  const [managerNote, setManagerNote] = useState('First occurrence this month.');

  const filteredLog = tardinessLog.filter(record => {
    const q = searchQuery.toLowerCase().trim();
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchSearch = q === '' ||
      (record.employeeName || '').toLowerCase().includes(q) ||
      (record.reason && (record.reason || '').toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const totalPunches = tardinessLog.length;
  const onTimeCount = tardinessLog.filter(r => r.status === 'on_time').length;
  const lateCount = tardinessLog.filter(r => r.status === 'late').length;
  const punctualityRate = totalPunches > 0 ? ((onTimeCount / totalPunches) * 100).toFixed(1) : '100';

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === selectedEmpId) || employees[0];
    if (!emp) return;

    const [sh, sm] = scheduledTime.split(':').map(Number);
    const [ah, am] = actualTime.split(':').map(Number);
    const diff = (ah * 60 + am) - (sh * 60 + sm);
    const lateMinutes = Math.max(0, diff);

    onAddTardinessRecord({
      employeeId: emp.id,
      employeeName: emp.name,
      shiftId: `shift-tardy-${Date.now()}`,
      shiftDate,
      scheduledStartTime: scheduledTime,
      actualClockInTime: actualTime,
      lateMinutes,
      status,
      reason,
      managerNote,
    });

    setIsAddingRecord(false);
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{t.lateTardiness}</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Live Attendance Punch Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of scheduled vs actual clock-in times, late minutes, grace periods, and excuse notes.
          </p>
        </div>

        <button
          onClick={() => setIsAddingRecord(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Attendance Punch</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Overall Punctuality Rate
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>{punctualityRate}%</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            Restaurant Target: &gt;95%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            On-Time Punches
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {onTimeCount} <span className="text-xs font-normal text-slate-400">of {totalPunches} shifts</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Grace period &lt;5 minutes
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-sky-100 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Late Incidents / Tardiness
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1 flex items-center gap-2">
            <span>{lateCount}</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5 font-medium">
            Avg delay: 11.4 mins
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'on_time', 'late', 'excused', 'no_show'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by staff name or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden text-xs">
        <table className="w-full text-left divide-y divide-slate-100">
          <thead className="bg-sky-50/50 text-slate-700 font-bold">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Shift Date</th>
              <th className="px-4 py-3">Scheduled Start</th>
              <th className="px-4 py-3">Actual Clock-In</th>
              <th className="px-4 py-3">Late Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason &amp; Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLog.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-900">{rec.employeeName}</td>
                <td className="px-4 py-3 text-slate-600 font-mono">{rec.shiftDate}</td>
                <td className="px-4 py-3 text-slate-600 font-mono">{rec.scheduledStartTime}</td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-800">{rec.actualClockInTime}</td>
                <td className="px-4 py-3 font-mono">
                  {rec.lateMinutes > 0 ? (
                    <span className="text-rose-600 font-bold">+{rec.lateMinutes} mins late</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">0 mins (On-Time)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    rec.status === 'on_time'
                      ? 'bg-emerald-50 text-emerald-700'
                      : rec.status === 'late'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {rec.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs">
                  {rec.reason ? <div>"{rec.reason}"</div> : <span className="text-slate-400">None</span>}
                  {rec.managerNote && <div className="text-[10px] text-slate-400 italic">Mgr: {rec.managerNote}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Attendance Record Modal */}
      {isAddingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">

            <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Record Attendance Punch</h3>
              <button onClick={() => setIsAddingRecord(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRecord} className="p-6 space-y-4 text-xs">

              <div>
                <label className="font-bold text-slate-700 block mb-1">Employee:</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shift Date:</label>
                <input
                  type="date"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scheduled Start:</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Actual Punch In:</label>
                  <input
                    type="time"
                    value={actualTime}
                    onChange={(e) => setActualTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Attendance Status:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="on_time">On-Time (Grace period)</option>
                  <option value="late">Late Arrival</option>
                  <option value="excused">Excused (Advance notice)</option>
                  <option value="no_show">No-Show / Unexcused</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Traffic, Childcare, Flat tire"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRecord(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
