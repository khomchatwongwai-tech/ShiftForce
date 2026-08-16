import { authenticatedFetch } from '../utils/apiClient';
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  UserCheck,
  Sparkles,
  FileText,
  Send,
  RefreshCw,
  User,
  ShieldCheck,
  Zap,
  Award,
  TrendingUp,
  AlertOctagon,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  TimeOffRequest,
  ShiftSwapRequest,
  SickDayReport,
  AvailabilityRequest,
  ShiftSlotRequest,
  TardinessRecord,
  ShiftSlotContention,
  Employee,
  Shift,
  SupportedLanguage
} from '../types';
import { translations } from '../utils/i18n';
import { detectShiftSlotContentions } from '../utils/shiftSlotValidation';

interface RequestsApprovalsViewProps {
  portal: 'admin' | 'employee';
  currentEmployee?: Employee;
  timeOffRequests: TimeOffRequest[];
  shiftSwapRequests: ShiftSwapRequest[];
  sickReports: SickDayReport[];
  availabilityRequests: AvailabilityRequest[];
  shiftSlotRequests?: ShiftSlotRequest[];
  tardinessLog?: TardinessRecord[];
  employees: Employee[];
  shifts: Shift[];
  currentLanguage: SupportedLanguage;
  onApproveTimeOff: (id: string, notes?: string) => void;
  onRejectTimeOff: (id: string, notes?: string) => void;
  onApproveShiftSwap: (id: string, notes?: string) => void;
  onRejectShiftSwap: (id: string, notes?: string) => void;
  onAcknowledgeSickReport: (id: string, coverageEmployeeId?: string) => void;
  onApproveAvailability: (id: string) => void;
  onRejectAvailability: (id: string) => void;
  onApproveShiftSlot?: (requestId: string, autoRejectContenders?: boolean) => void;
  onRejectShiftSlot?: (requestId: string, notes?: string) => void;
  onResolveContentionWithPriority?: (contention: ShiftSlotContention, chosenCandidateId: string) => void;
}

