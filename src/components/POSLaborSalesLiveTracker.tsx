import React, { useState, useMemo } from 'react';
import {
  Flame,
  Square,
  CircleDot,
  Server,
  Layers,
  Sliders,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ChevronRight,
  Info,
  SlidersHorizontal,
  Table
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Line,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  POSPlatformId,
  POSDepartmentMapping,
  Department,
  Shift,
  Employee
} from '../types';
import { calculateDepartmentLiveEfficiency, INITIAL_POS_DEPARTMENT_MAPPINGS } from '../data/posMappingData';

interface POSLaborSalesLiveTrackerProps {
  posMappings?: Record<POSPlatformId, POSDepartmentMapping>;
  activePOSId?: POSPlatformId;
  onSelectActivePOS?: (posId: POSPlatformId) => void;
  onSelectPOS?: (posId: POSPlatformId) => void;
  onOpenMappingConfig?: () => void;
  onOpenMappingModal?: () => void;
  todayShifts?: Shift[];
  shifts?: Shift[];
  employees: Employee[];
}

const DEPT_COLORS: Record<Department, { primary: string; light: string; border: string; text: string; bgBadge: string }> = {
  'Front of House': { primary: '#0284c7', light: '#e0f2fe', border: 'border-sky-200', text: 'text-sky-700', bgBadge: 'bg-sky-50' },
  'Back of House': { primary: '#e11d48', light: '#ffe4e6', border: 'border-rose-200', text: 'text-rose-700', bgBadge: 'bg-rose-50' },
  'Bar & Beverage': { primary: '#9333ea', light: '#f3e8ff', border: 'border-purple-200', text: 'text-purple-700', bgBadge: 'bg-purple-50' },
  'Kitchen Prep & Dish': { primary: '#d97706', light: '#fef3c7', border: 'border-amber-200', text: 'text-amber-700', bgBadge: 'bg-amber-50' },
  'Management': { primary: '#059669', light: '#d1fae5', border: 'border-emerald-200', text: 'text-emerald-700', bgBadge: 'bg-emerald-50' },
};

