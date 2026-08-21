import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Sliders,
  Save,
  Utensils,
  Wine,
  ChefHat,
  ShieldCheck,
  Clock,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import { Department, DepartmentBudgetsMap, Shift } from '../types';
import { INITIAL_DEPARTMENT_BUDGETS } from '../data/mockData';

interface DepartmentBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentBudgets: DepartmentBudgetsMap;
  onSaveBudgets: (newBudgets: DepartmentBudgetsMap) => void;
  shifts: Shift[];
  weeklySalesForecast?: number;
}

const DEPT_METADATA: Record<Department, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  defaultShare: number; // percentage share of overall labor budget
  description: string;
}> = {
  'Front of House': {
    icon: Utensils,
    color: '#0284c7',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-800',
    defaultShare: 28,
    description: 'Servers, Hosts, Bussers, Food Runners & Cashiers',
  },
  'Back of House': {
    icon: ChefHat,
    color: '#e11d48',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-800',
    defaultShare: 31,
    description: 'Head Chef, Sous Chefs, Line Cooks & Grill Specialists',
  },
  'Bar & Beverage': {
    icon: Wine,
    color: '#7c3aed',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    defaultShare: 13,
    description: 'Lead Bartenders, Craft Mixologists & Barbacks',
  },
  'Kitchen Prep & Dish': {
    icon: Clock,
    color: '#d97706',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-800',
    defaultShare: 12,
    description: 'Morning Prep Cooks, Sanitation & Dishwashing Pit',
  },
  'Management': {
    icon: ShieldCheck,
    color: '#059669',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-800',
    defaultShare: 16,
    description: 'General Manager, Assistant GM & Shift Supervisors',
  },
};

const DEPARTMENTS: Department[] = [
  'Front of House',
  'Back of House',
  'Bar & Beverage',
  'Kitchen Prep & Dish',
  'Management',
];