export const RequestsApprovalsView: React.FC<RequestsApprovalsViewProps> = ({
  portal,
  currentEmployee,
  timeOffRequests,
  shiftSwapRequests,
  sickReports,
  availabilityRequests,
  shiftSlotRequests = [],
  tardinessLog = [],
  employees,
  shifts,
  currentLanguage,
  onApproveTimeOff,
  onRejectTimeOff,
  onApproveShiftSwap,
  onRejectShiftSwap,
  onAcknowledgeSickReport,
  onApproveAvailability,
  onRejectAvailability,
  onApproveShiftSlot,
  onRejectShiftSlot,
  onResolveContentionWithPriority,
}) => {
  const t = translations[currentLanguage];
  const [activeSubTab, setActiveSubTab] = useState<'timeoff' | 'swap' | 'slot_claims' | 'sick' | 'availability'>('slot_claims');

  // AI Replacement Recommendation State
  const [aiFindingCoverageFor, setAiFindingCoverageFor] = useState<SickDayReport | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Detect Active Slot Contentions & Priority Assignment recommendations
  const contentions = useMemo(() => {
    return detectShiftSlotContentions(
      shiftSlotRequests,
      employees,
      shifts,
      tardinessLog,
      availabilityRequests
    );
  }, [shiftSlotRequests, employees, shifts, tardinessLog, availabilityRequests]);

  const pendingTimeOff = timeOffRequests.filter(r => r.status === 'pending');
  const pendingSwaps = shiftSwapRequests.filter(r => r.adminApprovalStatus === 'pending');
  const activeSick = sickReports.filter(r => r.status !== 'covered');
  const pendingAvailability = availabilityRequests.filter(r => r.status === 'pending');
  const pendingSlotRequests = shiftSlotRequests.filter(r => r.status === 'pending');

  const handleFindAiCoverage = async (report: SickDayReport) => {
    setAiFindingCoverageFor(report);
    setLoadingAi(true);

    try {
      const shift = shifts.find(s => s.id === report.shiftId) || {
        date: report.shiftDate,
        startTime: report.shiftTime.split(' - ')[0] || '16:00',
        endTime: report.shiftTime.split(' - ')[1] || '23:30',
        role: 'Line Cook',
        department: report.department,
      };

      const candidates = employees
        .filter(e => e.id !== report.employeeId && e.status === 'active')
        .map(e => ({
          id: e.id,
          name: e.name,
          role: e.role,
          department: e.department,
          hourlyWage: e.hourlyWage,
          maxHours: e.maxHoursPerWeek,
        }));

      const res = await authenticatedFetch('/api/ai/recommend-replacement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift, candidates }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'AI replacement recommendation unavailable');
      setAiRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
      setAiRecommendations([]);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Slot Contention Alert Banner for Admin if collisions detected */}
      {contentions.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-sky-500/15 border-2 border-amber-400/90 rounded-2xl p-4.5 shadow-sm animate-in fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>Validation Layer Alert: Shift Slot Contention Detected</span>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-200 text-amber-900 rounded-full">
                      {contentions.length} Slot Collision{contentions.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  Multiple staff members have requested the same shift slot. The engine evaluated verified availability history, on-time punctuality logs, and weekly hour caps to generate an automated <strong>Priority Assignment Recommendation</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('slot_claims')}
              className="shrink-0 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Review Priority Recommendations</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{t.requests}</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
              {portal === 'admin' ? 'Admin & GM Approval Center' : 'My Requests Status'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Time-Off, Shift Swaps, Slot Claims with Availability-based Priority Assignment, and 7-day Availability.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('slot_claims')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'slot_claims' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Shift Slot Claims</span>
            {contentions.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {contentions.length} Conflict
              </span>
            ) : pendingSlotRequests.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-sky-500 text-white rounded-full text-[10px] font-bold">
                {pendingSlotRequests.length}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveSubTab('timeoff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'timeoff' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.timeOff}</span>
            {pendingTimeOff.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                {pendingTimeOff.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('swap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'swap' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{t.shiftSwap}</span>
            {pendingSwaps.length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[10px] font-bold">
                {pendingSwaps.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('sick')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'sick' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t.sickDay}</span>
            {activeSick.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                {activeSick.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('availability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'availability' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{t.availability}</span>
            {pendingAvailability.length > 0 && (
              <span className="px-1.5 py-0.2 bg-sky-500 text-white rounded-full text-[10px] font-bold">
                {pendingAvailability.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 0. Shift Slot Claims & Priority Assignment Validation Section */}
      {activeSubTab === 'slot_claims' && (
        <div className="space-y-6">
          {/* Contentions List */}
          {contentions.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border-2 border-amber-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Active Slot Contentions ({contentions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Two or more employees requested the identical shift slot. Availability history and attendance records have been evaluated to generate automated Priority Recommendations.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg self-start sm:self-auto">
                  Priority Matching Engine Active
                </span>
              </div>

              <div className="space-y-6">
                {contentions.map((contention, cIdx) => {
                  const topCandidate = contention.analysis.find(a => a.isRecommendedPriority) || contention.analysis[0];

                  return (
                    <div
                      key={contention.contentionKey || cIdx}
                      className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200 space-y-4"
                    >
                      {/* Slot Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-1 text-xs font-black bg-sky-100 text-sky-800 rounded-lg">
                            {contention.department}
                          </span>
                          <span className="font-black text-sm text-slate-900">
                            {contention.role}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            • {contention.date} ({contention.startTime} - {contention.endTime})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            ⚡ {contention.contenderEmployeeNames.length} Staff Contending
                          </span>
                        </div>
                      </div>

                      {/* AI / Algorithmic Priority Recommendation Box */}
                      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                            <Award className="w-4 h-4 text-emerald-600" />
                            <span>⭐ System Priority Assignment Recommendation:</span>
                            <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-black">
                              {contention.recommendedCandidateName} ({topCandidate?.priorityScore}/100 Match Score)
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-emerald-950/90 leading-relaxed font-medium">
                          {contention.recommendationReason}
                        </p>
                      </div>

                      {/* Side-by-Side Contender Comparison Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {contention.analysis.map((candidate) => {
                          const isTop = candidate.isRecommendedPriority;
                          const originalReq = contention.requests.find(r => r.employeeId === candidate.employeeId);

                          return (
                            <div
                              key={candidate.employeeId}
                              className={`bg-white rounded-xl p-4 border transition-all relative ${
                                isTop
                                  ? 'border-emerald-400 shadow-sm ring-2 ring-emerald-400/20'
                                  : 'border-slate-200 opacity-95'
                              }`}
                            >
                              {isTop && (
                                <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md flex items-center gap-1 border border-emerald-300">
                                  <Award className="w-3 h-3 text-emerald-600" />
                                  <span>Recommended Priority</span>
                                </div>
                              )}

                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">{candidate.employeeName}</span>
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                                      candidate.priorityScore >= 85
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : candidate.priorityScore >= 70
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {candidate.priorityScore}/100 Score
                                    </span>
                                  </div>
                                  {originalReq?.reason && (
                                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                                      "{originalReq.reason}"
                                    </p>
                                  )}
                                </div>

                                {/* Evaluation Metrics Breakdown */}
                                <div className="space-y-2 text-xs divide-y divide-slate-100">
                                  {/* Availability History */}
                                  <div className="pt-1.5 flex items-start justify-between gap-2">
                                    <span className="text-slate-500 font-medium">Availability History:</span>
                                    <div className="text-right">
                                      <span className={`font-bold capitalize px-1.5 py-0.2 rounded text-[10px] ${
                                        candidate.availabilityHistory.statedPreference === 'preferred'
                                          ? 'bg-emerald-100 text-emerald-800 font-black'
                                          : candidate.availabilityHistory.statedPreference === 'open'
                                          ? 'bg-sky-100 text-sky-800 font-bold'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}>
                                        {candidate.availabilityHistory.statedPreference}
                                      </span>
                                      <div className="text-[10px] text-slate-500 mt-0.5 max-w-[190px]">
                                        {candidate.availabilityHistory.details}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Attendance Punctuality */}
                                  <div className="pt-1.5 flex items-center justify-between gap-2">
                                    <span className="text-slate-500 font-medium">Attendance Record:</span>
                                    <div className="text-right">
                                      <span className={`font-bold text-xs ${
                                        candidate.attendanceReliability.onTimeRate >= 95 ? 'text-emerald-700' : 'text-slate-800'
                                      }`}>
                                        {candidate.attendanceReliability.onTimeRate}% On-Time
                                      </span>
                                      <span className="text-[10px] text-slate-400 ml-1">
                                        ({candidate.attendanceReliability.lateCount} late)
                                      </span>
                                    </div>
                                  </div>

                                  {/* Weekly Hours & Overtime Risk */}
                                  <div className="pt-1.5 flex items-center justify-between gap-2">
                                    <span className="text-slate-500 font-medium">Weekly Hours / OT:</span>
                                    <div className="text-right">
                                      {candidate.workloadFactors.overtimeRisk ? (
                                        <span className="font-bold text-amber-700 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                          ⚠️ Overtime: {candidate.workloadFactors.projectedHoursIfAssigned}h (+{candidate.workloadFactors.overtimeHoursExcess}h OT)
                                        </span>
                                      ) : (
                                        <span className="font-bold text-emerald-700 text-xs">
                                          {candidate.workloadFactors.projectedHoursIfAssigned}h (Safe, &lt;40h)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Seniority */}
                                  <div className="pt-1.5 flex items-center justify-between gap-2">
                                    <span className="text-slate-500 font-medium">Seniority / Tenure:</span>
                                    <span className="font-semibold text-slate-800 text-xs">
                                      {Math.floor(candidate.seniorityMonths / 12)}y {candidate.seniorityMonths % 12}m
                                    </span>
                                  </div>
                                </div>

                                {/* Decision Action Buttons */}
                                {portal === 'admin' && (
                                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (onResolveContentionWithPriority) {
                                          onResolveContentionWithPriority(contention, candidate.employeeId);
                                        } else if (onApproveShiftSlot && originalReq) {
                                          onApproveShiftSlot(originalReq.id, true);
                                        }
                                      }}
                                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                        isTop
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black'
                                          : 'bg-slate-800 hover:bg-slate-900 text-white'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>
                                        {isTop
                                          ? 'Approve Priority Candidate (Assign Shift & Reject Others)'
                                          : `Assign to ${candidate.employeeName} (Override)`}
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Shift Slot Claims (Single Requests & History) */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>All Shift Slot Requests &amp; Open Claims ({shiftSlotRequests.length})</span>
              </h3>
              <span className="text-xs text-slate-500">Live validation active</span>
            </div>

            {shiftSlotRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No shift slot claims submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {shiftSlotRequests.map((req) => (
                  <div key={req.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">{req.employeeName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md">
                          {req.department} • {req.role}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        <strong>Requested Slot:</strong> {req.date} ({req.startTime} - {req.endTime}) {req.reason ? `• "${req.reason}"` : ''}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Submitted: {req.createdAt}
                      </div>
                    </div>

                    {portal === 'admin' && req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onApproveShiftSlot && onApproveShiftSlot(req.id, false)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve &amp; Assign</span>
                        </button>
                        <button
                          onClick={() => onRejectShiftSlot && onRejectShiftSlot(req.id)}
                          className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Time Off Requests Section */}
      {activeSubTab === 'timeoff' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Time-Off Submissions ({timeOffRequests.length})</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Requires GM/Admin Approval</span>
          </div>

          <div className="divide-y divide-slate-100">
            {timeOffRequests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{req.employeeName}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md">
                      {req.type}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      req.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    <strong>Dates:</strong> {req.startDate} to {req.endDate} • <em>"{req.reason}"</em>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Submitted on {req.createdAt}
                  </div>
                </div>

                {portal === 'admin' && req.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onApproveTimeOff(req.id)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.approve}</span>
                    </button>
                    <button
                      onClick={() => onRejectTimeOff(req.id)}
                      className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t.reject}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Shift Swap Requests Section */}
      {activeSubTab === 'swap' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                <span>Shift Swap Requests ({shiftSwapRequests.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Peer agreement confirmed. Final approval enforced exclusively by Admin / General Manager.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-200">
              Admin Exclusive Approval
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {shiftSwapRequests.map((swap) => (
              <div key={swap.id} className="py-4 space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{swap.requesterEmployeeName}</span>
                    <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-bold text-sm text-slate-900">{swap.targetEmployeeName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Peer Status: {swap.peerApprovalStatus}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      swap.adminApprovalStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : swap.adminApprovalStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      Admin: {swap.adminApprovalStatus}
                    </span>
                  </div>
                </div>

                {/* Details box */}
                <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <div className="font-semibold text-sky-800">Original Requester Shift:</div>
                    <div>{swap.requesterShiftDate} ({swap.requesterShiftTime})</div>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-800">Target Shift / Exchange:</div>
                    <div>{swap.targetShiftDate || 'Direct Shift Cover'} ({swap.targetShiftTime || 'N/A'})</div>
                  </div>
                  <div className="sm:col-span-2 text-[11px] text-slate-500">
                    <strong>Reason:</strong> "{swap.reason}" • Requested: {swap.createdAt}
                  </div>
                </div>

                {portal === 'admin' && swap.adminApprovalStatus === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onApproveShiftSwap(swap.id)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Update Calendar</span>
                    </button>
                    <button
                      onClick={() => onRejectShiftSwap(swap.id)}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline Swap</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sick Day Reports & AI Replacement Finder */}
      {activeSubTab === 'sick' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Emergency Sick Day Reports &amp; Coverage Dispatch</span>
              </h3>
              <p className="text-xs text-slate-500">
                Immediate call-outs for food safety compliance. Find qualified substitute staff in 1 click using Gemini AI.
              </p>
            </div>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-200">
              Food Safety Compliance
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {sickReports.map((report) => (
              <div key={report.id} className="py-4 space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{report.employeeName}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                        {report.department}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <strong>Scheduled Shift:</strong> {report.shiftDate} ({report.shiftTime})
                    </div>
                    <div className="text-xs text-slate-700 mt-0.5 italic">
                      "Symptoms: {report.symptomsSummary}"
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      report.status === 'covered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                    }`}>
                      {report.status === 'covered' ? 'Covered' : 'Needs Replacement Staff'}
                    </span>

                    {report.status !== 'covered' && (
                      <button
                        onClick={() => handleFindAiCoverage(report)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>AI Find Replacement</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Smart Replacement Candidate Recommendations */}
                {aiFindingCoverageFor?.id === report.id && (
                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                        <Sparkles className="w-4 h-4 text-sky-600" />
                        <span>Gemini AI Recommended Replacement Staff:</span>
                      </div>
                      {loadingAi && <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {aiRecommendations.map((cand, idx) => (
                        <div key={cand.employeeId || idx} className="bg-white p-3 rounded-xl border border-sky-100 shadow-2xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{cand.name}</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                              {cand.matchScore}% Match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-tight">
                            {cand.reason}
                          </p>
                          <button
                            onClick={() => {
                              onAcknowledgeSickReport(report.id, cand.employeeId);
                              setAiFindingCoverageFor(null);
                            }}
                            className="w-full mt-1 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            Assign &amp; Notify Coverage Staff
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Availability Change Requests */}
      {activeSubTab === 'availability' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <span>Weekly Availability Change Requests ({availabilityRequests.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Staff weekly recurring day &amp; time preferences. Admin approval required to take effect.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {availabilityRequests.map((avail) => (
              <div key={avail.id} className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{avail.employeeName}</span>
                    <span className="text-xs text-slate-500 ml-2">Effective: {avail.effectiveDate}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    avail.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {avail.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5 text-center text-xs">
                  {Object.entries(avail.weeklyPreferences).map(([day, pref]) => {
                    const p = pref as { status?: string; preferredShift?: string };
                    const statusStr = p?.status || 'available';
                    return (
                      <div key={day} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="font-bold text-[11px] text-slate-600">{day.slice(0, 3)}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 capitalize ${
                          statusStr === 'unavailable'
                            ? 'text-rose-600'
                            : statusStr === 'preferred'
                            ? 'text-emerald-600'
                            : 'text-sky-700'
                        }`}>
                          {statusStr.replace('_', ' ')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-600">
                  <strong>Reason:</strong> "{avail.reason}"
                </div>

                {portal === 'admin' && avail.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onApproveAvailability(avail.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Approve Availability
                    </button>
                    <button
                      onClick={() => onRejectAvailability(avail.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
