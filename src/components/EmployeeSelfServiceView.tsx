import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
  UserCheck,
  Send,
  CheckCircle2,
  Sparkles,
  DollarSign,
  User,
  Check,
  Layers,
  Award,
  Zap,
  Info,
  Target,
  Flame,
  Bell,
  CalendarCheck2,
  Calculator,
  MapPin
} from 'lucide-react';
import {
  Employee,
  Shift,
  TimeOffRequest,
  ShiftSwapRequest,
  SickDayReport,
  AvailabilityRequest,
  ShiftSlotRequest,
  TardinessRecord,
  SupportedLanguage
} from '../types';
import { EmployeePersonalDevelopmentCalendar } from './EmployeePersonalDevelopmentCalendar';
import { EmployeePaycheckCalculatorModal } from './payroll/EmployeePaycheckCalculatorModal';
import { StateTaxBracketsExplorerModal } from './payroll/StateTaxBracketsExplorerModal';
import { EmployeeActionLog } from './EmployeeActionLog';
import { FileText } from 'lucide-react';

interface EmployeeSelfServiceViewProps {
  currentEmployee: Employee;
  employees: Employee[];
  shifts: Shift[];
  currentLanguage: SupportedLanguage;
  weekDates: { dateStr: string; dayName: string; dayNumber: number }[];
  shiftSlotRequests?: ShiftSlotRequest[];
  timeOffRequests?: TimeOffRequest[];
  shiftSwapRequests?: ShiftSwapRequest[];
  sickReports?: SickDayReport[];
  tardinessLog?: TardinessRecord[];
  onSelectEmployee: (employeeId: string) => void;
  onSubmitTimeOff: (req: Omit<TimeOffRequest, 'id' | 'createdAt' | 'status'>) => void;
  onSubmitShiftSwap: (swap: Omit<ShiftSwapRequest, 'id' | 'createdAt' | 'peerApprovalStatus' | 'adminApprovalStatus'>) => void;
  onSubmitSickReport: (report: Omit<SickDayReport, 'id' | 'reportedAt' | 'status'>) => void;
  onSubmitAvailability: (avail: Omit<AvailabilityRequest, 'id' | 'createdAt' | 'status'>) => void;
  onSubmitShiftSlot?: (req: Omit<ShiftSlotRequest, 'id' | 'createdAt' | 'status'>) => void;
}

