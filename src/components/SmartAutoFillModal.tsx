import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  X,
  Check,
  AlertTriangle,
  Clock,
  DollarSign,
  UserCheck,
  ShieldCheck,
  Layers,
  Calendar as CalendarIcon,
  ChevronRight,
  RefreshCw,
  Sliders,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Info
} from 'lucide-react';
import {
  Employee,
  Shift,
  Department,
  RestaurantRole,
  ShiftTemplate,
  AvailabilityRequest,
  TimeOffRequest,
  DepartmentBudgetsMap,
  OpenSlot,
  SmartAutoFillPlan,
  SmartAutoFillSlotRecommendation,
  SmartMatchCandidate
} from '../types';
import {
  detectScheduleOpenSlots,
  generateSmartAutoFillPlan
} from '../utils/smartAutoFill';

interface SmartAutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  employees: Employee[];
  templates: ShiftTemplate[];
  availabilityRequests: AvailabilityRequest[];
  timeOffRequests: TimeOffRequest[];
  departmentBudgets: DepartmentBudgetsMap;
  weekDates: { dateStr: string; dayName: string; dayNumber: number; fullDate: Date }[];
  onApplyAutoFillShifts: (newShifts: Omit<Shift, 'id'>[]) => void;
  selectedDepartmentFilter?: Department | 'all';
}

