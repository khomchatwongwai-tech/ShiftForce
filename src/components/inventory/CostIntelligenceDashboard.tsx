import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { CountPeriodType } from '../../types/inventory';
import { WasteTrendsSummaryCard } from './WasteTrendsSummaryCard';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Percent,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Wine,
  Utensils,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line
} from 'recharts';

export const CostIntelligenceDashboard: React.FC = () => {
  const { financialIntelligence, selectedPeriod, setSelectedPeriod } = useInventory();
  const fin = financialIntelligence;

  const periods: { key: CountPeriodType; label: string }[] = [
    { key: 'day', label: 'Daily Close' },
    { key: 'week', label: 'Weekly Summary' },
    { key: 'month', label: 'Monthly Intelligence' },
    { key: 'year', label: 'Annual Analytics' },
  ];

  // Prime cost benchmark meter calculations
  const primePct = fin.primeCost.primeCostPercentage;
  const isOptimal = primePct <= 58.0;
  const isAcceptable = primePct > 58.0 && primePct <= 60.0;
  const isWarning = primePct > 60.0 && primePct <= 64.0;
  const isCritical = primePct > 64.0;

  const cogsBreakdownData = [
    { name: 'Beginning Inv', amount: fin.cogs.beginningInventory, fill: '#3b82f6' },
    { name: '+ Purchases Rec', amount: fin.cogs.purchasesReceived, fill: '#6366f1' },
    { name: '- Ending Inv', amount: -fin.cogs.endingInventory, fill: '#ec4899' },
    { name: '= Total COGS', amount: fin.cogs.totalCOGS, fill: '#10b981' },
  ];

  const salesVsCostData = [
    {
      category: 'Food Sales',
      Sales: fin.netSales.foodSales,
      Cost: fin.cogs.foodCOGS,
      GrossMargin: fin.netSales.foodSales - fin.cogs.foodCOGS,
      CostPct: fin.cogs.grossFoodCostPct,
      TargetCostPct: fin.cogs.targetFoodCostPct,
    },
    {
      category: 'Beverage Sales',
      Sales: fin.netSales.beverageSales,
      Cost: fin.cogs.beverageCOGS,
      GrossMargin: fin.netSales.beverageSales - fin.cogs.beverageCOGS,
      CostPct: fin.cogs.grossBeverageCostPct,
      TargetCostPct: fin.cogs.targetBeverageCostPct,
    },
    {
      category: 'Supplies / Retail',
      Sales: fin.netSales.merchandiseOtherSales,
      Cost: fin.cogs.suppliesCost,
      GrossMargin: fin.netSales.merchandiseOtherSales - fin.cogs.suppliesCost,
      CostPct: (fin.cogs.suppliesCost / Math.max(1, fin.netSales.merchandiseOtherSales)) * 100,
      TargetCostPct: 15.0,
    },
  ];

  const primeCostCompositionData = [
    { name: 'Food COGS', value: fin.cogs.foodCOGS, color: '#f97316' },
    { name: 'Beverage COGS', value: fin.cogs.beverageCOGS, color: '#8b5cf6' },
    { name: 'Supplies & Paper', value: fin.cogs.suppliesCost, color: '#06b6d4' },
    { name: 'Regular Wages', value: fin.labor.regularWages, color: '#3b82f6' },
    { name: 'Overtime Wages', value: fin.labor.overtimeWages, color: '#ef4444' },
    { name: 'Taxes & Benefits', value: fin.labor.taxesAndBenefits, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Period Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Cost & Prime Cost Intelligence</h2>
              <p className="text-xs text-slate-500">Deterministic Generally Accepted Restaurant Accounting Principles (GARAP)</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedPeriod === p.key
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prime Cost Hero Metric Card & Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prime Cost Meter */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  COGS + Labor Integrated
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {fin.periodLabel}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1">Total Prime Cost</h3>
              <p className="text-xs text-slate-400">Industry Gold Standard Benchmark: 55.0% - 60.0% of Net Sales</p>
            </div>

            <div className="text-right">
              <div className="text-4xl font-extrabold text-white tracking-tight">
                {primePct.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400">
                ${fin.primeCost.totalPrimeCostDollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Dollars
              </div>
            </div>
          </div>

          {/* Benchmark Range Meter Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span className="text-emerald-400">Optimal (&lt; 58%)</span>
              <span className="text-sky-400">Benchmark Target (58 - 60%)</span>
              <span className="text-amber-400">Attention (60 - 64%)</span>
              <span className="text-rose-400">Critical (&gt; 64%)</span>
            </div>
            
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden relative flex p-0.5">
              <div className="w-[58%] bg-emerald-500/30 h-full border-r border-slate-600" title="Optimal Zone" />
              <div className="w-[6%] bg-sky-500/30 h-full border-r border-slate-600" title="Target Zone" />
              <div className="w-[8%] bg-amber-500/30 h-full border-r border-slate-600" title="Attention Zone" />
              <div className="w-[28%] bg-rose-500/30 h-full" title="Critical Zone" />
              
              {/* Pointer Marker */}
              <div
                className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-lg border-2 border-slate-900 transition-all duration-500"
                style={{ left: `calc(${Math.min(100, Math.max(0, (primePct / 75) * 100))}% - 5px)` }}
              />
            </div>
          </div>

          {/* Key Breakdown Cards inside Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Total Net Sales</div>
              <div className="text-lg font-bold text-white mt-0.5">
                ${fin.netSales.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-400">100% Base</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Total COGS Cost</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                ${fin.cogs.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">{fin.cogs.overallCOGSPercentage.toFixed(1)}% of Sales</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Total Labor Cost</div>
              <div className="text-lg font-bold text-sky-400 mt-0.5">
                ${fin.labor.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-sky-400 font-semibold">{fin.labor.laborCostPercentage.toFixed(1)}% of Sales</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Gross Profit Dollars</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                ${(fin.netSales.total - fin.cogs.totalCOGS).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-amber-400 font-semibold">{(100 - fin.cogs.overallCOGSPercentage).toFixed(1)}% Gross Margin</div>
            </div>
          </div>
        </div>

        {/* Prime Cost Assessment Badge */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operating Health</span>
              {isOptimal && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Optimal Health
                </span>
              )}
              {isAcceptable && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                  <CheckCircle2 className="w-4 h-4 text-sky-600" /> Benchmark Normal
                </span>
              )}
              {isWarning && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" /> Elevated Prime Cost
                </span>
              )}
              {isCritical && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Critical Margin Leak
                </span>
              )}
            </div>

            <h4 className="text-lg font-bold text-slate-900">Profitability Integrity Assessment</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Prime Cost combines raw food & beverage depletions directly with scheduled and punch-card labor expenses.
              Operating at <strong className="text-slate-900">{primePct.toFixed(1)}%</strong> yields a net contribution margin of{' '}
              <strong className="text-emerald-700">{(100 - primePct).toFixed(1)}%</strong> before operating overhead and occupancy rent.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gross Food Cost %</span>
                <span className={`font-semibold ${fin.cogs.grossFoodCostPct <= 29 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {fin.cogs.grossFoodCostPct.toFixed(1)}% (Target: 28.0%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bar Pour Cost %</span>
                <span className={`font-semibold ${fin.cogs.grossBeverageCostPct <= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {fin.cogs.grossBeverageCostPct.toFixed(1)}% (Target: 20.0%)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Labor Percentage %</span>
                <span className="font-semibold text-sky-600">{fin.labor.laborCostPercentage.toFixed(1)}% (Target: 28.5%)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Theoretical COGS Variance</span>
                <span className="font-semibold text-slate-700">
                  ${Math.abs(fin.cogs.varianceDollars).toFixed(2)} ({fin.cogs.variancePercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Auto-reconciles with POS
            </span>
            <span className="font-medium text-slate-700">Audit-Verified</span>
          </div>
        </div>
      </div>

      {/* COGS Formula & Waterfall Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Cost of Goods Sold (COGS) Deterministic Accounting</h3>
            <p className="text-xs text-slate-500">Formula: Beginning Inventory + Purchases Received + Transfers In - Transfers Out - Ending Inventory</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Calculated COGS: </span>
            <span className="text-lg font-bold text-emerald-600">
              ${fin.cogs.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Visual Waterfall equation strip */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">1. Beginning Inv</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              ${fin.cogs.beginningInventory.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400">Prior count valuation</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-indigo-200 bg-indigo-50/30">
            <div className="text-[11px] font-semibold text-indigo-600 uppercase">+ 2. Purchases Rec</div>
            <div className="text-base font-bold text-indigo-900 mt-1">
              +${fin.cogs.purchasesReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-indigo-500">Sysco + Beverage invoices</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">± 3. Transfers</div>
            <div className="text-base font-bold text-slate-800 mt-1">
              ${(fin.cogs.transfersIn - fin.cogs.transfersOut).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">Inter-store balance</div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/30">
            <div className="text-[11px] font-semibold text-rose-600 uppercase">- 4. Ending Inv</div>
            <div className="text-base font-bold text-rose-900 mt-1">
              -${fin.cogs.endingInventory.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-rose-500">Physical stock count</div>
          </div>

          <div className="bg-emerald-600 text-white p-3 rounded-lg shadow-sm">
            <div className="text-[11px] font-semibold text-emerald-100 uppercase">= 5. Net COGS</div>
            <div className="text-lg font-black text-white mt-1">
              ${fin.cogs.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-100">{fin.cogs.overallCOGSPercentage.toFixed(1)}% of total sales</div>
          </div>
        </div>

        {/* COGS Chart & Category Margins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3">Sales vs. Product Cost Margins by Department</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesVsCostData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                  />
                  <Legend />
                  <Bar dataKey="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="GrossMargin" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3">Prime Cost Expense Composition</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={primeCostCompositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {primeCostCompositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', border: 'none' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Pour Cost Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wine className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bar Pour Cost Intelligence</h3>
              <p className="text-xs text-slate-500">Draft, Bottles, Wine by Glass & Craft Spirits</p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Overall Pour Cost: {fin.cogs.grossBeverageCostPct.toFixed(1)}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {fin.barPourCost.map((bar) => {
            const isOver = bar.pourCostPct > bar.targetPourCostPct;
            return (
              <div key={bar.segment} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{bar.segment}</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${isOver ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {bar.pourCostPct.toFixed(1)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(100, (bar.pourCostPct / 40) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>COGS: ${bar.cogs.toFixed(2)}</span>
                  <span>Target: {bar.targetPourCostPct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-Day Waste Trends & Root Cause Analysis Dashboard Card */}
      <WasteTrendsSummaryCard defaultDays={30} />
    </div>
  );
};
