import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calculator,
  DollarSign,
  Printer,
  Download,
  Building2,
  Calendar,
  User,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { Employee, Shift, Department } from '../../types';
import {
  US_STATE_TAX_CONFIGS,
  FEDERAL_TAX_BRACKETS,
  FEDERAL_STANDARD_DEDUCTION,
  FICA_RATES,
  FilingStatus,
  PayFrequency,
  PaycheckCalculationInput,
  calculateEmployeePaycheck,
  StateTaxConfig
} from '../../data/taxBracketsData';

interface EmployeePaycheckCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  employees: Employee[];
  shifts: Shift[];
  defaultStateCode?: string;
  onSelectState?: (stateCode: string) => void;
}

export const EmployeePaycheckCalculatorModal: React.FC<EmployeePaycheckCalculatorModalProps> = ({
  isOpen,
  onClose,
  employee,
  employees,
  shifts,
  defaultStateCode = 'CA',
  onSelectState
}) => {
  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employee?.id || (employees[0]?.id || 'custom'));

  // Pay Parameters
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  const [stateCode, setStateCode] = useState<string>(defaultStateCode || 'CA');

  // Hours & Rates
  const [regularHours, setRegularHours] = useState<number>(75);
  const [overtimeHours, setOvertimeHours] = useState<number>(4.5);
  const [doubleTimeHours, setDoubleTimeHours] = useState<number>(0);
  const [hourlyWage, setHourlyWage] = useState<number>(employee?.hourlyWage || 22.50);

  // Tips & Additional Earnings
  const [creditCardTips, setCreditCardTips] = useState<number>(320);
  const [reportedCashTips, setReportedCashTips] = useState<number>(80);
  const [allocatedTips, setAllocatedTips] = useState<number>(0);
  const [bonusEarnings, setBonusEarnings] = useState<number>(0);

  // Pre-tax Deductions
  const [healthInsurance, setHealthInsurance] = useState<number>(65);
  const [retirement401k, setRetirement401k] = useState<number>(45);
  const [hsaFsa, setHsaFsa] = useState<number>(20);

  // Post-tax Deductions
  const [roth401k, setRoth401k] = useState<number>(0);
  const [uniformMeals, setUniformMeals] = useState<number>(15);
  const [w4ExtraWithholding, setW4ExtraWithholding] = useState<number>(0);

  // Local Tax
  const [enableLocalTax, setEnableLocalTax] = useState<boolean>(false);
  const [localTaxRate, setLocalTaxRate] = useState<number>(1.5);

  // Active View Mode
  const [activeTab, setActiveTab] = useState<'calculator' | 'paystub' | 'breakdown' | 'employer_cost'>('calculator');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize when employee prop or defaultStateCode changes
  useEffect(() => {
    if (isOpen) {
      if (employee) {
        handleEmployeeChange(employee.id);
      }
      if (defaultStateCode) {
        setStateCode(defaultStateCode);
      }
    }
  }, [isOpen, employee, defaultStateCode]);

  // Auto-fill when switching employee
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    if (empId === 'custom') return;

    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setHourlyWage(emp.hourlyWage);

      // Calculate shifts for this employee
      const empShifts = shifts.filter(s => s.employeeId === emp.id);
      let totalMins = 0;
      empShifts.forEach(s => {
        const [startH, startM] = s.startTime.split(':').map(Number);
        const [endH, endM] = s.endTime.split(':').map(Number);
        let mins = (endH * 60 + endM) - (startH * 60 + startM);
        if (mins < 0) mins += 24 * 60;
        mins -= (s.breakMinutes || 0);
        totalMins += Math.max(0, mins);
      });
      const hrs = totalMins > 0 ? (totalMins / 60) : (emp.maxHoursPerWeek || 38);
      // For bi-weekly: 2 weeks
      const biWeeklyHours = Number((hrs * 2).toFixed(1));
      const reg = Math.min(80, biWeeklyHours);
      const ot = Math.max(0, Number((biWeeklyHours - 80).toFixed(1)));
      setRegularHours(reg);
      setOvertimeHours(ot);

      // Default tips based on department
      if (emp.department === 'Front of House' || emp.department === 'Bar & Beverage') {
        setCreditCardTips(Math.round(biWeeklyHours * 4.5));
        setReportedCashTips(Math.round(biWeeklyHours * 1.2));
      } else {
        setCreditCardTips(0);
        setReportedCashTips(0);
      }
    }
  };

  const selectedEmployeeObj = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || {
      id: 'EMP-CUSTOM',
      name: 'Custom Employee Simulation',
      role: 'Bartender & Server',
      department: 'Front of House',
      hourlyWage: hourlyWage,
      adpEmployeeId: 'ADP-984210',
    };
  }, [selectedEmpId, employees, hourlyWage]);

  // Execute Calculation
  const calculation = useMemo(() => {
    const input: PaycheckCalculationInput = {
      regularHours,
      overtimeHours,
      doubleTimeHours,
      hourlyWage,
      reportedCashTips,
      creditCardTips,
      allocatedTips,
      bonusEarnings,
      payFrequency,
      filingStatus,
      stateCode,
      w4ExtraWithholdingPerPeriod: w4ExtraWithholding,
      healthInsurancePreTax: healthInsurance,
      retirement401kPreTax: retirement401k,
      hsaFsaPreTax: hsaFsa,
      roth401kPostTax: roth401k,
      uniformMealsPostTax: uniformMeals,
      enableLocalTax,
      localTaxCustomRate: enableLocalTax ? localTaxRate / 100 : 0,
    };
    return calculateEmployeePaycheck(input);
  }, [
    regularHours,
    overtimeHours,
    doubleTimeHours,
    hourlyWage,
    reportedCashTips,
    creditCardTips,
    allocatedTips,
    bonusEarnings,
    payFrequency,
    filingStatus,
    stateCode,
    w4ExtraWithholding,
    healthInsurance,
    retirement401k,
    hsaFsa,
    roth401k,
    uniformMeals,
    enableLocalTax,
    localTaxRate,
  ]);

  if (!isOpen) return null;

  const currentStateConfig = US_STATE_TAX_CONFIGS[stateCode] || US_STATE_TAX_CONFIGS['CA'];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent = `data:text/csv;charset=utf-8,` +
      `Employee Name,Employee ID,State,Pay Frequency,Filing Status,Hourly Wage,Regular Hours,Overtime Hours,Regular Gross,Overtime Gross,Tips,Total Gross,Federal Tax,Social Security,Medicare,State Tax (${stateCode}),SDI/PFL,Total Taxes,Pre-Tax Deductions,Post-Tax Deductions,Net Take-Home,Employer Cost,Section 45B Tip Credit\n` +
      `"${selectedEmployeeObj.name}","${(selectedEmployeeObj as any).adpEmployeeId || selectedEmployeeObj.id}","${stateCode}","${payFrequency}","${filingStatus}",${hourlyWage},${regularHours},${overtimeHours},${calculation.regularEarnings},${calculation.overtimeEarnings},${calculation.totalTips},${calculation.grossPay},${calculation.federalIncomeTax},${calculation.socialSecurityTax},${calculation.medicareTax},${calculation.stateIncomeTax},${calculation.stateDisabilityInsurance + calculation.statePaidFamilyLeave},${calculation.totalTaxesWithheld},${calculation.totalPreTaxDeductions},${calculation.totalPostTaxDeductions},${calculation.netPay},${calculation.totalEmployerCost},${calculation.ficaTipCreditEst}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShiftForce_Paycheck_${selectedEmployeeObj.name.replace(/\s+/g, '_')}_${stateCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('Paycheck ledger CSV exported successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-auto">

        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-2xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">
                  Employee Paycheck & State Tax Calculator
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  50-State Certified Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                IRS 2026 Federal brackets, FICA (OASDI/Medicare), state withholding tax, and tip pool calculation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Paystub</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-slate-100/90 px-6 py-2 border-b border-slate-200/80 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1">
            {[
              { id: 'calculator', label: 'Interactive Paycheck Builder', icon: Sliders },
              { id: 'paystub', label: 'Official Paystub (Printable)', icon: FileCheckIcon },
              { id: 'breakdown', label: 'Detailed Tax Bracket Breakdown', icon: Layers },
              { id: 'employer_cost', label: 'Employer Burden & 45B Tip Credit', icon: Briefcase },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-slate-500">State:</span>
            <select
              value={stateCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setStateCode(newCode);
                if (onSelectState) onSelectState(newCode);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              {Object.values(US_STATE_TAX_CONFIGS).map(s => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name} ({s.type === 'none' ? 'No Income Tax' : s.type === 'flat' ? `Flat ${((s.flatRate || 0) * 100).toFixed(2)}%` : 'Graduated Brackets'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {toastMessage && (
          <div className="mx-6 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">Dismiss</button>
          </div>
        )}

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Top Quick Summary KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-md">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Earnings</div>
              <div className="text-2xl font-black text-white mt-0.5">
                ${calculation.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                {regularHours + overtimeHours} hrs @ ${hourlyWage}/hr + tips
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Taxes Withheld</div>
              <div className="text-2xl font-black text-rose-400 mt-0.5">
                -${calculation.totalTaxesWithheld.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Effective: {calculation.effectiveTaxRatePercent}% (Fed + State + FICA)
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pre/Post Deductions</div>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                -${(calculation.totalPreTaxDeductions + calculation.totalPostTaxDeductions).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                401(k), Health, Meals & HSA
              </div>
            </div>

            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl p-2.5">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Net Take-Home Pay</div>
              <div className="text-2xl font-black text-emerald-300 mt-0.5">
                ${calculation.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-200 font-semibold mt-0.5">
                {calculation.netPayTakeHomePercent}% of Gross ({payFrequency})
              </div>
            </div>
          </div>

          {/* TAB 1: INTERACTIVE CALCULATOR BUILDER */}
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-5">

                {/* 1. Employee & Frequency Selector */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      1. Employee Profile & Pay Period
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {currentStateConfig.name} ({currentStateConfig.code})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Employee</label>
                      <select
                        value={selectedEmpId}
                        onChange={(e) => handleEmployeeChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="custom">-- Custom Simulation --</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.name} ({e.role} - ${e.hourlyWage}/hr)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pay Frequency</label>
                      <select
                        value={payFrequency}
                        onChange={(e) => setPayFrequency(e.target.value as PayFrequency)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="weekly">Weekly (52 pay periods / yr)</option>
                        <option value="biweekly">Bi-Weekly (26 pay periods / yr)</option>
                        <option value="semimonthly">Semi-Monthly (24 pay periods / yr)</option>
                        <option value="monthly">Monthly (12 pay periods / yr)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tax Filing Status (W-4)</label>
                      <select
                        value={filingStatus}
                        onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="single">Single or Married Filing Separately</option>
                        <option value="married_joint">Married Filing Jointly</option>
                        <option value="head_of_household">Head of Household</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        State Withholding Tax Jurisdiction
                      </label>
                      <select
                        value={stateCode}
                        onChange={(e) => {
                          setStateCode(e.target.value);
                          if (onSelectState) onSelectState(e.target.value);
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                      >
                        {Object.values(US_STATE_TAX_CONFIGS).map(s => (
                          <option key={s.code} value={s.code}>
                            {s.name} ({s.code}) - {s.type === 'none' ? 'No State Tax' : s.type === 'flat' ? `Flat ${((s.flatRate || 0) * 100).toFixed(2)}%` : 'Graduated'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Wages, Hours & Overtime */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      2. Hourly Wage & Hours Worked
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      State Min Wage: ${currentStateConfig.minWage.toFixed(2)}/hr {currentStateConfig.tipCreditAllowed ? `(Tipped: $${currentStateConfig.tippedMinWage.toFixed(2)})` : '(No Tip Credit)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Base Wage ($/hr)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={hourlyWage}
                          onChange={(e) => setHourlyWage(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Regular Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={regularHours}
                        onChange={(e) => setRegularHours(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Overtime (1.5x)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700 focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Double Time (2.0x)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={doubleTimeHours}
                        onChange={(e) => setDoubleTimeHours(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-purple-700 focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Restaurant Tips & Bonuses */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      3. Restaurant Tips & Additional Pay
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Subject to FIT & FICA Withholding
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Credit Card Tips ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={creditCardTips}
                          onChange={(e) => setCreditCardTips(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reported Cash Tips ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={reportedCashTips}
                          onChange={(e) => setReportedCashTips(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-amber-700 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Allocated Tips ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={allocatedTips}
                          onChange={(e) => setAllocatedTips(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bonus / Commissions ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={bonusEarnings}
                          onChange={(e) => setBonusEarnings(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Pre-Tax & Post-Tax Deductions */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      4. Benefits, Pre-Tax Deductions & Post-Tax
                    </span>
                    <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                      Pre-tax lowers Federal & State tax bases
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Health & Dental (Pre-Tax)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={healthInsurance}
                          onChange={(e) => setHealthInsurance(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Traditional 401(k) (Pre-Tax)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={retirement401k}
                          onChange={(e) => setRetirement401k(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">HSA / FSA (Pre-Tax)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={hsaFsa}
                          onChange={(e) => setHsaFsa(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Roth 401(k) (Post-Tax)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={roth401k}
                          onChange={(e) => setRoth401k(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Uniform / Staff Meal (Post-Tax)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={uniformMeals}
                          onChange={(e) => setUniformMeals(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">W-4 Extra Withholding ($)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={w4ExtraWithholding}
                          onChange={(e) => setW4ExtraWithholding(parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Local City Tax Toggle */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="localTaxCheck"
                      checked={enableLocalTax}
                      onChange={(e) => setEnableLocalTax(e.target.checked)}
                      className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="localTaxCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Include Local / Municipal Income Tax (e.g. NYC, Philadelphia, Detroit, St. Louis)
                    </label>
                  </div>
                  {enableLocalTax && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-600">Rate:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={localTaxRate}
                        onChange={(e) => setLocalTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800 font-mono"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Live Calculated Paycheck Summary (5 cols) */}
              <div className="lg:col-span-5 space-y-4">

                {/* Main Take Home Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Paycheck Calculation Summary</h3>
                      <div className="text-[11px] text-slate-500">{payFrequency.toUpperCase()} Pay Period • {filingStatus.replace('_', ' ')}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                      {currentStateConfig.code} Withholding
                    </span>
                  </div>

                  {/* Gross Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Regular Wages ({regularHours}h @ ${hourlyWage})</span>
                      <span className="font-bold font-mono">${calculation.regularEarnings.toFixed(2)}</span>
                    </div>
                    {overtimeHours > 0 && (
                      <div className="flex justify-between text-rose-700 font-semibold">
                        <span>Overtime Wages ({overtimeHours}h @ ${(hourlyWage * 1.5).toFixed(2)})</span>
                        <span className="font-bold font-mono">+${calculation.overtimeEarnings.toFixed(2)}</span>
                      </div>
                    )}
                    {doubleTimeHours > 0 && (
                      <div className="flex justify-between text-purple-700 font-semibold">
                        <span>Double Time Wages ({doubleTimeHours}h @ ${(hourlyWage * 2).toFixed(2)})</span>
                        <span className="font-bold font-mono">+${calculation.doubleTimeEarnings.toFixed(2)}</span>
                      </div>
                    )}
                    {calculation.totalTips > 0 && (
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>Tips (Credit Card + Cash Reported)</span>
                        <span className="font-bold font-mono">+${calculation.totalTips.toFixed(2)}</span>
                      </div>
                    )}
                    {calculation.bonusesAndCommissions > 0 && (
                      <div className="flex justify-between text-slate-800">
                        <span>Bonuses / Commission</span>
                        <span className="font-bold font-mono">+${calculation.bonusesAndCommissions.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-100 text-sm">
                      <span>Total Gross Pay</span>
                      <span className="font-mono text-slate-900">${calculation.grossPay.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Pre-tax Deductions */}
                  {calculation.totalPreTaxDeductions > 0 && (
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1">Pre-Tax Deductions</div>
                      {calculation.preTaxBreakdown.healthInsurance > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Health & Dental</span>
                          <span className="font-mono">-${calculation.preTaxBreakdown.healthInsurance.toFixed(2)}</span>
                        </div>
                      )}
                      {calculation.preTaxBreakdown.retirement401k > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Traditional 401(k)</span>
                          <span className="font-mono">-${calculation.preTaxBreakdown.retirement401k.toFixed(2)}</span>
                        </div>
                      )}
                      {calculation.preTaxBreakdown.hsaFsa > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>HSA / Medical FSA</span>
                          <span className="font-mono">-${calculation.preTaxBreakdown.hsaFsa.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-slate-700 pt-1 border-t border-slate-200/60">
                        <span>Total Pre-Tax</span>
                        <span className="font-mono">-${calculation.totalPreTaxDeductions.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Taxes Withholding Breakdown */}
                  <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="font-bold text-rose-900 text-[11px] uppercase tracking-wider flex items-center justify-between mb-1">
                      <span>Taxes Withheld</span>
                      <span>Total: -${calculation.totalTaxesWithheld.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-700">
                      <span>Federal Income Tax (FIT)</span>
                      <span className="font-mono font-semibold text-rose-700">-${calculation.federalIncomeTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Social Security (FICA OASDI 6.2%)</span>
                      <span className="font-mono font-semibold text-rose-700">-${calculation.socialSecurityTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Medicare (FICA HI 1.45%)</span>
                      <span className="font-mono font-semibold text-rose-700">-${calculation.medicareTax.toFixed(2)}</span>
                    </div>

                    {/* State Income Tax */}
                    <div className="flex justify-between text-slate-700 font-semibold">
                      <span>
                        {currentStateConfig.name} Income Tax ({currentStateConfig.code} SIT)
                      </span>
                      <span className="font-mono font-bold text-rose-700">-${calculation.stateIncomeTax.toFixed(2)}</span>
                    </div>

                    {calculation.stateDisabilityInsurance > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{currentStateConfig.code} State Disability (SDI/TDI)</span>
                        <span className="font-mono font-semibold text-rose-700">-${calculation.stateDisabilityInsurance.toFixed(2)}</span>
                      </div>
                    )}

                    {calculation.statePaidFamilyLeave > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{currentStateConfig.code} Paid Family Leave (PFL)</span>
                        <span className="font-mono font-semibold text-rose-700">-${calculation.statePaidFamilyLeave.toFixed(2)}</span>
                      </div>
                    )}

                    {calculation.localIncomeTax > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Local / City Income Tax</span>
                        <span className="font-mono font-semibold text-rose-700">-${calculation.localIncomeTax.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Post-tax Deductions */}
                  {calculation.totalPostTaxDeductions > 0 && (
                    <div className="flex justify-between text-xs text-slate-600 px-1">
                      <span>Post-Tax Deductions (Roth, Uniforms, Meals)</span>
                      <span className="font-mono font-bold">-${calculation.totalPostTaxDeductions.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Final Net Pay Highlight */}
                  <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md space-y-1">
                    <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider">
                      <span>Net Direct Deposit Payout</span>
                      <span>Take-Home: {calculation.netPayTakeHomePercent}%</span>
                    </div>
                    <div className="text-3xl font-black tracking-tight">
                      ${calculation.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-emerald-100 flex items-center justify-between pt-1">
                      <span>Annualized Net Take-Home:</span>
                      <span className="font-bold font-mono">${calculation.annualizedNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr</span>
                    </div>
                  </div>

                  {/* State Labor Law Summary Snippet */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{currentStateConfig.name} Restaurant Labor Law Notes:</span>
                    </div>
                    <p className="leading-relaxed text-slate-600">
                      {currentStateConfig.laborNotes}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: OFFICIAL PRINTABLE PAYSTUB */}
          {activeTab === 'paystub' && (
            <div className="max-w-3xl mx-auto bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-md text-slate-800 font-sans print:p-0 print:border-none print:shadow-none space-y-6">

              {/* Paystub Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-emerald-700" />
                    <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      ShiftForce Restaurant Group, Inc.
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    104 Market Street, Suite 400 • {currentStateConfig.name}, {currentStateConfig.code} • EIN: XX-XXX9842
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-md">
                    Earnings Statement
                  </span>
                  <div className="text-xs text-slate-600 font-bold mt-1">
                    Pay Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Employee & Period Metadata Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Employee Name</div>
                  <div className="font-black text-slate-900 text-sm mt-0.5">{selectedEmployeeObj.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">ID: {(selectedEmployeeObj as any).adpEmployeeId || selectedEmployeeObj.id}</div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Job Role & Dept</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedEmployeeObj.role}</div>
                  <div className="text-[11px] text-slate-500">{selectedEmployeeObj.department}</div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Pay Period & Frequency</div>
                  <div className="font-bold text-slate-800 mt-0.5">{payFrequency.toUpperCase()}</div>
                  <div className="text-[11px] text-slate-500">26 Periods / Year</div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Tax Withholding State</div>
                  <div className="font-bold text-slate-800 mt-0.5">{currentStateConfig.name} ({currentStateConfig.code})</div>
                  <div className="text-[11px] text-slate-500">Filing: {filingStatus}</div>
                </div>
              </div>

              {/* Earnings Table */}
              <div>
                <div className="font-black text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Hours & Earnings Breakdown</span>
                  <span className="text-[11px] font-normal text-slate-500">Current Period</span>
                </div>
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Hours</th>
                      <th className="py-2 px-3 text-right">Current Total</th>
                      <th className="py-2 px-3 text-right">YTD Estimated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-2 px-3 font-sans font-semibold">Regular Wages</td>
                      <td className="py-2 px-3 text-right">${hourlyWage.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{regularHours.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right font-bold">${calculation.regularEarnings.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">${(calculation.regularEarnings * 16).toFixed(2)}</td>
                    </tr>
                    {overtimeHours > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-rose-800">Overtime (1.5x)</td>
                        <td className="py-2 px-3 text-right text-rose-800">${(hourlyWage * 1.5).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-rose-800">{overtimeHours.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right font-bold text-rose-800">${calculation.overtimeEarnings.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-500">${(calculation.overtimeEarnings * 16).toFixed(2)}</td>
                      </tr>
                    )}
                    {calculation.totalTips > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold text-amber-800">Tips (Credit Card & Cash)</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-800">${calculation.totalTips.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-500">${(calculation.totalTips * 16).toFixed(2)}</td>
                      </tr>
                    )}
                    {calculation.bonusesAndCommissions > 0 && (
                      <tr>
                        <td className="py-2 px-3 font-sans font-semibold">Bonus & Incentives</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right">-</td>
                        <td className="py-2 px-3 text-right font-bold">${calculation.bonusesAndCommissions.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-500">${(calculation.bonusesAndCommissions * 16).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold">
                      <td className="py-2.5 px-3 font-sans uppercase">Total Gross Pay</td>
                      <td className="py-2.5 px-3 text-right">-</td>
                      <td className="py-2.5 px-3 text-right font-black font-sans">{(regularHours + overtimeHours + doubleTimeHours).toFixed(1)} hrs</td>
                      <td className="py-2.5 px-3 text-right text-sm text-slate-900 font-black">${calculation.grossPay.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700">${(calculation.grossPay * 16).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions & Taxes 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Tax Withholdings */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-black text-[11px] text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex justify-between">
                    <span>Tax Withholdings</span>
                    <span className="font-mono">Current / YTD</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Federal Income Tax (FIT)</span>
                      <span className="font-mono font-semibold">-${calculation.federalIncomeTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Social Security (FICA 6.2%)</span>
                      <span className="font-mono font-semibold">-${calculation.socialSecurityTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Medicare (FICA 1.45%)</span>
                      <span className="font-mono font-semibold">-${calculation.medicareTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 font-bold">
                      <span>{currentStateConfig.code} State Withholding Tax</span>
                      <span className="font-mono">-${calculation.stateIncomeTax.toFixed(2)}</span>
                    </div>
                    {calculation.stateDisabilityInsurance > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{currentStateConfig.code} State Disability (SDI)</span>
                        <span className="font-mono font-semibold">-${calculation.stateDisabilityInsurance.toFixed(2)}</span>
                      </div>
                    )}
                    {calculation.statePaidFamilyLeave > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>{currentStateConfig.code} Paid Family Leave (PFL)</span>
                        <span className="font-mono font-semibold">-${calculation.statePaidFamilyLeave.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                      <span>Total Taxes</span>
                      <span className="font-mono font-black text-rose-700">-${calculation.totalTaxesWithheld.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Pre-Tax & Post-Tax Deductions */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-black text-[11px] text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-100 flex justify-between">
                    <span>Benefits & Deductions</span>
                    <span className="font-mono">Amount</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {calculation.preTaxBreakdown.healthInsurance > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Section 125 Health & Dental</span>
                        <span className="font-mono font-semibold">-${calculation.preTaxBreakdown.healthInsurance.toFixed(2)}</span>
                      </div>
                    )}
                    {calculation.preTaxBreakdown.retirement401k > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Traditional 401(k) Contribution</span>
                        <span className="font-mono font-semibold">-${calculation.preTaxBreakdown.retirement401k.toFixed(2)}</span>
                      </div>
                    )}
                    {calculation.preTaxBreakdown.hsaFsa > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Health Savings Account (HSA)</span>
                        <span className="font-mono font-semibold">-${calculation.preTaxBreakdown.hsaFsa.toFixed(2)}</span>
                      </div>
                    )}
                    {calculation.postTaxBreakdown.uniformMeals > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>Uniform & Shift Meal (Post-Tax)</span>
                        <span className="font-mono font-semibold">-${calculation.postTaxBreakdown.uniformMeals.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                      <span>Total Deductions</span>
                      <span className="font-mono font-black text-amber-700">
                        -${(calculation.totalPreTaxDeductions + calculation.totalPostTaxDeductions).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Paystub Footer: Direct Deposit Voucher Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Direct Deposit Distribution Voucher
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    ACH Routing: *****4492 • Account: *******8821 • Chase Bank NA
                  </div>
                </div>

                <div className="text-right sm:text-right w-full sm:w-auto">
                  <div className="text-xs text-slate-400 font-semibold">Net Pay Distribution</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    ${calculation.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: DETAILED TAX BRACKET BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <div className="space-y-6">

              {/* Federal Tax Brackets Table */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>IRS 2026 Federal Income Tax Brackets ({filingStatus.toUpperCase()})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Federal Standard Deduction: ${FEDERAL_STANDARD_DEDUCTION[filingStatus].toLocaleString()}/yr • Annual Taxable Wage: ${Math.round(calculation.federalTaxableWages * calculation.periodsPerYear).toLocaleString()}/yr
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                    Federal FIT: ${calculation.federalIncomeTax.toFixed(2)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Marginal Bracket</th>
                        <th className="py-2.5 px-3">Annual Threshold ({filingStatus})</th>
                        <th className="py-2.5 px-3">Tax Rate</th>
                        <th className="py-2.5 px-3 text-right">Tax in this Bracket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {FEDERAL_TAX_BRACKETS[filingStatus].map((b, idx, arr) => {
                        const annualTaxable = Math.max(0, (calculation.federalTaxableWages * calculation.periodsPerYear) - FEDERAL_STANDARD_DEDUCTION[filingStatus]);
                        const nextThreshold = arr[idx + 1]?.threshold;
                        const isApplicable = annualTaxable > b.threshold;
                        const taxableInTier = isApplicable
                          ? (nextThreshold ? Math.min(annualTaxable, nextThreshold) - b.threshold : annualTaxable - b.threshold)
                          : 0;
                        const taxInTier = taxableInTier * b.rate;

                        return (
                          <tr key={idx} className={isApplicable ? 'bg-emerald-50/50 font-semibold' : ''}>
                            <td className="py-2.5 px-3 font-sans">Tier {idx + 1}</td>
                            <td className="py-2.5 px-3">${b.threshold.toLocaleString()}{nextThreshold ? ` - $${nextThreshold.toLocaleString()}` : '+'}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">{(b.rate * 100).toFixed(0)}%</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              ${(taxInTier / calculation.periodsPerYear).toFixed(2)} / period
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* State Tax Brackets Table */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>{currentStateConfig.name} ({currentStateConfig.code}) State Tax Structure</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tax Type: <strong className="capitalize">{currentStateConfig.type}</strong> • State Standard Deduction: ${currentStateConfig.standardDeduction[filingStatus].toLocaleString()}/yr
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold">
                    State SIT: ${calculation.stateIncomeTax.toFixed(2)}
                  </span>
                </div>

                {currentStateConfig.type === 'none' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      {currentStateConfig.name} has no state personal wage income tax! Employees retain 100% of their earnings after Federal and FICA withholdings.
                    </span>
                  </div>
                ) : currentStateConfig.type === 'flat' ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-indigo-600" />
                      <span>Flat Tax Rate: {((currentStateConfig.flatRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <p className="text-indigo-700">
                      All taxable wages above the state standard deduction (${currentStateConfig.standardDeduction[filingStatus].toLocaleString()}) are taxed at a constant rate of {((currentStateConfig.flatRate || 0) * 100).toFixed(2)}%.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">State Bracket</th>
                          <th className="py-2.5 px-3">Annual Income Threshold</th>
                          <th className="py-2.5 px-3">State Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {currentStateConfig.brackets?.[filingStatus]?.map((b, idx, arr) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 font-sans">Bracket {idx + 1}</td>
                            <td className="py-2.5 px-3">${b.threshold.toLocaleString()}{arr[idx + 1] ? ` - $${arr[idx + 1].threshold.toLocaleString()}` : '+'}</td>
                            <td className="py-2.5 px-3 font-bold text-indigo-700">{(b.rate * 100).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: EMPLOYER TRUE LABOR COST & SECTION 45B TIP CREDIT */}
          {activeTab === 'employer_cost' && (
            <div className="space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Employer Tax Burden */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-700" />
                      <span>Employer Payroll Tax Burden (True Labor Cost)</span>
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>Gross Employee Wages & Tips</span>
                      <span className="font-mono font-bold">${calculation.grossPay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Employer Social Security Match (6.2%)</span>
                      <span className="font-mono font-bold text-slate-900">+${calculation.employerSocialSecurity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Employer Medicare Match (1.45%)</span>
                      <span className="font-mono font-bold text-slate-900">+${calculation.employerMedicare.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Federal Unemployment (FUTA 0.6%)</span>
                      <span className="font-mono font-bold text-slate-900">+${calculation.employerFuta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>State Unemployment (SUTA ~2.7%)</span>
                      <span className="font-mono font-bold text-slate-900">+${calculation.employerSuta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold pt-2 border-t border-slate-100 text-sm">
                      <span>Total Employer Cost per Period</span>
                      <span className="font-mono text-emerald-700">${calculation.totalEmployerCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Section 45B FICA Tip Tax Credit */}
                <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 border border-amber-300/60 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      IRS Section 45B FICA Tip Credit Optimizer
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under IRC § 45B, restaurant operators are entitled to a dollar-for-dollar general business tax credit on the employer portion of FICA taxes paid on employee tips that exceed the federal minimum wage ($5.15 base).
                  </p>

                  <div className="bg-white/90 p-4 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Reported Employee Tips This Period</span>
                      <span className="font-mono font-bold text-amber-800">${calculation.totalTips.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Estimated 45B Tax Credit Generated</span>
                      <span className="font-mono font-extrabold text-emerald-700">${calculation.ficaTipCreditEst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-900 font-black pt-2 border-t border-amber-100">
                      <span>Annualized Restaurant Tax Credit</span>
                      <span className="font-mono text-emerald-700">
                        ${(calculation.ficaTipCreditEst * calculation.periodsPerYear).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Form W-4 (2026) & Circular E (Pub 15-T) standard algorithm applied.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Paystub</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

function FileCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
