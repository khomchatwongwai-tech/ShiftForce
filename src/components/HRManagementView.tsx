import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import { authenticatedFetch } from '../utils/apiClient';
import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Calendar,
  DollarSign,
  CheckSquare,
  Star,
  Sparkles,
  Download,
  FileText,
  Plus,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  Briefcase,
  Globe,
  Calculator,
  MapPin
} from 'lucide-react';
import { OnboardingCandidate, Employee, Shift, SupportedLanguage, Department, RestaurantRole } from '../types';
import { HiringPlatformHub } from './HiringPlatformHub';
import { EmployeePaycheckCalculatorModal } from './payroll/EmployeePaycheckCalculatorModal';
import { StateTaxBracketsExplorerModal } from './payroll/StateTaxBracketsExplorerModal';

interface HRManagementViewProps {
  candidates: OnboardingCandidate[];
  employees: Employee[];
  shifts: Shift[];
  currentLanguage: SupportedLanguage;
  onUpdateCandidateStage: (id: string, stage: OnboardingCandidate['stage']) => void;
  onToggleDocument: (id: string, doc: keyof OnboardingCandidate['documents']) => void;
  onAddCandidate: (candidate: Omit<OnboardingCandidate, 'id' | 'appliedAt'>) => void;
}

export const HRManagementView: React.FC<HRManagementViewProps> = ({
  candidates,
  employees,
  shifts,
  currentLanguage,
  onUpdateCandidateStage,
  onToggleDocument,
  onAddCandidate,
}) => {
  const t = translations[currentLanguage];
  const [activeTab, setActiveTab] = useState<'hiring_platforms' | 'onboarding' | 'hiring' | 'interviews' | 'payroll'>('hiring_platforms');

  // Tax & Paycheck Modal State
  const [isPaycheckModalOpen, setIsPaycheckModalOpen] = useState(false);
  const [isTaxBracketsModalOpen, setIsTaxBracketsModalOpen] = useState(false);
  const [selectedCalcEmployee, setSelectedCalcEmployee] = useState<Employee | null>(null);
  const [activeStateCode, setActiveStateCode] = useState<string>('CA');

  // AI Interview Prep modal state
  const [selectedCandidateForAI, setSelectedCandidateForAI] = useState<OnboardingCandidate | null>(null);
  const [aiInterviewQuestions, setAiInterviewQuestions] = useState<string[]>([]);
  const [aiKeyTraits, setAiKeyTraits] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // New Candidate Form
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candRole, setCandRole] = useState<RestaurantRole>('Server');
  const [candDept, setCandDept] = useState<Department>('Front of House');

  // Generate AI Interview Questions
  const handleGenerateAIInterviewQuestions = async (cand: OnboardingCandidate) => {
    setSelectedCandidateForAI(cand);
    setLoadingAI(true);

    try {
      const res = await authenticatedFetch('/api/ai/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: cand.role,
          department: cand.department,
          experienceLevel: 'Intermediate',
        }),
      });
      const data = await res.json();
      setAiInterviewQuestions(data.questions || []);
      setAiKeyTraits(data.keyTraits || []);
    } catch (err) {
      console.error(err);
      setAiInterviewQuestions([
        `How do you handle a high volume rush in the ${cand.department} department?`,
        'Describe your approach to food safety and allergy communication.',
        'How do you manage teamwork when unexpected call-outs occur?',
      ]);
      setAiKeyTraits(['Punctuality', 'Hospitality Mindset', 'Calm Under Pressure']);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCandidate({
      name: candName,
      email: candEmail,
      phone: candPhone,
      role: candRole,
      department: candDept,
      stage: 'applied',
      documents: {
        i9Verified: false,
        foodHandlerCertified: false,
        directDeposit: false,
        uniformAssigned: false,
      },
    });
    setIsAddCandidateOpen(false);
    setCandName('');
    setCandEmail('');
    setCandPhone('');
  };

  // Payroll Calculations
  const payrollSummary = employees.map(emp => {
    const empShifts = shifts.filter(s => s.employeeId === emp.id);
    let totalHrs = 0;
    empShifts.forEach(s => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      totalHrs += (diff - s.breakMinutes) / 60;
    });

    const regularHours = Math.min(40, totalHrs);
    const overtimeHours = Math.max(0, totalHrs - 40);
    const regularPay = regularHours * emp.hourlyWage;
    const overtimePay = overtimeHours * (emp.hourlyWage * 1.5);
    const grossPay = regularPay + overtimePay;

    return {
      employee: emp,
      shiftCount: empShifts.length,
      regularHours,
      overtimeHours,
      totalHrs,
      regularPay,
      overtimePay,
      grossPay,
    };
  });

  const totalPayrollCost = payrollSummary.reduce((acc, p) => acc + p.grossPay, 0);
  const totalRegularHrs = payrollSummary.reduce((acc, p) => acc + p.regularHours, 0);
  const totalOvertimeHrs = payrollSummary.reduce((acc, p) => acc + p.overtimeHours, 0);

  const handleExportCSV = () => {
    const headers = 'Employee Name,Department,Role,Hourly Wage,Regular Hours,Overtime Hours,Total Hours,Gross Pay\n';
    const rows = payrollSummary.map(p =>
      `"${p.employee.name}","${p.employee.department}","${p.employee.role}",${p.employee.hourlyWage.toFixed(2)},${p.regularHours.toFixed(1)},${p.overtimeHours.toFixed(1)},${p.totalHrs.toFixed(1)},${p.grossPay.toFixed(2)}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShiftForce_Restaurant_Payroll_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Admin HR &amp; Payroll Intelligence</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-200">
              Admin / GM Confidential
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete management of Onboarding checklists, Hiring ATS, Interview scorecards, and Overtime Payroll estimation.
          </p>
        </div>

        {/* 5 Tabs Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('hiring_platforms')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'hiring_platforms' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Job Platforms (LinkedIn, Indeed, Craigslist, Meta)</span>
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'onboarding' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.onboarding}
          </button>
          <button
            onClick={() => setActiveTab('hiring')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'hiring' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.hiring}
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'interviews' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.interviews}
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'payroll' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.payroll}
          </button>
        </div>
      </div>

      {/* 0. Multi-Platform Hiring Hub View */}
      {activeTab === 'hiring_platforms' && (
        <HiringPlatformHub
          candidates={candidates}
          onAddCandidate={onAddCandidate}
          onUpdateCandidateStage={onUpdateCandidateStage}
          onSelectCandidateForAI={handleGenerateAIInterviewQuestions}
          currentLanguage={currentLanguage}
        />
      )}

      {/* 1. Onboarding Checklist View */}
      {activeTab === 'onboarding' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>New Hire Onboarding &amp; Document Verification</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">I-9, Food Handler, Direct Deposit, Uniform</span>
          </div>

          <div className="divide-y divide-slate-100">
            {candidates.filter(c => c.stage === 'onboarding' || c.stage === 'offer_sent').map((cand) => (
              <div key={cand.id} className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{cand.name}</span>
                    <span className="text-xs text-sky-700 font-semibold ml-2">
                      {cand.role} ({cand.department})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    {cand.stage.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cand.documents.i9Verified}
                      onChange={() => onToggleDocument(cand.id, 'i9Verified')}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-800">I-9 Work Auth</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cand.documents.foodHandlerCertified}
                      onChange={() => onToggleDocument(cand.id, 'foodHandlerCertified')}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-800">Food Handler Card</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cand.documents.directDeposit}
                      onChange={() => onToggleDocument(cand.id, 'directDeposit')}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-800">Direct Deposit</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cand.documents.uniformAssigned}
                      onChange={() => onToggleDocument(cand.id, 'uniformAssigned')}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="font-medium text-slate-800">Uniform Assigned</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Hiring Pipeline ATS View */}
      {activeTab === 'hiring' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" />
                <span>Restaurant Recruitment &amp; Hiring Pipeline</span>
              </h3>
            </div>
            <button
              onClick={() => setIsAddCandidateOpen(true)}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Candidate</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            {(['applied', 'interview_scheduled', 'offer_sent', 'onboarding'] as const).map((stage) => {
              const stageCandidates = candidates.filter(c => c.stage === stage);
              return (
                <div key={stage} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
                  <div className="font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>{stage.replace('_', ' ')}</span>
                    <span className="bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full text-[10px]">
                      {stageCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {stageCandidates.map(cand => (
                      <div key={cand.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                        <div className="font-bold text-slate-900">{cand.name}</div>
                        <div className="text-[11px] text-sky-700 font-semibold">{cand.role}</div>
                        <div className="text-[10px] text-slate-500">{cand.phone}</div>

                        <div className="pt-1 flex items-center justify-between">
                          <button
                            onClick={() => handleGenerateAIInterviewQuestions(cand)}
                            className="text-[10px] text-sky-600 hover:underline flex items-center gap-0.5"
                          >
                            <Sparkles className="w-3 h-3" /> AI Interview Prep
                          </button>
                        </div>
                      </div>
                    ))}
                    {stageCandidates.length === 0 && (
                      <div className="text-center py-4 text-slate-400 text-[11px]">No candidates</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Interview Scheduler & AI Question Generator */}
      {activeTab === 'interviews' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Interview Schedule &amp; Scorecards</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {candidates.map((cand) => (
              <div key={cand.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{cand.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md">
                      {cand.role} ({cand.department})
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    <strong>Scheduled:</strong> {cand.interviewDate || 'To be scheduled'} {cand.interviewTime || ''}
                  </div>
                  {cand.interviewNotes && (
                    <div className="text-xs text-slate-500 italic mt-0.5">"{cand.interviewNotes}"</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${star <= (cand.interviewScore || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleGenerateAIInterviewQuestions(cand)}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>AI Interview Questions</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Interview Questions Drawer / Modal */}
          {selectedCandidateForAI && (
            <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 space-y-3 mt-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-600" />
                  <h4 className="font-bold text-sm text-sky-950">
                    Gemini AI Tailored Interview Guide for {selectedCandidateForAI.name} ({selectedCandidateForAI.role})
                  </h4>
                </div>
                <button onClick={() => setSelectedCandidateForAI(null)} className="text-xs font-bold text-slate-500">✕ Close</button>
              </div>

              {loadingAI ? (
                <div className="py-4 text-xs text-slate-500">Generating targeted restaurant questions...</div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700">Target Competencies &amp; Traits:</span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {aiKeyTraits.map((trait, i) => (
                        <span key={i} className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md font-semibold text-[11px]">
                          ✓ {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700">Recommended Questions:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                      {aiInterviewQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Payroll & Labor Intelligence View */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Weekly Payroll, State Tax & Overtime Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500">
                Calculates regular hours, overtime (1.5x pay above 40 hrs/wk), and exact 50-state tax withholdings.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedCalcEmployee(null);
                  setIsPaycheckModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculate Employee Paycheck</span>
              </button>
              <button
                onClick={() => setIsTaxBracketsModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>50-State Tax Brackets</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 3 Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-emerald-700 uppercase">Gross Estimated Payroll</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ${totalPayrollCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-sky-700 uppercase">Regular Scheduled Hours</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalRegularHrs.toFixed(1)} hrs</div>
            </div>
            <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4">
              <div className="text-xs font-semibold text-amber-700 uppercase">Overtime Hours (&gt;40h)</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalOvertimeHrs.toFixed(1)} hrs</div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Hourly Rate</th>
                  <th className="px-4 py-3">Regular Hrs</th>
                  <th className="px-4 py-3">Overtime Hrs</th>
                  <th className="px-4 py-3">Total Hrs</th>
                  <th className="px-4 py-3 text-right">Gross Wages</th>
                  <th className="px-4 py-3 text-center">Calculate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollSummary.map((p) => (
                  <tr key={p.employee.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{p.employee.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.employee.department}</td>
                    <td className="px-4 py-3 font-mono">${p.employee.hourlyWage.toFixed(2)}/hr</td>
                    <td className="px-4 py-3 font-mono">{p.regularHours.toFixed(1)}h</td>
                    <td className="px-4 py-3 font-mono">
                      {p.overtimeHours > 0 ? (
                        <span className="text-amber-600 font-bold">{p.overtimeHours.toFixed(1)}h OT</span>
                      ) : (
                        '0h'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{p.totalHrs.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ${p.grossPay.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedCalcEmployee(p.employee);
                          setIsPaycheckModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Calculate Paycheck
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paycheck Calculator Modal */}
      <EmployeePaycheckCalculatorModal
        isOpen={isPaycheckModalOpen}
        onClose={() => setIsPaycheckModalOpen(false)}
        employee={selectedCalcEmployee}
        employees={employees}
        shifts={shifts}
        defaultStateCode={activeStateCode}
        onSelectState={(code) => setActiveStateCode(code)}
      />

      {/* State Tax Brackets Explorer Modal */}
      <StateTaxBracketsExplorerModal
        isOpen={isTaxBracketsModalOpen}
        onClose={() => setIsTaxBracketsModalOpen(false)}
        selectedStateCode={activeStateCode}
        onSelectState={(code) => setActiveStateCode(code)}
      />

      {/* Add Candidate Modal */}
      {isAddCandidateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Add New Job Applicant</h3>
              <button onClick={() => setIsAddCandidateOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  placeholder="e.g. Julian Montgomery"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number:</label>
                  <input
                    type="tel"
                    required
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email:</label>
                  <input
                    type="email"
                    required
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    placeholder="julian@example.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department:</label>
                  <select
                    value={candDept}
                    onChange={(e) => setCandDept(e.target.value as Department)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Front of House">Front of House</option>
                    <option value="Back of House">Back of House</option>
                    <option value="Bar & Beverage">Bar & Beverage</option>
                    <option value="Kitchen Prep & Dish">Kitchen Prep & Dish</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role / Position:</label>
                  <select
                    value={candRole}
                    onChange={(e) => setCandRole(e.target.value as RestaurantRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Server">Server</option>
                    <option value="Bartender">Bartender</option>
                    <option value="Line Cook">Line Cook</option>
                    <option value="Host / Hostess">Host / Hostess</option>
                    <option value="Prep Cook">Prep Cook</option>
                    <option value="Dishwasher">Dishwasher</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCandidateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};