export const POSLaborSalesLiveTracker: React.FC<POSLaborSalesLiveTrackerProps> = ({
  posMappings,
  activePOSId = 'toast',
  onSelectActivePOS,
  onSelectPOS,
  onOpenMappingConfig,
  onOpenMappingModal,
  todayShifts,
  shifts,
  employees
}) => {
  const [internalSelectedPOS, setInternalSelectedPOS] = useState<POSPlatformId>(activePOSId || 'toast');
  const [activeChartTab, setActiveChartTab] = useState<'labor_vs_sales' | 'labor_ratio' | 'splh' | 'share' | 'hourly_curve'>('labor_vs_sales');
  const [salesMultiplier, setSalesMultiplier] = useState<number>(1.0);
  const [isSimulatingRush, setIsSimulatingRush] = useState<boolean>(false);

  const selectedPOS = activePOSId || internalSelectedPOS || 'toast';
  const shiftsToUse = todayShifts || shifts || [];

  const handleSelectPOS = (posId: POSPlatformId) => {
    setInternalSelectedPOS(posId);
    if (onSelectActivePOS) onSelectActivePOS(posId);
    if (onSelectPOS) onSelectPOS(posId);
  };

  const handleOpenConfig = () => {
    if (onOpenMappingConfig) onOpenMappingConfig();
    else if (onOpenMappingModal) onOpenMappingModal();
  };

  // Baseline live sales and labor figures
  const baseLiveSales = 8420;
  const baseLiveLaborCost = 1540;

  const currentSales = Math.round(baseLiveSales * salesMultiplier);
  const currentLaborCost = Math.round(baseLiveLaborCost * (salesMultiplier > 1 ? 1 + (salesMultiplier - 1) * 0.15 : 1));

  const safeMappings = posMappings || INITIAL_POS_DEPARTMENT_MAPPINGS;
  const activeMapping = (safeMappings && (safeMappings[selectedPOS] || safeMappings['toast'])) || INITIAL_POS_DEPARTMENT_MAPPINGS[selectedPOS] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast'];

  // Calculate live department metrics using current mapping and shifts
  const departmentMetrics = useMemo(() => {
    return calculateDepartmentLiveEfficiency(
      activeMapping,
      currentSales,
      currentLaborCost,
      shiftsToUse,
      employees
    );
  }, [activeMapping, currentSales, currentLaborCost, shiftsToUse, employees]);

  // Overall restaurant summary
  const totalLiveLaborCost = departmentMetrics.reduce((sum, d) => sum + d.liveLaborCost, 0);
  const totalLiveSales = departmentMetrics.reduce((sum, d) => sum + d.liveMappedSales, 0);
  const totalHours = departmentMetrics.reduce((sum, d) => sum + d.totalHoursToday, 0);
  const totalActiveStaff = departmentMetrics.reduce((sum, d) => sum + d.activeStaffClockedIn, 0);

  const overallLaborPct = totalLiveSales > 0 ? Number(((totalLiveLaborCost / totalLiveSales) * 100).toFixed(2)) : 0;
  const overallSplh = totalHours > 0 ? Math.round(totalLiveSales / totalHours) : 0;

  const targetLaborGoal = 22.0;
  const varianceVsGoal = Number((overallLaborPct - targetLaborGoal).toFixed(2));

  // Chart 0: Primary Dynamic Live Labor vs Sales Dual-Axis Data
  const laborVsSalesChartData = departmentMetrics.map(d => ({
    department: d.department,
    deptShort: d.department === 'Kitchen Prep & Dish' ? 'Dish & Prep' : d.department.replace(' & ', ' & '),
    mappedSales: d.liveMappedSales,
    laborCost: d.liveLaborCost,
    grossMarginDollars: d.liveMappedSales - d.liveLaborCost,
    actualLaborPct: d.liveLaborPct,
    targetLaborPct: d.targetLaborPct,
    splh: d.liveSplh,
    activeStaff: d.activeStaffClockedIn,
    hours: d.totalHoursToday,
    status: d.status
  }));

  // Chart 1: Labor % vs Target Data
  const laborPctChartData = departmentMetrics.map(d => ({
    department: d.department.replace(' & ', ' & \n'),
    deptName: d.department,
    actualLaborPct: d.liveLaborPct,
    targetLaborPct: d.targetLaborPct,
    variance: d.varianceLaborPct,
    sales: d.liveMappedSales,
    laborCost: d.liveLaborCost
  }));

  // Chart 2: SPLH Productivity Data
  const splhChartData = departmentMetrics.map(d => ({
    department: d.department,
    actualSplh: d.liveSplh,
    targetSplh: d.targetSplh,
    efficiencyIndex: d.splhEfficiencyIndex,
    hours: d.totalHoursToday
  }));

  // Chart 3: Sales Share vs Labor Share Data
  const shareComparisonData = departmentMetrics.map(d => ({
    name: d.department,
    salesShare: d.salesSharePct,
    laborShare: d.laborSharePct,
    sales: d.liveMappedSales,
    laborCost: d.liveLaborCost
  }));

  // Chart 4: Hourly Live Ingestion Curve (11 AM - 11 PM)
  const hourlyCurveData = [
    { time: '11:00 AM', sales: Math.round(280 * salesMultiplier), laborCost: 140, laborPct: 50.0, splh: 70 },
    { time: '12:00 PM', sales: Math.round(890 * salesMultiplier), laborCost: 160, laborPct: 18.0, splh: 178 },
    { time: '1:00 PM', sales: Math.round(1150 * salesMultiplier), laborCost: 180, laborPct: 15.6, splh: 230 },
    { time: '2:00 PM', sales: Math.round(620 * salesMultiplier), laborCost: 150, laborPct: 24.2, splh: 124 },
    { time: '3:00 PM', sales: Math.round(380 * salesMultiplier), laborCost: 130, laborPct: 34.2, splh: 95 },
    { time: '4:00 PM', sales: Math.round(490 * salesMultiplier), laborCost: 140, laborPct: 28.5, splh: 110 },
    { time: '5:00 PM', sales: Math.round(940 * salesMultiplier), laborCost: 170, laborPct: 18.1, splh: 188 },
    { time: '6:00 PM', sales: Math.round(1480 * salesMultiplier), laborCost: 190, laborPct: 12.8, splh: 296 },
    { time: '7:00 PM', sales: Math.round(1850 * salesMultiplier), laborCost: 210, laborPct: 11.3, splh: 370 },
    { time: '8:00 PM', sales: Math.round(1620 * salesMultiplier), laborCost: 200, laborPct: 12.3, splh: 324 },
    { time: '9:00 PM', sales: Math.round(980 * salesMultiplier), laborCost: 170, laborPct: 17.3, splh: 196 },
    { time: '10:00 PM', sales: Math.round(440 * salesMultiplier), laborCost: 140, laborPct: 31.8, splh: 88 },
  ];

  const handleTriggerRushSimulation = () => {
    setIsSimulatingRush(true);
    setSalesMultiplier(1.45); // +45% surge
    setTimeout(() => {
      setIsSimulatingRush(false);
    }, 800);
  };

  const handleResetSimulation = () => {
    setSalesMultiplier(1.0);
  };

  const getPOSIcon = (id: string) => {
    switch (id) {
      case 'toast': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'square': return <Square className="w-4 h-4 text-slate-800" />;
      case 'clover': return <CircleDot className="w-4 h-4 text-emerald-600" />;
      case 'ncr_aloha': return <Server className="w-4 h-4 text-blue-600" />;
      default: return <Layers className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div id="analytics-pos-live-labor-tracker" className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-sky-100 space-y-6">

      {/* 1. Header Bar with POS System Switcher & Live Ingestion Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-700 rounded-md border border-orange-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-500" />
              Live POS Labor-to-Sales Engine
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Real-time Ingestion Active
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Last synced 12s ago
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Departmental Labor-to-Sales Efficiency Tracker</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl">
            Correlating live revenue center sales and timeclock punches from <strong>{activeMapping.posPlatformName}</strong> across our 5 operational departments.
          </p>
        </div>

        {/* POS Platform Switcher & Config Button */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            {(['toast', 'square', 'clover', 'ncr_aloha'] as POSPlatformId[]).map((posId) => {
              const isSelected = selectedPOS === posId;
              const config = (safeMappings && safeMappings[posId]) || INITIAL_POS_DEPARTMENT_MAPPINGS[posId];
              return (
                <button
                  key={posId}
                  onClick={() => handleSelectPOS(posId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {getPOSIcon(posId)}
                  <span className="capitalize">{posId.replace('_', ' ')}</span>
                </button>
              );
            })}
          </div>

          <button
            id="open-pos-mapping-config-btn"
            onClick={handleOpenConfig}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-orange-400" />
            <span>Configure POS Mapping</span>
          </button>
        </div>
      </div>

      {/* 2. Top Overview Metric Banners */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">

        {/* Total Live Net Sales */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-sky-50/50 to-white border border-sky-200">
          <div className="flex items-center justify-between text-xs text-sky-800 font-semibold mb-1">
            <span>Live POS Sales</span>
            <DollarSign className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ${totalLiveSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-700 font-medium mt-1 flex items-center gap-1">
            <span>Mapped from {activeMapping.revenueCenterMappings.filter(r => r.active).length} POS Zones</span>
          </div>
        </div>

        {/* Total Live Labor Cost */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-50/50 to-white border border-indigo-200">
          <div className="flex items-center justify-between text-xs text-indigo-800 font-semibold mb-1">
            <span>Live Labor Cost</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ${totalLiveLaborCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            Across {totalHours} clocked staff hours
          </div>
        </div>

        {/* Live Labor % vs Goal */}
        <div className={`p-4 rounded-2xl border ${
          overallLaborPct <= targetLaborGoal
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white border-emerald-200'
            : 'bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white border-amber-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={overallLaborPct <= targetLaborGoal ? 'text-emerald-800' : 'text-amber-800'}>
              Live Labor Ratio
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
            <span>{overallLaborPct}%</span>
            <span className="text-xs font-normal text-slate-500">vs {targetLaborGoal}% goal</span>
          </div>
          <div className="text-[11px] font-bold mt-1">
            {varianceVsGoal <= 0 ? (
              <span className="text-emerald-700 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {Math.abs(varianceVsGoal)}% Under Target (Optimal)
              </span>
            ) : (
              <span className="text-rose-700 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{varianceVsGoal}% Over Target
              </span>
            )}
          </div>
        </div>

        {/* Sales Per Labor Hour (SPLH) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white border border-purple-200">
          <div className="flex items-center justify-between text-xs text-purple-800 font-semibold mb-1">
            <span>Overall SPLH</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            ${overallSplh}<span className="text-sm font-medium text-slate-500">/hr</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            Target benchmark: $165/hr
          </div>
        </div>

        {/* Active Staff Floor Count & Simulation Controls */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1">
              <span>Active Clocked Staff</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {totalActiveStaff} <span className="text-xs font-normal text-slate-300">on floor</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-1.5">
            {salesMultiplier === 1.0 ? (
              <button
                onClick={handleTriggerRushSimulation}
                disabled={isSimulatingRush}
                className="w-full py-1.5 px-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Zap className="w-3 h-3" />
                Simulate Rush (+45% Surge)
              </button>
            ) : (
              <button
                onClick={handleResetSimulation}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-700"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Surge Simulation
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. Departmental Live Labor-to-Sales Grid Cards (5 Core Departments) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Departmental Live Efficiency Breakdown</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            5 Departments Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {departmentMetrics.map((dept) => {
            const colors = DEPT_COLORS[dept.department];
            const isEfficient = dept.liveLaborPct <= dept.targetLaborPct;

            return (
              <div
                key={dept.department}
                className={`p-4 rounded-2xl border ${colors.border} bg-white shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all relative overflow-hidden`}
              >
                {/* Top Title & Status */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colors.bgBadge} ${colors.text} ${colors.border}`}>
                      {dept.department}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      dept.status === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dept.status === 'lean_floor_risk'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {dept.status === 'optimal' ? 'Optimal' : dept.status === 'lean_floor_risk' ? 'Lean Risk' : 'High Labor'}
                    </span>
                  </div>

                  {/* Primary Metrics: Sales & Labor Cost */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">Mapped Sales</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">${dept.liveMappedSales.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{dept.salesSharePct}% share</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">Labor Cost</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">${dept.liveLaborCost.toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{dept.laborSharePct}% share</span>
                    </div>
                  </div>
                </div>

                {/* Labor Ratio Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">Labor %:</span>
                    <span className={`font-mono font-bold ${isEfficient ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {dept.liveLaborPct}% <span className="text-[10px] text-slate-400 font-normal">/ {dept.targetLaborPct}%</span>
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isEfficient ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, (dept.liveLaborPct / (dept.targetLaborPct * 1.5)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* SPLH & Staffing Footprint */}
                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>SPLH Productivity:</span>
                    <span className="font-mono font-bold text-slate-900">${dept.liveSplh}/hr</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Active Staff / Hours:</span>
                    <span className="font-mono font-semibold text-slate-700">{dept.activeStaffClockedIn} staff ({dept.totalHoursToday}h)</span>
                  </div>
                </div>

                {/* Mapped Elements Mini Pill */}
                <div className="pt-1 text-[10px] text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span>{dept.activeRevenueCentersCount} POS Zones</span>
                  <span>{dept.activeJobCodesCount} Job Codes</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Live Labor Visualizations (Recharts) */}
      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">

        {/* Visualization Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Departmental Efficiency Analytics Visualizer
            </h4>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto self-start sm:self-center">
            <button
              onClick={() => setActiveChartTab('labor_vs_sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeChartTab === 'labor_vs_sales'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Labor vs Sales ($ & %)</span>
            </button>
            <button
              onClick={() => setActiveChartTab('labor_ratio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'labor_ratio'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Labor % vs Target
            </button>
            <button
              onClick={() => setActiveChartTab('splh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'splh'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SPLH Productivity ($/hr)
            </button>
            <button
              onClick={() => setActiveChartTab('share')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'share'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales vs Labor Share %
            </button>
            <button
              onClick={() => setActiveChartTab('hourly_curve')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeChartTab === 'hourly_curve'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hourly Ingestion Curve
            </button>
          </div>
        </div>

        {/* Chart View 0: Primary Live Labor vs Sales Dual-Axis Dynamic Efficiency Chart */}
        {activeChartTab === 'labor_vs_sales' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span className="font-bold text-slate-800">
                  Dynamic POS Department Revenue vs Labor Payroll Correlator
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  Mapped Sales ($)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                  Clocked Labor ($)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-1 bg-amber-500 inline-block rounded-full" />
                  Labor % Ratio (Right Axis)
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={laborVsSalesChartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="deptShort"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  />
                  {/* Left Y Axis for Dollars ($) */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                  />
                  {/* Right Y Axis for Labor % */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    unit="%"
                    domain={[0, 40]}
                    tick={{ fontSize: 11, fill: '#f59e0b', fontWeight: 600 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isOptimal = data.actualLaborPct <= data.targetLaborPct;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl text-xs space-y-2 border border-slate-700 min-w-[240px]">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                              <span className="font-bold text-sky-300 text-sm">{data.department}</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isOptimal ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              }`}>
                                {isOptimal ? 'Optimal' : 'High Labor'}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Live Mapped Sales:</span>
                                <span className="font-mono font-bold text-emerald-400">${data.mappedSales.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Live Labor Payroll:</span>
                                <span className="font-mono font-bold text-indigo-300">${data.laborCost.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Gross Margin Dollar:</span>
                                <span className="font-mono font-bold text-sky-200">${data.grossMarginDollars.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-slate-800">
                                <span className="text-slate-400">Live Labor %:</span>
                                <span className={`font-mono font-black ${isOptimal ? 'text-emerald-300' : 'text-rose-300'}`}>
                                  {data.actualLaborPct}% <span className="text-[10px] text-slate-400 font-normal">/ {data.targetLaborPct}% goal</span>
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Sales Per Labor Hour:</span>
                                <span className="font-mono font-bold text-amber-300">${data.splh}/hr</span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-400">
                                <span>Clocked On-Floor:</span>
                                <span>{data.activeStaff} staff ({data.hours} hrs)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                    verticalAlign="bottom"
                  />

                  {/* Mapped Sales Bar */}
                  <Bar
                    yAxisId="left"
                    dataKey="mappedSales"
                    name="Live POS Sales ($)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />

                  {/* Labor Cost Bar */}
                  <Bar
                    yAxisId="left"
                    dataKey="laborCost"
                    name="Live Labor Payroll ($)"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />

                  {/* Labor Ratio % Line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="actualLaborPct"
                    name="Live Labor % Ratio"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />

                  {/* Target Labor Threshold Reference Line */}
                  <ReferenceLine
                    yAxisId="right"
                    y={targetLaborGoal}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target: ${targetLaborGoal}%`,
                      fill: '#059669',
                      fontSize: 11,
                      position: 'top',
                      fontWeight: 'bold'
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Net Margin</span>
                <div className="text-base font-black text-slate-900">
                  ${(totalLiveSales - totalLiveLaborCost).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-500">
                  Live revenue retained after department labor payroll.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Labor-to-Sales Ratio</span>
                <div className={`text-base font-black ${overallLaborPct <= targetLaborGoal ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {overallLaborPct}% <span className="text-xs text-slate-500 font-normal">vs {targetLaborGoal}% goal</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {varianceVsGoal <= 0 ? 'Operating inside optimal restaurant profitability targets.' : 'Exceeding target due to low mid-day traffic.'}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Live Mapping Source</span>
                <div className="text-base font-black text-slate-900 capitalize">
                  {activeMapping.posPlatformName}
                </div>
                <p className="text-[11px] text-slate-500">
                  {activeMapping.revenueCenterMappings.filter(r => r.active).length} Revenue Centers & {activeMapping.jobCodeMappings.filter(j => j.active).length} Job Codes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart View 1: Labor % vs Target Benchmark */}
        {activeChartTab === 'labor_ratio' && (
          <div className="space-y-3">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={laborPctChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="deptName" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 25]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <div className="font-bold text-sky-300 border-b border-slate-700 pb-1">{data.deptName}</div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Actual Labor %:</span>
                              <span className="font-mono font-bold text-white">{data.actualLaborPct}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Target Benchmark:</span>
                              <span className="font-mono text-slate-300">{data.targetLaborPct}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Mapped Sales:</span>
                              <span className="font-mono text-emerald-400">${data.sales.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Labor Cost:</span>
                              <span className="font-mono text-sky-400">${data.laborCost.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="actualLaborPct" name="Actual Live Labor %" fill="#0284c7" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="targetLaborPct" name="Configured Target %" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Blue bars represent actual real-time labor percentage calculated from POS ticket categories and clock-ins. Gray bars represent configured target benchmarks.
            </p>
          </div>
        )}

        {/* Chart View 2: SPLH Productivity */}
        {activeChartTab === 'splh' && (
          <div className="space-y-3">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={splhChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis unit="$" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 600]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <div className="font-bold text-emerald-300 border-b border-slate-700 pb-1">{data.department}</div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Actual SPLH:</span>
                              <span className="font-mono font-bold text-emerald-400">${data.actualSplh}/hr</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Target SPLH:</span>
                              <span className="font-mono text-slate-300">${data.targetSplh}/hr</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Efficiency Score:</span>
                              <span className="font-mono text-sky-400">{data.efficiencyIndex}%</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="actualSplh" name="Actual SPLH ($/hr)" fill="#059669" radius={[6, 6, 0, 0]} barSize={32} />
                  <Bar dataKey="targetSplh" name="Target Benchmark ($/hr)" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Sales Per Labor Hour (SPLH) measures dollar output generated per staff hour worked in each mapped department.
            </p>
          </div>
        )}

        {/* Chart View 3: Sales Share vs Labor Share */}
        {activeChartTab === 'share' && (
          <div className="space-y-3">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shareComparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis unit="%" tick={{ fontSize: 11, fill: '#475569' }} domain={[0, 60]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <div className="font-bold text-sky-300 border-b border-slate-700 pb-1">{data.name}</div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Sales Share:</span>
                              <span className="font-mono font-bold text-emerald-400">{data.salesShare}% (${data.sales.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Labor Share:</span>
                              <span className="font-mono font-bold text-sky-400">{data.laborShare}% (${data.laborCost.toLocaleString()})</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Bar dataKey="salesShare" name="Share of Total Restaurant Sales (%)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                  <Bar dataKey="laborShare" name="Share of Total Labor Cost (%)" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Compares the revenue generated by each department against its proportion of total labor payroll expenses.
            </p>
          </div>
        )}

        {/* Chart View 4: Hourly Ingestion Curve */}
        {activeChartTab === 'hourly_curve' && (
          <div className="space-y-3">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hourlyCurveData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 60]} tick={{ fontSize: 11, fill: '#f59e0b' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <div className="font-bold text-white border-b border-slate-700 pb-1">{data.time}</div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Hourly Sales:</span>
                              <span className="font-mono font-bold text-sky-300">${data.sales}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Hourly Labor:</span>
                              <span className="font-mono font-bold text-rose-300">${data.laborCost}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Labor Ratio:</span>
                              <span className="font-mono font-bold text-amber-400">{data.laborPct}%</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Hourly SPLH:</span>
                              <span className="font-mono font-bold text-emerald-400">${data.splh}/hr</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Area yAxisId="left" type="monotone" dataKey="sales" name="Hourly Net Sales ($)" fill="#e0f2fe" stroke="#0284c7" strokeWidth={2} />
                  <Bar yAxisId="left" dataKey="laborCost" name="Hourly Labor Cost ($)" fill="#64748b" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="laborPct" name="Labor % Ratio" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <ReferenceLine yAxisId="right" y={22} stroke="#10b981" strokeDasharray="3 3" label={{ value: '22% Target', fill: '#10b981', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Real-time synchronization curve matching hourly POS ticket throughput against active scheduled clock-in payroll.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};