export const EmployeeSelfServiceView: React.FC<EmployeeSelfServiceViewProps> = ({
  currentEmployee,
  employees,
  shifts,
  currentLanguage,
  weekDates,
  shiftSlotRequests = [],
  timeOffRequests = [],
  shiftSwapRequests = [],
  sickReports = [],
  tardinessLog = [],
  onSelectEmployee,
  onSubmitTimeOff,
  onSubmitShiftSwap,
  onSubmitSickReport,
  onSubmitAvailability,
  onSubmitShiftSlot,
}) => {
  const t = translations[currentLanguage];
  const [activeTab, setActiveTab] = useState<'personal_development' | 'action_log' | 'my_schedule' | 'request_slot' | 'request_swap' | 'request_timeoff' | 'report_sick' | 'update_avail'>('personal_development');
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  // Paycheck & Tax Calculator Modal State
  const [isPaycheckModalOpen, setIsPaycheckModalOpen] = useState<boolean>(false);
  const [isTaxBracketsModalOpen, setIsTaxBracketsModalOpen] = useState<boolean>(false);
  const [stateCode, setStateCode] = useState<string>('CA');

  // Form States
  // 0. Shift Slot Claim Form
  const [slotDate, setSlotDate] = useState(weekDates[5]?.dateStr || '2026-08-16');
  const [slotStartTime, setSlotStartTime] = useState('16:00');
  const [slotEndTime, setSlotEndTime] = useState('23:30');
  const [slotReason, setSlotReason] = useState('Available and requesting this dinner shift.');

  // 1. Shift Swap Form
  const [selectedShiftToSwap, setSelectedShiftToSwap] = useState<string>('');
  const [targetColleagueId, setTargetColleagueId] = useState<string>('');
  const [swapReason, setSwapReason] = useState('Family dinner / personal commitment');

  // 2. Time Off Form
  const [timeOffStartDate, setTimeOffStartDate] = useState(weekDates[0]?.dateStr || '');
  const [timeOffEndDate, setTimeOffEndDate] = useState(weekDates[2]?.dateStr || '');
  const [timeOffType, setTimeOffType] = useState<TimeOffRequest['type']>('vacation');
  const [timeOffReason, setTimeOffReason] = useState('Summer family trip');

  // 3. Sick Day Form
  const [sickShiftDate, setSickShiftDate] = useState(weekDates[0]?.dateStr || '');
  const [sickShiftTime, setSickShiftTime] = useState('16:00 - 23:30');
  const [sickSymptoms, setSickSymptoms] = useState('Flu, fever, nausea');

  // 4. Availability Form
  const [availPreferences, setAvailPreferences] = useState({
    monday: { status: 'preferred' as const, preferredShift: 'evening' as const },
    tuesday: { status: 'available' as const, preferredShift: 'evening' as const },
    wednesday: { status: 'available' as const, preferredShift: 'morning' as const },
    thursday: { status: 'available' as const, preferredShift: 'evening' as const },
    friday: { status: 'preferred' as const, preferredShift: 'evening' as const },
    saturday: { status: 'preferred' as const, preferredShift: 'evening' as const },
    sunday: { status: 'unavailable' as const },
  });
  const [availReason, setAvailReason] = useState('College evening class schedule adjustment');

  // My Shifts
  const myShifts = shifts.filter(s => s.employeeId === currentEmployee.id);
  const mySlotRequests = shiftSlotRequests.filter(s => s.employeeId === currentEmployee.id);

  const myTotalHours = myShifts.reduce((acc, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return acc + (diff - s.breakMinutes) / 60;
  }, 0);
  const myGrossEarnings = myTotalHours * currentEmployee.hourlyWage;

  const handleSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitShiftSlot) {
      onSubmitShiftSlot({
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        role: currentEmployee.role,
        department: currentEmployee.department,
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        reason: slotReason,
      });
      setSubmittedFeedback('Shift slot claim submitted! If other staff claim the same slot, the validation layer runs Priority Assignment matching.');
      setTimeout(() => setSubmittedFeedback(null), 5000);
    }
  };

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const myShift = myShifts.find(s => s.id === selectedShiftToSwap) || myShifts[0];
    const targetEmp = employees.find(e => e.id === targetColleagueId) || employees.filter(e => e.id !== currentEmployee.id)[0];
    if (!myShift || !targetEmp) return;

    onSubmitShiftSwap({
      requesterEmployeeId: currentEmployee.id,
      requesterEmployeeName: currentEmployee.name,
      requesterShiftId: myShift.id,
      requesterShiftDate: myShift.date,
      requesterShiftTime: `${myShift.startTime} - ${myShift.endTime}`,
      targetEmployeeId: targetEmp.id,
      targetEmployeeName: targetEmp.name,
      reason: swapReason,
    });

    setSubmittedFeedback('Shift swap submitted! Awaiting peer acceptance and final GM approval.');
    setTimeout(() => setSubmittedFeedback(null), 4000);
  };

  const handleTimeOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitTimeOff({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      startDate: timeOffStartDate,
      endDate: timeOffEndDate,
      type: timeOffType,
      reason: timeOffReason,
    });

    setSubmittedFeedback('Time-off request dispatched to Admin / General Manager.');
    setTimeout(() => setSubmittedFeedback(null), 4000);
  };

  const handleSickReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSickReport({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      department: currentEmployee.department,
      shiftId: myShifts[0]?.id || 'shift-demo',
      shiftDate: sickShiftDate,
      shiftTime: sickShiftTime,
      symptomsSummary: sickSymptoms,
    });

    setSubmittedFeedback('Sick day reported! ShiftForce dispatched notifications to GM & will initiate coverage.');
    setTimeout(() => setSubmittedFeedback(null), 4000);
  };

  const handleAvailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAvailability({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      weeklyPreferences: availPreferences,
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: availReason,
    });

    setSubmittedFeedback('Availability change submitted for Admin approval.');
    setTimeout(() => setSubmittedFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">

      {/* 100% Free Staff Account Notice */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">ShiftForce Employee Portal • 100% Free for Staff</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                $0 Staff Cost
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Your restaurant host and management sponsor full platform access. You have unlimited access to shift schedules, clock-ins, shift trades, development tracking, and paycheck estimates at zero cost.
            </p>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
          Sponsored by Host &amp; Admin
        </div>
      </div>

      {/* Employee Switcher Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
            style={{ backgroundColor: currentEmployee.color }}
          >
            {currentEmployee.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">{currentEmployee.name}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md">
                {currentEmployee.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentEmployee.department} • ${currentEmployee.hourlyWage.toFixed(2)}/hr • {currentEmployee.phone}
            </p>
          </div>
        </div>

        {/* Quick Switch Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">View as Staff:</span>
          <select
            value={currentEmployee.id}
            onChange={(e) => onSelectEmployee(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-800 focus:outline-hidden"
          >
            {employees.slice(0, 20).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('personal_development')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'personal_development'
              ? 'bg-linear-to-r from-sky-600 to-indigo-600 text-white font-bold shadow-xs'
              : 'text-slate-700 hover:text-slate-900 bg-white/60 font-semibold'
          }`}
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>Personal Development & Month Calendar</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold ml-0.5">NEW</span>
        </button>

        <button
          onClick={() => setActiveTab('action_log')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'action_log'
              ? 'bg-white text-sky-800 font-bold shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Action & Audit Log</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700 font-bold ml-0.5">Transparency</span>
        </button>

        <button
          onClick={() => setActiveTab('my_schedule')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'my_schedule' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>My Shifts ({myShifts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('request_slot')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'request_slot' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Claim Open Shift Slot</span>
        </button>

        <button
          onClick={() => setActiveTab('request_swap')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'request_swap' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>{t.requestShiftSwap}</span>
        </button>

        <button
          onClick={() => setActiveTab('request_timeoff')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'request_timeoff' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t.requestTimeOff}</span>
        </button>

        <button
          onClick={() => setActiveTab('report_sick')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'report_sick' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t.reportSickDay}</span>
        </button>

        <button
          onClick={() => setActiveTab('update_avail')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'update_avail' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t.updateAvailability}</span>
        </button>
      </div>

      {/* Success Feedback Alert */}
      {submittedFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{submittedFeedback}</span>
        </div>
      )}

      {/* Sub-Tab: Personal Development & Whole Month Master Calendar */}
      {activeTab === 'personal_development' && (
        <EmployeePersonalDevelopmentCalendar
          currentEmployee={currentEmployee}
          shifts={shifts}
        />
      )}

      {/* Sub-Tab: Personal Action Log & Audit History */}
      {activeTab === 'action_log' && (
        <EmployeeActionLog
          currentEmployee={currentEmployee}
          shifts={shifts}
          timeOffRequests={timeOffRequests}
          shiftSwapRequests={shiftSwapRequests}
          sickReports={sickReports}
          tardinessLog={tardinessLog}
          currentLanguage={currentLanguage}
        />
      )}

      {/* Sub-Tab 0: Claim Open Shift Slot */}
      {activeTab === 'request_slot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-sky-100 space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Claim Shift Slot (With Contention Resolution)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Submit a request for an open shift slot. If multiple team members request the same slot, ShiftForce's validation layer evaluates availability history, attendance reliability, and overtime limits to generate a Priority Assignment recommendation for the General Manager.
              </p>
            </div>

            <form onSubmit={handleSlotSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shift Date:</label>
                  <input
                    type="date"
                    required
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time:</label>
                  <input
                    type="time"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time:</label>
                  <input
                    type="time"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Notes for Admin:</label>
                <textarea
                  rows={3}
                  required
                  value={slotReason}
                  onChange={(e) => setSlotReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g., Stated Saturday dinner as Preferred in availability profile..."
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-2 text-sky-900">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Priority Validation Engine:</strong> Your verified availability preferences ({currentEmployee.role}), on-time punch history, and 40h weekly cap will automatically be factored into the manager's review.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Submit Shift Slot Claim
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 space-y-4">
            <h4 className="font-bold text-sm text-slate-900">My Shift Slot Claims ({mySlotRequests.length})</h4>
            {mySlotRequests.length === 0 ? (
              <p className="text-xs text-slate-400">No shift slot claims submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {mySlotRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{req.date}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-slate-600">{req.startTime} - {req.endTime} ({req.role})</div>
                    {req.reason && <div className="text-[11px] text-slate-500 italic">"{req.reason}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 1: My 7-Day Shifts & Projected Gross Earnings */}
      {activeTab === 'my_schedule' && (
        <div className="space-y-6">
          {/* Earnings & Weekly Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Scheduled Shifts</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{myShifts.length} Shifts</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Current 7-day schedule window</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Total Weekly Hours</div>
              <div className="text-2xl font-bold text-sky-700 mt-1">{myTotalHours.toFixed(1)} hrs</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Max cap: {currentEmployee.maxHoursPerWeek} hrs/wk</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                <span>Projected Gross Pay</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ${myGrossEarnings.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Base Rate: ${currentEmployee.hourlyWage.toFixed(2)}/hr</div>
            </div>
          </div>

          {/* Paycheck Calculator Banner */}
          <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-extrabold uppercase">
                  50-State Tax Engine
                </span>
                <span className="text-xs font-bold text-slate-300">IRS 2026 Ready</span>
              </div>
              <h4 className="text-base font-extrabold tracking-tight text-white">
                Calculate Take-Home Paycheck & Tax Withholding
              </h4>
              <p className="text-xs text-slate-300 max-w-xl">
                See exact federal income tax, Social Security, Medicare, and state tax withholdings with credit card & cash tips breakdown and print your pay stub.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsPaycheckModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculate Paycheck</span>
              </button>
              <button
                onClick={() => setIsTaxBracketsModalOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Tax Tables</span>
              </button>
            </div>
          </div>

          {/* Detailed Shifts List */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">My 7-Day Assigned Shifts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/40 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{shift.date}</span>
                      <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-800">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      <strong>{shift.role}</strong> • {shift.department}
                    </div>
                    {shift.notes && (
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        📍 Station: {shift.notes}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {shift.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Request Shift Swap */}
      {activeTab === 'request_swap' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-purple-600" />
              <span>{t.requestShiftSwap}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select one of your scheduled shifts to exchange with a colleague. Both team members and the General Manager must approve.
            </p>
          </div>

          <form onSubmit={handleSwapSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Your Shift to Swap:</label>
              <select
                required
                value={selectedShiftToSwap}
                onChange={(e) => setSelectedShiftToSwap(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Choose your shift --</option>
                {myShifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} ({s.startTime} - {s.endTime}) - {s.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Colleague to Propose Swap To:</label>
              <select
                required
                value={targetColleagueId}
                onChange={(e) => setTargetColleagueId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Choose team member --</option>
                {employees.filter(e => e.id !== currentEmployee.id).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role} • {emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason for Swap:</label>
              <textarea
                rows={3}
                required
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Reason for requesting this swap..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Submit Shift Swap Request
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Request Time Off */}
      {activeTab === 'request_timeoff' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>{t.requestTimeOff}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit planned vacation, personal leave, or medical time-off. Requests are routed directly to Admin.
            </p>
          </div>

          <form onSubmit={handleTimeOffSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Start Date:</label>
                <input
                  type="date"
                  required
                  value={timeOffStartDate}
                  onChange={(e) => setTimeOffStartDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">End Date:</label>
                <input
                  type="date"
                  required
                  value={timeOffEndDate}
                  onChange={(e) => setTimeOffEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Leave Type:</label>
              <select
                value={timeOffType}
                onChange={(e) => setTimeOffType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="vacation">Vacation / Paid Time Off</option>
                <option value="personal">Personal Leave</option>
                <option value="medical">Medical / Doctor Appointment</option>
                <option value="bereavement">Bereavement</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason / Details:</label>
              <textarea
                rows={3}
                required
                value={timeOffReason}
                onChange={(e) => setTimeOffReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Submit Time-Off Request
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 4: Report Emergency Sick Day */}
      {activeTab === 'report_sick' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-base text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{t.reportSickDay} (Immediate Call-Out)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Food safety protocol requires immediate reporting of fever, vomiting, or flu symptoms. ShiftForce automatically flags the shift for GM replacement dispatch.
            </p>
          </div>

          <form onSubmit={handleSickReportSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Date of Shift Affected:</label>
                <input
                  type="date"
                  required
                  value={sickShiftDate}
                  onChange={(e) => setSickShiftDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Shift Hours:</label>
                <input
                  type="text"
                  required
                  value={sickShiftTime}
                  onChange={(e) => setSickShiftTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. 16:00 - 23:30"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Symptoms Summary (Food Safety):</label>
              <textarea
                rows={3}
                required
                value={sickSymptoms}
                onChange={(e) => setSickSymptoms(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="Describe your symptoms for sanitation & compliance records..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Report Sick Call-Out
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab 5: Update Weekly Availability */}
      {activeTab === 'update_avail' && (
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100 max-w-2xl mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.updateAvailability}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Set your recurring weekly shift preferences. Changes require Admin confirmation before taking effect.
            </p>
          </div>

          <form onSubmit={handleAvailSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(availPreferences) as (keyof typeof availPreferences)[]).map((day) => (
                <div key={day} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold capitalize text-slate-800">{day}</span>
                  <select
                    value={availPreferences[day].status}
                    onChange={(e) => setAvailPreferences({
                      ...availPreferences,
                      [day]: { ...availPreferences[day], status: e.target.value as any }
                    })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="preferred">Preferred</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              ))}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Reason for Availability Change:</label>
              <input
                type="text"
                required
                value={availReason}
                onChange={(e) => setAvailReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Submit Availability for Admin Approval
            </button>
          </form>
        </div>
      )}

      {/* Paycheck Calculator Modal */}
      <EmployeePaycheckCalculatorModal
        isOpen={isPaycheckModalOpen}
        onClose={() => setIsPaycheckModalOpen(false)}
        employee={currentEmployee}
        employees={employees}
        shifts={shifts}
        defaultStateCode={stateCode}
        onSelectState={(code) => setStateCode(code)}
      />

      {/* State Tax Brackets Explorer Modal */}
      <StateTaxBracketsExplorerModal
        isOpen={isTaxBracketsModalOpen}
        onClose={() => setIsTaxBracketsModalOpen(false)}
        selectedStateCode={stateCode}
        onSelectState={(code) => setStateCode(code)}
      />

    </div>
  );
};