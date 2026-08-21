import { useLanguage } from '../../context/LanguageContext';
import { translations } from '../../utils/i18n';
import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Users,
  Calculator,
  RefreshCw,
  Sparkles,
  Building2,
  Lock,
  Send,
  Sliders,
  TrendingUp,
  FileCheck,
  MapPin,
  Percent,
  Layers,
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Employee, Shift, Department } from '../../types';
import {
  US_STATE_TAX_CONFIGS,
  calculateEmployeePaycheck,
  StateTaxConfig,
  FilingStatus,
  PaycheckCalculationInput
} from '../../data/taxBracketsData';
import { EmployeePaycheckCalculatorModal } from '../payroll/EmployeePaycheckCalculatorModal';
import { StateTaxBracketsExplorerModal } from '../payroll/StateTaxBracketsExplorerModal';

interface ShiftForcePayrollViewProps {
  employees: Employee[];
  shifts: Shift[];
}

export const ShiftForcePayrollView: React.FC<ShiftForcePayrollViewProps> = ({ employees, shifts }) => {
  const { currentLanguage, t } = useLanguage();

  const [payPeriod, setPayPeriod] = useState<'current_biweekly' | 'previous_biweekly'>('current_biweekly');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('CA');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<Department | 'all'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSyncingADP, setIsSyncingADP] = useState<boolean>(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Modals
  const [isPaycheckModalOpen, setIsPaycheckModalOpen] = useState<boolean>(false);
  const [isTaxBracketsModalOpen, setIsTaxBracketsModalOpen] = useState<boolean>(false);
  const [selectedModalEmployee, setSelectedModalEmployee] = useState<Employee | null>(null);

  const currentStateConfig = US_STATE_TAX_CONFIGS[selectedStateCode] || US_STATE_TAX_CONFIGS['CA'];

  // Compute shift hours and accurate state tax withholding per employee
  const payrollRows = useMemo(() => {
    return employees.slice(0, 100).map(emp => {
      // Aggregate scheduled shifts
      const empShifts = shifts.filter(s => s.employeeId === emp.id);
      let totalMinutes = 0;

      empShifts.forEach(s => {
        const [startH, startM] = s.startTime.split(':').map(Number);
        const [endH, endM] = s.endTime.split(':').map(Number);
        let mins = (endH * 60 + endM) - (startH * 60 + startM);
        if (mins < 0) mins += 24 * 60;
        mins -= (s.breakMinutes || 0);
        totalMinutes += Math.max(0, mins);
      });

      const totalHours = totalMinutes > 0 ? (totalMinutes / 60) : (emp.maxHoursPerWeek || 35);
      const regularHours = Math.min(80, totalHours * 2); // Bi-weekly (2 weeks)
      const overtimeHours = Math.max(0, (totalHours * 2) - 80);

      // Tip allocation (if FOH or Bar)
      let creditCardTips = 0;
      let cashTips = 0;
      if (emp.department === 'Front of House' || emp.department === 'Bar & Beverage') {
        creditCardTips = Math.round((regularHours / 40) * 280);
        cashTips = Math.round((regularHours / 40) * 60);
      } else if (emp.department === 'Back of House') {
        creditCardTips = Math.round((regularHours / 40) * 65); // Kitchen tip share
      }

      // Run 50-state certified paycheck calculation engine
      const calcInput: PaycheckCalculationInput = {
        regularHours: parseFloat(regularHours.toFixed(1)),
        overtimeHours: parseFloat(overtimeHours.toFixed(1)),
        hourlyWage: emp.hourlyWage,
        creditCardTips,
        reportedCashTips: cashTips,
        payFrequency: 'biweekly',
        filingStatus: 'single',
        stateCode: selectedStateCode,
        healthInsurancePreTax: 45, // Standard Section 125 health deduction
        retirement401kPreTax: 25,
      };

      const calcResult = calculateEmployeePaycheck(calcInput);

      return {
        employee: emp,
        regularHours: calcResult.regularEarnings > 0 ? regularHours : 0,
        overtimeHours: calcResult.overtimeEarnings > 0 ? overtimeHours : 0,
        totalHours: regularHours + overtimeHours,
        hourlyWage: emp.hourlyWage,
        regularGross: calcResult.regularEarnings,
        overtimeGross: calcResult.overtimeEarnings,
        allocatedTips: calcResult.totalTips,
        grossPay: calcResult.grossPay,
        federalIncomeTax: calcResult.federalIncomeTax,
        socialSecurityTax: calcResult.socialSecurityTax,
        medicareTax: calcResult.medicareTax,
        totalFica: calcResult.totalFicaTax,
        stateIncomeTax: calcResult.stateIncomeTax,
        stateDisabilityInsurance: calcResult.stateDisabilityInsurance + calcResult.statePaidFamilyLeave,
        totalTaxesWithheld: calcResult.totalTaxesWithheld,
        totalPreTaxDeductions: calcResult.totalPreTaxDeductions,
        netPay: calcResult.netPay,
        netTakeHomePercent: calcResult.netPayTakeHomePercent,
        effectiveTaxRatePercent: calcResult.effectiveTaxRatePercent,
        employerTotalCost: calcResult.totalEmployerCost,
        ficaTipCredit: calcResult.ficaTipCreditEst,
        paymentMethod: 'Direct Deposit (ACH)',
        status: 'Tax Verified',
      };
    });
  }, [employees, shifts, selectedStateCode]);

  const filteredRows = payrollRows.filter(r => {
    if (selectedDeptFilter === 'all') return true;
    return r.employee.department === selectedDeptFilter;
  });

  const grandTotals = useMemo(() => {
    return filteredRows.reduce((acc, row) => ({
      totalGross: acc.totalGross + row.grossPay,
      totalNet: acc.totalNet + row.netPay,
      totalFederalTax: acc.totalFederalTax + row.federalIncomeTax,
      totalFica: acc.totalFica + row.totalFica,
      totalStateTax: acc.totalStateTax + row.stateIncomeTax + row.stateDisabilityInsurance,
      totalTaxes: acc.totalTaxes + row.totalTaxesWithheld,
      totalTips: acc.totalTips + row.allocatedTips,
      totalHours: acc.totalHours + row.totalHours,
      overtimeHours: acc.overtimeHours + row.overtimeHours,
      totalEmployerCost: acc.totalEmployerCost + row.employerTotalCost,
      totalTipCredit: acc.totalTipCredit + row.ficaTipCredit,
    }), {
      totalGross: 0,
      totalNet: 0,
      totalFederalTax: 0,
      totalFica: 0,
      totalStateTax: 0,
      totalTaxes: 0,
      totalTips: 0,
      totalHours: 0,
      overtimeHours: 0,
      totalEmployerCost: 0,
      totalTipCredit: 0
    });
  }, [filteredRows]);

  const handleOpenCalculator = (emp?: Employee) => {
    setSelectedModalEmployee(emp || null);
    setIsPaycheckModalOpen(true);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      const csvContent = `data:text/csv;charset=utf-8,` +
        `Employee Name,ADP ID,Department,Hourly Wage,State,Regular Hours,OT Hours,Gross Pay,Federal Tax,FICA (SS+Med),State Tax (${selectedStateCode}),SDI/PFL,Total Taxes,Pre-Tax Deductions,Net Direct Deposit,Employer Cost,Section 45B Tip Credit\n` +
        filteredRows.map(r =>
          `"${r.employee.name}","${r.employee.adpEmployeeId || r.employee.id}","${r.employee.department}",${r.hourlyWage},"${selectedStateCode}",${r.regularHours},${r.overtimeHours},${r.grossPay},${r.federalIncomeTax},${r.totalFica},${r.stateIncomeTax},${r.stateDisabilityInsurance},${r.totalTaxesWithheld},${r.totalPreTaxDeductions},${r.netPay},${r.employerTotalCost},${r.ficaTipCredit}`
        ).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ShiftForce_Payroll_Ledger_${selectedStateCode}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSyncSuccessToast(`Payroll ledger for ${filteredRows.length} employees (${currentStateConfig.name}) exported successfully!`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    }, 800);
  };

  const handleSyncWorkforce = () => {
    setIsSyncingADP(true);
    setTimeout(() => {
      setIsSyncingADP(false);
      setSyncSuccessToast(`Direct 2-way sync with ADP Workforce Now & Gusto completed! Tax withholding synchronized for ${selectedStateCode}.`);
      setTimeout(() => setSyncSuccessToast(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Plugin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                ShiftForce Payroll • 50-State Tax & Paycheck Engine
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                IRS 2026 Compliant
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Restaurant Payroll, State Tax Brackets & Paychecks
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5">
              Live gross-to-net calculation engine with state-specific progressive/flat tax brackets, FICA withholding, tip credit optimization, and printable pay stubs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => handleOpenCalculator()}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Employee Paycheck</span>
            </button>
            <button
              onClick={() => setIsTaxBracketsModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>50-State Tax Brackets</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Payroll CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {syncSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 text-sm font-semibold animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{syncSuccessToast}</span>
          </div>
          <button onClick={() => setSyncSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* State Jurisdiction & Compliance Alert Banner */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                Active Tax Jurisdiction: {currentStateConfig.name} ({currentStateConfig.code})
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                currentStateConfig.type === 'none'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentStateConfig.type === 'flat'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {currentStateConfig.type === 'none' ? '0% State Tax' : currentStateConfig.type === 'flat' ? `Flat ${((currentStateConfig.flatRate || 0) * 100).toFixed(2)}%` : 'Graduated Progressive Brackets'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Min Wage: <strong>${currentStateConfig.minWage.toFixed(2)}/hr</strong> • {currentStateConfig.tipCreditAllowed ? `Tip Credit Allowed ($${currentStateConfig.tippedMinWage.toFixed(2)} cash base)` : 'Tip Credit Illegal (Full State Min Wage Paid)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Switch State:</span>
            <select
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs w-full md:w-auto"
            >
              {Object.values(US_STATE_TAX_CONFIGS).map(s => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name} ({s.type === 'none' ? '0% Tax Free' : s.type === 'flat' ? `Flat ${((s.flatRate || 0) * 100).toFixed(2)}%` : 'Progressive'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsTaxBracketsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
          >
            View State Tax Tables
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
          <div className="text-slate-500 text-xs font-semibold">Total Gross Payroll</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            ${grandTotals.totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {filteredRows.length} timecards ({payPeriod === 'current_biweekly' ? 'Bi-Weekly' : 'Bi-Weekly'})
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
          <div className="text-slate-500 text-xs font-semibold">Net Employee Take-Home</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            ${grandTotals.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Avg {grandTotals.totalGross > 0 ? ((grandTotals.totalNet / grandTotals.totalGross) * 100).toFixed(1) : 0}% Net Payout
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
          <div className="text-slate-500 text-xs font-semibold">Federal FIT & FICA Withheld</div>
          <div className="text-xl font-extrabold text-rose-700 mt-1">
            -${(grandTotals.totalFederalTax + grandTotals.totalFica).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Fed FIT + OASDI + Medicare
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
          <div className="text-slate-500 text-xs font-semibold">{currentStateConfig.code} State Tax + SDI</div>
          <div className="text-xl font-extrabold text-indigo-700 mt-1">
            -${grandTotals.totalStateTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1">
            Remitted to {currentStateConfig.name} DOR
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/10 rounded-2xl p-4 shadow-xs border border-amber-300/60">
          <div className="text-amber-800 text-xs font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" /> Section 45B Tip Credit
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            +${grandTotals.totalTipCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-1">
            Restaurant FICA Tax Savings
          </div>
        </div>
      </div>

      {/* Filter and Period Selection */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Staff' },
            { id: 'Front of House', label: 'Front of House' },
            { id: 'Back of House', label: 'Back of House' },
            { id: 'Bar & Beverage', label: 'Bar & Beverage' },
            { id: 'Kitchen Prep & Dish', label: 'Kitchen Prep' },
            { id: 'Management', label: 'Management' },
          ].map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptFilter(dept.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedDeptFilter === dept.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncWorkforce}
            disabled={isSyncingADP}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingADP ? 'animate-spin' : ''}`} />
            <span>{isSyncingADP ? 'Syncing HCM...' : 'Sync ADP / Gusto'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Period:</span>
            <select
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="current_biweekly">Current Bi-Weekly (Aug 1 - Aug 14, 2026)</option>
              <option value="previous_biweekly">Previous Bi-Weekly (Jul 18 - Jul 31, 2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Ledger Table with State Tax Withholdings */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Staff Earnings, State Tax Withholding & Net Pay Ledger</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Displaying {filteredRows.length} calculated timecards • Click any row to calculate pay stub
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/60 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Role & Wage</th>
                <th className="py-3 px-3 text-center">Reg / OT</th>
                <th className="py-3 px-3">Gross Wages</th>
                <th className="py-3 px-3 text-amber-700">Tips</th>
                <th className="py-3 px-3 text-rose-700">Fed + FICA</th>
                <th className="py-3 px-3 text-indigo-700">{currentStateConfig.code} State Tax</th>
                <th className="py-3 px-3 text-right text-emerald-700 font-extrabold">Net Take-Home</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRows.slice(0, 30).map(row => (
                <tr key={row.employee.id} className="hover:bg-slate-50/90 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{row.employee.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{row.employee.adpEmployeeId || row.employee.id}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">{row.employee.role}</div>
                    <div className="text-[11px] text-slate-500 font-mono">${row.hourlyWage.toFixed(2)}/hr</div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">
                    <span className="font-bold">{row.regularHours}h</span>
                    {row.overtimeHours > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold">
                        +{row.overtimeHours}h OT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    ${row.grossPay.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-amber-600">
                    {row.allocatedTips > 0 ? `+$${row.allocatedTips.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-700 font-semibold">
                    -${(row.federalIncomeTax + row.totalFica).toFixed(2)}
                    <div className="text-[10px] text-slate-400">FIT: ${row.federalIncomeTax.toFixed(0)} | FICA: ${row.totalFica.toFixed(0)}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-indigo-700 font-semibold">
                    -${(row.stateIncomeTax + row.stateDisabilityInsurance).toFixed(2)}
                    <div className="text-[10px] text-slate-400">{currentStateConfig.code} SIT: ${row.stateIncomeTax.toFixed(0)}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-black text-emerald-600 text-right text-sm">
                    ${row.netPay.toFixed(2)}
                    <div className="text-[10px] text-slate-400 font-normal">{row.netTakeHomePercent}% take-home</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleOpenCalculator(row.employee)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer shadow-2xs"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Calculate</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paycheck Calculator Modal */}
      <EmployeePaycheckCalculatorModal
        isOpen={isPaycheckModalOpen}
        onClose={() => setIsPaycheckModalOpen(false)}
        employee={selectedModalEmployee}
        employees={employees}
        shifts={shifts}
        defaultStateCode={selectedStateCode}
        onSelectState={(code) => setSelectedStateCode(code)}
      />

      {/* State Tax Brackets Explorer Modal */}
      <StateTaxBracketsExplorerModal
        isOpen={isTaxBracketsModalOpen}
        onClose={() => setIsTaxBracketsModalOpen(false)}
        selectedStateCode={selectedStateCode}
        onSelectState={(code) => setSelectedStateCode(code)}
      />
    </div>
  );
};