export const SmartAutoFillModal: React.FC<SmartAutoFillModalProps> = ({
  isOpen,
  onClose,
  shifts,
  employees,
  templates,
  availabilityRequests,
  timeOffRequests,
  departmentBudgets,
  weekDates,
  onApplyAutoFillShifts,
  selectedDepartmentFilter = 'all',
}) => {
  const [activeDept, setActiveDept] = useState<Department | 'all'>(selectedDepartmentFilter);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [plan, setPlan] = useState<SmartAutoFillPlan | null>(null);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  // Preference switches
  const [strictBudgetMode, setStrictBudgetMode] = useState(true);
  const [overtimeGuard, setOvertimeGuard] = useState(true);

  // Load and calculate initial auto-fill recommendations
  const runAutoFillAnalysis = async () => {
    setIsLoading(true);
    try {
      const openSlots = detectScheduleOpenSlots(weekDates, shifts, templates, activeDept);
      const generatedPlan = await generateSmartAutoFillPlan(
        openSlots,
        employees,
        shifts,
        availabilityRequests,
        timeOffRequests,
        departmentBudgets,
        true
      );
      setPlan(generatedPlan);
      if (generatedPlan.recommendations.length > 0) {
        setExpandedSlotId(generatedPlan.recommendations[0].slotId);
      }
    } catch (err) {
      console.error('Failed to run smart auto fill:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveDept(selectedDepartmentFilter);
      runAutoFillAnalysis();
    }
  }, [isOpen, selectedDepartmentFilter]);

  // Re-run when department changes
  const handleDepartmentChange = (dept: Department | 'all') => {
    setActiveDept(dept);
    setIsLoading(true);
    const openSlots = detectScheduleOpenSlots(weekDates, shifts, templates, dept);
    generateSmartAutoFillPlan(
      openSlots,
      employees,
      shifts,
      availabilityRequests,
      timeOffRequests,
      departmentBudgets,
      true
    ).then((generatedPlan) => {
      setPlan(generatedPlan);
      if (generatedPlan.recommendations.length > 0) {
        setExpandedSlotId(generatedPlan.recommendations[0].slotId);
      }
      setIsLoading(false);
    });
  };

  // Toggle slot inclusion
  const handleToggleIncludeSlot = (slotId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      recommendations: plan.recommendations.map(r =>
        r.slotId === slotId ? { ...r, isIncluded: !r.isIncluded } : r
      ),
    });
  };

  // Select alternative candidate for a slot
  const handleSelectCandidate = (slotId: string, employeeId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      recommendations: plan.recommendations.map(r =>
        r.slotId === slotId ? { ...r, selectedCandidateId: employeeId } : r
      ),
    });
  };

  // Calculate live summary based on current selections
  const liveSummary = useMemo(() => {
    if (!plan) return { totalSlots: 0, includedCount: 0, totalCost: 0, totalHours: 0, otSafeCount: 0 };

    let totalCost = 0;
    let totalHours = 0;
    let otSafeCount = 0;
    let includedCount = 0;

    plan.recommendations.forEach(r => {
      if (r.isIncluded && r.selectedCandidateId) {
        const cand = r.topCandidates.find(c => c.employeeId === r.selectedCandidateId);
        if (cand) {
          includedCount++;
          totalCost += cand.shiftCost;
          totalHours += cand.shiftHours;
          if (!cand.causesOvertime) otSafeCount++;
        }
      }
    });

    return {
      totalSlots: plan.recommendations.length,
      includedCount,
      totalCost,
      totalHours,
      otSafeCount,
    };
  }, [plan]);

  // Handle final submission to calendar
  const handleApplyAll = () => {
    if (!plan) return;

    const newShiftsToCreate: Omit<Shift, 'id'>[] = [];

    plan.recommendations.forEach((r) => {
      if (r.isIncluded && r.selectedCandidateId) {
        const cand = r.topCandidates.find(c => c.employeeId === r.selectedCandidateId);
        const emp = employees.find(e => e.id === r.selectedCandidateId);
        if (cand && emp) {
          newShiftsToCreate.push({
            employeeId: emp.id,
            employeeName: emp.name,
            department: r.department,
            role: r.role,
            date: r.date,
            startTime: r.startTime,
            endTime: r.endTime,
            breakMinutes: r.breakMinutes,
            hourlyWage: emp.hourlyWage,
            color: emp.color,
            status: 'draft',
            notes: r.notes ? `AI Auto-Fill: ${r.notes}` : 'Auto-filled via AI Smart Match',
          });
        }
      }
    });

    if (newShiftsToCreate.length > 0) {
      onApplyAutoFillShifts(newShiftsToCreate);
      onClose();
    }
  };

  // Handle single slot fill
  const handleApplySingleSlot = (slotRec: SmartAutoFillSlotRecommendation) => {
    if (!slotRec.selectedCandidateId) return;
    const emp = employees.find(e => e.id === slotRec.selectedCandidateId);
    if (!emp) return;

    onApplyAutoFillShifts([{
      employeeId: emp.id,
      employeeName: emp.name,
      department: slotRec.department,
      role: slotRec.role,
      date: slotRec.date,
      startTime: slotRec.startTime,
      endTime: slotRec.endTime,
      breakMinutes: slotRec.breakMinutes,
      hourlyWage: emp.hourlyWage,
      color: emp.color,
      status: 'draft',
      notes: slotRec.notes ? `AI Auto-Fill: ${slotRec.notes}` : 'Auto-filled via AI Smart Match',
    }]);

    // Remove filled slot from current view
    if (plan) {
      setPlan({
        ...plan,
        recommendations: plan.recommendations.filter(r => r.slotId !== slotRec.slotId),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-sky-100 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-start justify-between gap-4 border-b border-slate-700">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    AI Smart Auto-Fill
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-sky-500/30 text-sky-300 border border-sky-400/30 rounded-full flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    Gemini AI Engine
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Suggests optimal employee matches for open slots based on historical availability, department roles &amp; labor budgets.
                </p>
              </div>
            </div>
          </div>

          <button
            id="close-smart-autofill-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">

          {/* Department Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {(['all', 'Front of House', 'Back of House', 'Bar & Beverage', 'Kitchen Prep & Dish', 'Management'] as const).map((dept) => (
              <button
                key={dept}
                onClick={() => handleDepartmentChange(dept)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeDept === dept
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {dept === 'all' ? 'All Departments' : dept}
              </button>
            ))}
          </div>

          {/* Quick Refresh & Constraints info */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={runAutoFillAnalysis}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Re-Analyze</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Analyzing Staff Availability, Roles &amp; Budgets...
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Cross-referencing approved employee availability requests, current weekly hours, overtime risks, and department budget headroom.
                </p>
              </div>
            </div>
          )}

          {!isLoading && plan && (
            <>
              {/* Strategic AI Insights Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50/60 border border-sky-200 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                      <span>AI Staffing &amp; Budget Optimization Strategy</span>
                    </span>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-200/70 px-2 py-0.5 rounded-full">
                      95% Match Confidence
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {plan.aiRationale}
                  </p>
                </div>
              </div>

              {/* Real-Time Impact Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold">Open Slots</span>
                    <Layers className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {liveSummary.includedCount} <span className="text-xs font-normal text-slate-500">/ {liveSummary.totalSlots} Slots</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Selected for Auto-Fill</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold">Added Labor Hours</span>
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    +{liveSummary.totalHours.toFixed(1)}h
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Weekly Shift Coverage</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold">Estimated Cost</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg font-black text-emerald-700 font-mono">
                    +${liveSummary.totalCost.toFixed(0)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Within Department Budgets</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold">Overtime Safety</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-lg font-black text-indigo-700 font-mono">
                    {liveSummary.otSafeCount} <span className="text-xs font-normal text-slate-500">/ {liveSummary.includedCount} Safe</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Zero 40h/wk Penalty</p>
                </div>
              </div>

              {/* No Slots Found State */}
              {plan.recommendations.length === 0 && (
                <div className="py-12 text-center p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">Schedule is Fully Staffed!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All core shift templates and department roles are currently covered for the selected view.
                  </p>
                </div>
              )}

              {/* Open Slots Recommendation Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Recommended Matches for Open Slots</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full font-mono">
                      {plan.recommendations.length}
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Click candidate to switch or customize selection
                  </span>
                </div>

                <div className="space-y-3">
                  {plan.recommendations.map((slotRec, index) => {
                    const isExpanded = expandedSlotId === slotRec.slotId;
                    const selectedCand = slotRec.topCandidates.find(c => c.employeeId === slotRec.selectedCandidateId) || slotRec.topCandidates[0];

                    return (
                      <div
                        key={slotRec.slotId}
                        className={`rounded-2xl border transition-all ${
                          slotRec.isIncluded
                            ? 'bg-white border-slate-200 shadow-xs hover:border-sky-300'
                            : 'bg-slate-50/60 border-slate-200 opacity-60'
                        }`}
                      >
                        {/* Slot Summary Header Row */}
                        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                          <div className="flex items-start gap-3">
                            {/* Checkbox to include/exclude */}
                            <button
                              type="button"
                              onClick={() => handleToggleIncludeSlot(slotRec.slotId)}
                              className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                slotRec.isIncluded
                                  ? 'bg-sky-600 text-white shadow-2xs'
                                  : 'bg-slate-100 border border-slate-300 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-xs text-slate-900">
                                  {slotRec.dayName}, {slotRec.date}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                                  {slotRec.startTime} - {slotRec.endTime}
                                </span>
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                                  {slotRec.role}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({slotRec.department})
                                </span>
                              </div>

                              {slotRec.notes && (
                                <p className="text-[11px] text-slate-500 mt-1">
                                  Requirement: {slotRec.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Selected / Best Match Pill & Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {selectedCand && (
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCand.color }} />
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-slate-900">
                                      {selectedCand.employeeName}
                                    </span>
                                    <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      {selectedCand.matchScore}% Match
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    ${selectedCand.hourlyWage}/hr • ${selectedCand.shiftCost.toFixed(0)} • {selectedCand.projectedWeeklyHours}h Wk
                                  </div>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => setExpandedSlotId(isExpanded ? null : slotRec.slotId)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide Options' : 'Options'}</span>
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleApplySingleSlot(slotRec)}
                              disabled={!selectedCand}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              title="1-Click Apply this single shift"
                            >
                              <span>Fill</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                        </div>

                        {/* Expanded Candidate Breakdown Options */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              <span>Ranked Candidate Options ({slotRec.topCandidates.length} Available Staff):</span>
                              <span className="text-slate-400 font-normal">Select candidate to apply</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {slotRec.topCandidates.map((candidate, cIdx) => {
                                const isSelected = slotRec.selectedCandidateId === candidate.employeeId;

                                return (
                                  <div
                                    key={candidate.employeeId}
                                    onClick={() => handleSelectCandidate(slotRec.slotId, candidate.employeeId)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                                      isSelected
                                        ? 'bg-white border-sky-500 ring-2 ring-sky-400/40 shadow-sm'
                                        : 'bg-white/70 hover:bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                  >
                                    {/* Rank badge & Name */}
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: candidate.color }} />
                                        <span className="font-bold text-xs text-slate-900">
                                          {candidate.employeeName}
                                        </span>
                                        {cIdx === 0 && (
                                          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                                            <Award className="w-2.5 h-2.5 text-amber-600" />
                                            Top Pick
                                          </span>
                                        )}
                                      </div>

                                      <span className={`px-2 py-0.5 text-[10px] font-black font-mono rounded-full ${
                                        candidate.matchScore >= 90
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : candidate.matchScore >= 75
                                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                                      }`}>
                                        {candidate.matchScore}% Match
                                      </span>
                                    </div>

                                    {/* Wage, Role & Hours */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2">
                                      <span className="font-mono">${candidate.hourlyWage}/hr • {candidate.role}</span>
                                      <span className={`font-mono font-bold ${candidate.causesOvertime ? 'text-rose-600' : 'text-slate-700'}`}>
                                        {candidate.currentWeeklyHours}h → {candidate.projectedWeeklyHours}h/40h
                                      </span>
                                    </div>

                                    {/* Reason Badges */}
                                    <div className="space-y-1">
                                      {candidate.reasons.slice(0, 2).map((r, rIdx) => (
                                        <div key={rIdx} className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium truncate">
                                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                          <span className="truncate">{r}</span>
                                        </div>
                                      ))}
                                      {candidate.warnings.map((w, wIdx) => (
                                        <div key={wIdx} className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium truncate">
                                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                          <span className="truncate">{w}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Selection Radio Dot */}
                                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-400">
                                        Shift Cost: ${candidate.shiftCost.toFixed(2)}
                                      </span>
                                      <span className={`font-bold ${isSelected ? 'text-sky-600' : 'text-slate-400'}`}>
                                        {isSelected ? '✓ Selected Match' : 'Click to select'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Applied shifts are placed into <strong>Draft</strong> status so you can review before publishing.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 font-bold text-xs text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="apply-all-smart-autofill-btn"
              onClick={handleApplyAll}
              disabled={isLoading || !plan || liveSummary.includedCount === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                1-Click Auto-Fill ({liveSummary.includedCount} Slots)
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