export const DepartmentBudgetModal: React.FC<DepartmentBudgetModalProps> = ({
  isOpen,
  onClose,
  departmentBudgets,
  onSaveBudgets,
  shifts,
  weeklySalesForecast = 38500,
}) => {
  // Local state for editing budgets
  const [budgets, setBudgets] = useState<DepartmentBudgetsMap>(departmentBudgets);
  const [targetLaborPct, setTargetLaborPct] = useState<number>(32); // 32% default restaurant target
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync state if modal reopens with new props
  React.useEffect(() => {
    if (isOpen) {
      setBudgets(departmentBudgets);
      setSaveSuccessNotice(false);
    }
  }, [isOpen, departmentBudgets]);

  if (!isOpen) return null;

  // Calculate current scheduled costs per department
  const scheduledCostsByDept: Record<Department, { cost: number; hours: number; shiftCount: number }> = {
    'Front of House': { cost: 0, hours: 0, shiftCount: 0 },
    'Back of House': { cost: 0, hours: 0, shiftCount: 0 },
    'Bar & Beverage': { cost: 0, hours: 0, shiftCount: 0 },
    'Kitchen Prep & Dish': { cost: 0, hours: 0, shiftCount: 0 },
    'Management': { cost: 0, hours: 0, shiftCount: 0 },
  };

  shifts.forEach((s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    const hrs = Math.max(0, (diff - s.breakMinutes) / 60);
    const cost = hrs * s.hourlyWage;

    if (scheduledCostsByDept[s.department]) {
      scheduledCostsByDept[s.department].cost += cost;
      scheduledCostsByDept[s.department].hours += hrs;
      scheduledCostsByDept[s.department].shiftCount += 1;
    }
  });

  // Calculate totals
  const totalBudget = Object.values(budgets).reduce<number>((acc, val) => acc + (Number(val) || 0), 0);
  const totalScheduledCost = Object.values(scheduledCostsByDept).reduce<number>((acc, d) => acc + (Number(d.cost) || 0), 0);
  const totalScheduledHours = Object.values(scheduledCostsByDept).reduce<number>((acc, d) => acc + (Number(d.hours) || 0), 0);
  const totalBudgetRemaining = totalBudget - totalScheduledCost;
  const overallLaborPctOfSales = weeklySalesForecast > 0 ? (totalBudget / weeklySalesForecast) * 100 : 0;
  const scheduledLaborPctOfSales = weeklySalesForecast > 0 ? (totalScheduledCost / weeklySalesForecast) * 100 : 0;

  const handleBudgetChange = (dept: Department, value: string) => {
    const num = parseFloat(value);
    setBudgets((prev) => ({
      ...prev,
      [dept]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleAdjustBudget = (dept: Department, delta: number) => {
    setBudgets((prev) => ({
      ...prev,
      [dept]: Math.max(0, Math.round((prev[dept] || 0) + delta)),
    }));
  };

  // Quick Preset: Auto-distribute target labor % of sales forecast
  const handleApplyLaborTargetPreset = (pct: number) => {
    setTargetLaborPct(pct);
    const totalTargetBudget = weeklySalesForecast * (pct / 100);
    const newBudgets: DepartmentBudgetsMap = { ...budgets };

    DEPARTMENTS.forEach((dept) => {
      const share = DEPT_METADATA[dept].defaultShare / 100;
      newBudgets[dept] = Math.round((totalTargetBudget * share) / 50) * 50; // Round to nearest $50
    });

    setBudgets(newBudgets);
  };

  // Quick Preset: Equal Split
  const handleEqualSplit = () => {
    const equalShare = Math.round(totalBudget / DEPARTMENTS.length / 50) * 50;
    const newBudgets: DepartmentBudgetsMap = {
      'Front of House': equalShare,
      'Back of House': equalShare,
      'Bar & Beverage': equalShare,
      'Kitchen Prep & Dish': equalShare,
      'Management': equalShare,
    };
    setBudgets(newBudgets);
  };

  // Quick Preset: Reset to initial defaults
  const handleResetToDefaults = () => {
    setBudgets(INITIAL_DEPARTMENT_BUDGETS);
  };

  // Save budgets
  const handleSave = () => {
    onSaveBudgets(budgets);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                Department Weekly Labor Budget Manager
              </h3>
              <p className="text-xs text-sky-100">
                Configure weekly labor expenditure thresholds to track live 'Budget Remaining' on the schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* Top High-Level Budget & Revenue Intelligence Bar */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-4 text-white shadow-md border border-slate-700/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-x divide-slate-700/60">

              {/* Total Weekly Budget */}
              <div className="px-2">
                <div className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
                  Total Weekly Budget
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  ${totalBudget.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-medium">
                  {overallLaborPctOfSales.toFixed(1)}% of ${weeklySalesForecast.toLocaleString()} sales
                </div>
              </div>

              {/* Scheduled Labor Cost */}
              <div className="px-2">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Current Scheduled
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  ${totalScheduledCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  {totalScheduledHours.toFixed(1)} scheduled hrs
                </div>
              </div>

              {/* Real-time Budget Remaining */}
              <div className="px-2">
                <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                  Live Budget Remaining
                </div>
                <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
                  totalBudgetRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {totalBudgetRemaining >= 0 ? '+' : '-'}${Math.abs(totalBudgetRemaining).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className={`text-[10px] font-bold mt-0.5 ${
                  totalBudgetRemaining >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {totalBudget > 0 ? ((totalBudgetRemaining / totalBudget) * 100).toFixed(1) : 0}% {totalBudgetRemaining >= 0 ? 'available' : 'OVER BUDGET'}
                </div>
              </div>

              {/* Target Labor Cost Ratio */}
              <div className="px-2">
                <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                  Labor % Ratio
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  {scheduledLaborPctOfSales.toFixed(1)}%
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Target: &le; 32.0%
                </div>
              </div>

            </div>
          </div>

          {/* Quick Preset Allocators */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-xs text-slate-800">
                  Quick Budget Calculators &amp; Proportional Allocators
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Based on ${weeklySalesForecast.toLocaleString()} projected revenue
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-600 font-semibold mr-1">Target Labor %:</span>
              {[28, 30, 32, 35].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyLaborTargetPreset(pct)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    targetLaborPct === pct
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct}% (${Math.round((weeklySalesForecast * (pct / 100))).toLocaleString()})
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={handleEqualSplit}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Equal 20% Split
              </button>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-auto"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Department Budget List with Real-time Cost & Remaining Preview */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-sky-600" />
                <span>Department Weekly Labor Allocations (5 Stations)</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Click +/- or type exact dollar budget
              </span>
            </div>

            <div className="space-y-3">
              {DEPARTMENTS.map((dept) => {
                const meta = DEPT_METADATA[dept];
                const Icon = meta.icon;
                const budgetVal = budgets[dept] || 0;
                const scheduled = scheduledCostsByDept[dept] || { cost: 0, hours: 0, shiftCount: 0 };
                const remaining = budgetVal - scheduled.cost;
                const percentUsed = budgetVal > 0 ? (scheduled.cost / budgetVal) * 100 : 100;
                const isOverBudget = remaining < 0;
                const isNearLimit = !isOverBudget && percentUsed >= 85;

                return (
                  <div
                    key={dept}
                    className={`p-4 rounded-xl border transition-all ${
                      isOverBudget
                        ? 'bg-rose-50/50 border-rose-200'
                        : isNearLimit
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-white border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                      {/* Left: Department Info & Icon */}
                      <div className="flex items-start gap-3 min-w-[200px]">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: meta.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{dept}</span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              ({meta.defaultShare}% norm)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {meta.description}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Scheduled Cost & Live Remaining Status */}
                      <div className="flex items-center gap-4 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/70">
                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Scheduled</div>
                          <div className="font-mono font-bold text-xs text-slate-900">
                            ${scheduled.cost.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            {scheduled.hours.toFixed(1)}h ({scheduled.shiftCount} shifts)
                          </div>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                        <div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase">Budget Remaining</div>
                          <div className={`font-mono font-black text-xs ${
                            isOverBudget ? 'text-rose-600' : isNearLimit ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {remaining >= 0 ? '+' : '-'}${Math.abs(remaining).toFixed(2)}
                          </div>
                          <div className="text-[9px] font-bold">
                            {isOverBudget ? (
                              <span className="text-rose-600 font-semibold">Exceeded</span>
                            ) : (
                              <span className="text-emerald-700">{((remaining / (budgetVal || 1)) * 100).toFixed(0)}% left</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Budget Input & Quick Adjust Buttons */}
                      <div className="flex items-center gap-1.5 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleAdjustBudget(dept, -100)}
                          className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Subtract $100"
                        >
                          -
                        </button>

                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={budgetVal}
                            onChange={(e) => handleBudgetChange(dept, e.target.value)}
                            className="w-28 pl-6 pr-2 py-1.5 font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-right"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdjustBudget(dept, 100)}
                          className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                          title="Add $100"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdjustBudget(dept, 500)}
                          className="px-2 h-7 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-mono font-semibold text-[10px] flex items-center justify-center transition-colors cursor-pointer"
                          title="Add $500"
                        >
                          +$500
                        </button>
                      </div>

                    </div>

                    {/* Progress Bar of Budget Used */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverBudget ? 'bg-rose-500' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, percentUsed)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-600 shrink-0 w-12 text-right">
                        {percentUsed.toFixed(0)}% used
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Helpful Labor Intelligence Guideline Note */}
          <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex items-start gap-2.5 text-slate-600">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Workqora Real-Time Labor Guard:</strong> Changes saved here will update the live
              <span className="text-sky-700 font-semibold"> 'Budget Remaining'</span> indicator on the Schedule Calendar View.
              As managers add, edit, or adjust shifts, the remaining allowance recalculates in real-time.
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {saveSuccessNotice && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Department Budgets Updated!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Apply Budgets</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};