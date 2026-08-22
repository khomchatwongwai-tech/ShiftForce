import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { WasteRecord, WasteReasonCode, ShiftPeriod } from '../../types/inventory';
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Filter,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Clock,
  UserCheck,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  HelpCircle,
  RefreshCw,
  Eye,
  ShieldAlert,
  Flame,
  Check,
  Package
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
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
  Legend
} from 'recharts';
import * as d3 from 'd3';

export interface WasteTrendsSummaryCardProps {
  className?: string;
  defaultDays?: 30 | 14 | 7 | 90;
  showFullDetails?: boolean;
  predefinedThresholdPct?: number;
}

const REASON_METADATA: Record<WasteReasonCode, { label: string; color: string; category: string; description: string }> = {
  overcooked_kitchen_error: {
    label: 'Kitchen / Line Cook Error',
    color: '#ef4444',
    category: 'Cook Line & Execution',
    description: 'Steaks, proteins, or dishes overcooked, burned, or prepared incorrectly on the line.'
  },
  storage_temp_failure: {
    label: 'Storage / Temp Failure',
    color: '#f97316',
    category: 'Equipment & Facilities',
    description: 'Walk-in refrigeration defrost cycles, door latches, or cooling temperature spikes.'
  },
  spoilage_expired: {
    label: 'Spoilage & Expiration',
    color: '#eab308',
    category: 'FIFO & Rotation',
    description: 'Inventory reaching thaw expiration or shelf life before menu prep.'
  },
  prep_trimming_loss: {
    label: 'Prep & Trimming Loss',
    color: '#10b981',
    category: 'Prep & Yield',
    description: 'Excess yield reduction during slicing, peeling, or butchery trimming.'
  },
  bar_overpour_comp: {
    label: 'Bar Tap / Overpour Loss',
    color: '#8b5cf6',
    category: 'Bar & Beverage',
    description: 'Draft beer line foaming, overpoured spirits, or tap regulator fluctuations.'
  },
  spill_breakage_drop: {
    label: 'Spill & Breakage',
    color: '#06b6d4',
    category: 'Station Physical Safety',
    description: 'Speed rail bottle slips, dropped speed pourers, or broken glass.'
  },
  overproduction_excess: {
    label: 'Overproduction & Batch Excess',
    color: '#6366f1',
    category: 'Forecast & Ordering',
    description: 'Large batch prep that went unconsumed due to demand fluctuations.'
  },
  customer_return_dissatisfaction: {
    label: 'Customer Return & Refire',
    color: '#ec4899',
    category: 'Guest Experience',
    description: 'Customer requested substitution or refire due to dish dissatisfaction.'
  },
  expired_shelf_life: {
    label: 'Expired Dry / Canned Shelf Life',
    color: '#64748b',
    category: 'Storage',
    description: 'Packaged goods passing manufacturer best-by date.'
  },
  theft_unaccounted: {
    label: 'Unaccounted Shrink / Loss',
    color: '#dc2626',
    category: 'Security',
    description: 'Inventory variance not captured in regular station consumption.'
  },
  quality_inspection_fail: {
    label: 'Quality Inspection Fail',
    color: '#d97706',
    category: 'Receiving',
    description: 'Items rejected upon receiving delivery inspection.'
  }
};

export const WasteTrendsSummaryCard: React.FC<WasteTrendsSummaryCardProps> = ({
  className = '',
  defaultDays = 30,
  showFullDetails = true,
  predefinedThresholdPct = 1.5
}) => {
  const { wasteRecords, items } = useInventory();

  const [timeHorizonDays, setTimeHorizonDays] = useState<number>(defaultDays);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [thresholdPercentage, setThresholdPercentage] = useState<number>(predefinedThresholdPct);
  const [activeViewMode, setActiveViewMode] = useState<'reasons' | 'timeline' | 'anomalies' | 'shifts' | 'thresholds'>('reasons');
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [highlightedReason, setHighlightedReason] = useState<WasteReasonCode | null>(null);
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<WasteRecord | null>(null);
  const [acknowledgedIssues, setAcknowledgedIssues] = useState<Record<string, boolean>>({});

  // Reference date: current system time (2026-08-21)
  const referenceTimestamp = useMemo(() => new Date('2026-08-21T23:59:59Z').getTime(), []);

  // Total Inventory Valuation (sum of current stock * unit cost across all items)
  const totalInventoryValuation = useMemo(() => {
    const sum = items.reduce((acc, item) => {
      const qty = item.quantityOnHand ?? item.endingInventory ?? 0;
      return acc + qty * (item.unitCost || 0);
    }, 0);
    return sum > 0 ? sum : 8495.20; // Safe fallback valuation
  }, [items]);

  // Filter records by time horizon & department
  const filteredRecords = useMemo(() => {
    const cutoffTime = referenceTimestamp - timeHorizonDays * 24 * 60 * 60 * 1000;
    return wasteRecords.filter((rec) => {
      const recTime = new Date(rec.timestamp).getTime();
      if (recTime < cutoffTime) return false;
      if (selectedDepartment !== 'All' && rec.department !== selectedDepartment) return false;
      return true;
    });
  }, [wasteRecords, timeHorizonDays, selectedDepartment, referenceTimestamp]);

  // Aggregate Key Metrics
  const totalPeriodWasteCost = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.totalWasteCost || 0), 0);
  }, [filteredRecords]);

  const totalIncidents = filteredRecords.length;
  const avgCostPerIncident = totalIncidents > 0 ? totalPeriodWasteCost / totalIncidents : 0;

  // Automated Category Threshold Analysis (Group by Category vs Total Inventory Cost)
  const categoryWasteAnalysis = useMemo(() => {
    const catMap: Record<string, {
      category: string;
      categoryGroup: string;
      totalCost: number;
      incidentCount: number;
      itemsList: Set<string>;
      topItem: string;
      records: WasteRecord[];
    }> = {};

    filteredRecords.forEach((rec) => {
      const cat = rec.category || 'General';
      if (!catMap[cat]) {
        catMap[cat] = {
          category: cat,
          categoryGroup: rec.categoryGroup || 'Kitchen & Bar',
          totalCost: 0,
          incidentCount: 0,
          itemsList: new Set(),
          topItem: rec.itemName,
          records: []
        };
      }
      catMap[cat].totalCost += rec.totalWasteCost || 0;
      catMap[cat].incidentCount += 1;
      catMap[cat].itemsList.add(rec.itemName);
      catMap[cat].records.push(rec);
    });

    return Object.values(catMap).map((cat) => {
      const pctOfInventory = totalInventoryValuation > 0 ? (cat.totalCost / totalInventoryValuation) * 100 : 0;
      const pctOfWaste = totalPeriodWasteCost > 0 ? (cat.totalCost / totalPeriodWasteCost) * 100 : 0;
      const isBreached = pctOfInventory >= thresholdPercentage;
      const dollarThresholdLimit = (thresholdPercentage / 100) * totalInventoryValuation;
      const dollarOverLimit = Math.max(0, cat.totalCost - dollarThresholdLimit);

      return {
        ...cat,
        totalCost: Number(cat.totalCost.toFixed(2)),
        pctOfInventory: Number(pctOfInventory.toFixed(2)),
        pctOfWaste: Number(pctOfWaste.toFixed(1)),
        isBreached,
        dollarThresholdLimit: Number(dollarThresholdLimit.toFixed(2)),
        dollarOverLimit: Number(dollarOverLimit.toFixed(2)),
        varianceAboveThresholdPct: Number(Math.max(0, pctOfInventory - thresholdPercentage).toFixed(2)),
        itemsCount: cat.itemsList.size,
        itemsSummary: Array.from(cat.itemsList).join(', ')
      };
    }).sort((a, b) => b.pctOfInventory - a.pctOfInventory);
  }, [filteredRecords, totalInventoryValuation, totalPeriodWasteCost, thresholdPercentage]);

  // Categories exceeding threshold
  const breachedCategories = useMemo(() => {
    return categoryWasteAnalysis.filter((cat) => cat.isBreached);
  }, [categoryWasteAnalysis]);

  // Automated condition: background highlights in amber if ANY single waste category exceeds predefined % of total inventory cost
  const isThresholdExceeded = breachedCategories.length > 0;

  // Group by Reason Code
  const reasonAggregations = useMemo(() => {
    const map: Record<string, {
      code: WasteReasonCode;
      label: string;
      color: string;
      category: string;
      totalCost: number;
      incidentCount: number;
      itemsWasted: Set<string>;
      records: WasteRecord[];
      recurringAnomalies: number;
    }> = {};

    filteredRecords.forEach((rec) => {
      const meta = REASON_METADATA[rec.reasonCode] || {
        label: rec.reasonCode,
        color: '#94a3b8',
        category: 'General',
        description: ''
      };

      if (!map[rec.reasonCode]) {
        map[rec.reasonCode] = {
          code: rec.reasonCode,
          label: meta.label,
          color: meta.color,
          category: meta.category,
          totalCost: 0,
          incidentCount: 0,
          itemsWasted: new Set(),
          records: [],
          recurringAnomalies: 0
        };
      }

      map[rec.reasonCode].totalCost += rec.totalWasteCost || 0;
      map[rec.reasonCode].incidentCount += 1;
      map[rec.reasonCode].itemsWasted.add(rec.itemName);
      map[rec.reasonCode].records.push(rec);
      if (rec.isRecurringAnomaly) {
        map[rec.reasonCode].recurringAnomalies += 1;
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        totalCost: Number(item.totalCost.toFixed(2)),
        percentage: totalPeriodWasteCost > 0 ? (item.totalCost / totalPeriodWasteCost) * 100 : 0,
        itemsCount: item.itemsWasted.size,
        itemsList: Array.from(item.itemsWasted).join(', ')
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredRecords, totalPeriodWasteCost]);

  // Top Waste Reason
  const topReason = reasonAggregations[0] || null;

  // 30-Day Daily Timeline Aggregation & Linear Regression 30-Day Forecast
  const timelineRegressionAnalysis = useMemo(() => {
    const daysMap: Record<string, { date: string; displayDate: string; cost: number; incidents: number; topItem: string }> = {};

    // Initialize all days in the horizon
    for (let i = timeHorizonDays - 1; i >= 0; i--) {
      const d = new Date(referenceTimestamp - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;
      daysMap[key] = { date: key, displayDate, cost: 0, incidents: 0, topItem: '' };
    }

    filteredRecords.forEach((rec) => {
      const recDate = rec.timestamp.split('T')[0];
      if (daysMap[recDate]) {
        daysMap[recDate].cost = Number((daysMap[recDate].cost + rec.totalWasteCost).toFixed(2));
        daysMap[recDate].incidents += 1;
        if (!daysMap[recDate].topItem) {
          daysMap[recDate].topItem = rec.itemName;
        }
      }
    });

    const historicalDays = Object.values(daysMap);
    const n = historicalDays.length;

    // Simple Linear Regression calculation (y = m * x + b)
    // x = 0, 1, ..., n-1
    // y = cost
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;

    historicalDays.forEach((day, index) => {
      const x = index;
      const y = day.cost;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    });

    const meanX = n > 0 ? sumX / n : 0;
    const meanY = n > 0 ? sumY / n : 0;
    const denominator = sumXX - sumX * meanX;

    const slope = denominator !== 0 ? (sumXY - sumX * meanY) / denominator : 0;
    const intercept = meanY - slope * meanX;

    // R-squared calculation
    let ssTot = 0;
    let ssRes = 0;
    historicalDays.forEach((day, index) => {
      const y = day.cost;
      const yPred = slope * index + intercept;
      ssTot += (y - meanY) ** 2;
      ssRes += (y - yPred) ** 2;
    });
    const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;

    // Build historical dataset with fitted regression trend line
    const combinedChartData: Array<{
      date: string;
      displayDate: string;
      cost: number | null;
      trendLine: number;
      forecastCost: number | null;
      incidents: number;
      topItem: string;
      isForecast: boolean;
    }> = historicalDays.map((day, index) => {
      const fittedTrend = Math.max(0, slope * index + intercept);
      const isLastHistorical = index === n - 1;
      return {
        date: day.date,
        displayDate: day.displayDate,
        cost: day.cost,
        trendLine: Number(fittedTrend.toFixed(2)),
        forecastCost: isLastHistorical ? day.cost : null, // Connects projection smoothly to actual
        incidents: day.incidents,
        topItem: day.topItem,
        isForecast: false
      };
    });

    // 30-Day Future Forecast Points (days n, n+1, ..., n+29)
    let projected30DayTotal = 0;
    const forecastDaysCount = 30;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let k = 1; k <= forecastDaysCount; k++) {
      const forecastIndex = (n - 1) + k;
      const forecastVal = Math.max(0, slope * forecastIndex + intercept);
      projected30DayTotal += forecastVal;

      const futureDate = new Date(referenceTimestamp + k * 24 * 60 * 60 * 1000);
      const key = futureDate.toISOString().split('T')[0];
      const displayDate = `${monthNames[futureDate.getUTCMonth()]} ${futureDate.getUTCDate()} (Proj)`;

      combinedChartData.push({
        date: key,
        displayDate,
        cost: null,
        trendLine: Number(forecastVal.toFixed(2)),
        forecastCost: Number(forecastVal.toFixed(2)),
        incidents: 0,
        topItem: 'Linear Forecast Model',
        isForecast: true
      });
    }

    const avgDailyForecast = projected30DayTotal / forecastDaysCount;
    const historicalDailyAvg = totalPeriodWasteCost / Math.max(1, timeHorizonDays);
    const projectedChangePct = historicalDailyAvg > 0
      ? ((avgDailyForecast - historicalDailyAvg) / historicalDailyAvg) * 100
      : 0;

    return {
      combinedChartData,
      historicalDays,
      slope: Number(slope.toFixed(3)),
      intercept: Number(intercept.toFixed(2)),
      rSquared: Number(rSquared.toFixed(3)),
      projected30DayTotal: Number(projected30DayTotal.toFixed(2)),
      avgDailyForecast: Number(avgDailyForecast.toFixed(2)),
      projectedChangePct: Number(projectedChangePct.toFixed(1)),
      trendDirection: slope > 0.05 ? 'increasing' : slope < -0.05 ? 'decreasing' : 'stable'
    };
  }, [filteredRecords, timeHorizonDays, referenceTimestamp, totalPeriodWasteCost]);

  // Shift Distribution
  const shiftDistribution = useMemo(() => {
    const shifts: Record<ShiftPeriod, { name: string; cost: number; count: number; color: string }> = {
      morning: { name: 'Morning Opening', cost: 0, count: 0, color: '#3b82f6' },
      mid: { name: 'Mid Day / Lunch', cost: 0, count: 0, color: '#10b981' },
      closing: { name: 'Dinner & Closing', cost: 0, count: 0, color: '#f59e0b' },
      overnight: { name: 'Overnight Prep', cost: 0, count: 0, color: '#8b5cf6' }
    };

    filteredRecords.forEach((rec) => {
      if (shifts[rec.shift]) {
        shifts[rec.shift].cost = Number((shifts[rec.shift].cost + rec.totalWasteCost).toFixed(2));
        shifts[rec.shift].count += 1;
      }
    });

    return Object.values(shifts);
  }, [filteredRecords]);

  // Recurring Operational Issues Detective
  const recurringOperationalIssues = useMemo(() => {
    const issues: {
      id: string;
      title: string;
      reasonCode: WasteReasonCode;
      category: string;
      affectedItem: string;
      sku: string;
      totalLoss: number;
      incidentCount: number;
      severity: 'high' | 'medium' | 'low';
      rootCauseSummary: string;
      managerSopRecommendation: string;
      latestRecord: WasteRecord;
    }[] = [];

    // Group records by item + reason
    const itemReasonGroups: Record<string, WasteRecord[]> = {};
    filteredRecords.forEach((rec) => {
      const key = `${rec.itemId}__${rec.reasonCode}`;
      if (!itemReasonGroups[key]) itemReasonGroups[key] = [];
      itemReasonGroups[key].push(rec);
    });

    Object.entries(itemReasonGroups).forEach(([key, recs]) => {
      if (recs.length >= 2 || recs.some((r) => r.isRecurringAnomaly)) {
        const first = recs[0];
        const totalLoss = Number(recs.reduce((sum, r) => sum + r.totalWasteCost, 0).toFixed(2));
        const incidentCount = recs.length;

        let rootCause = 'Multiple recurring waste incidents logged under identical conditions.';
        let sop = 'Review standard operating procedure with shift lead.';
        let severity: 'high' | 'medium' | 'low' = totalLoss > 50 ? 'high' : totalLoss > 20 ? 'medium' : 'low';

        if (first.reasonCode === 'storage_temp_failure') {
          rootCause = 'Refrigeration walk-in thermostat calibration drift & overnight door latch seal failure.';
          sop = 'Lower door alarm threshold to 40°F and service door gasket seals immediately.';
          severity = 'high';
        } else if (first.reasonCode === 'overcooked_kitchen_error') {
          rootCause = 'Grill line cook timer oversight during peak rush ticket surges.';
          sop = 'Mount hardwired magnetic timers at station and mandate instant meat probe calibration.';
          severity = 'high';
        } else if (first.reasonCode === 'spoilage_expired') {
          rootCause = 'Seafood station FIFO lapse; thaw pans stored above ice line without day-dot color codes.';
          sop = 'Enforce mandatory twice-daily seafood ice bed audit and color-coded expiration labeling.';
          severity = 'high';
        } else if (first.reasonCode === 'prep_trimming_loss') {
          rootCause = 'Dull knife edges and high-speed prep yielding excessive discard flesh.';
          sop = 'Establish weekly mandatory knife sharpening schedule and prep cook yield re-training.';
          severity = 'medium';
        } else if (first.reasonCode === 'bar_overpour_comp') {
          rootCause = 'Draft glycol tap line pressure surges causing excessive foaming during rush hours.';
          sop = 'Calibrate draft regulator valve to exactly 12 PSI and clean glycol lines weekly.';
          severity = 'medium';
        }

        issues.push({
          id: key,
          title: `${first.itemName} — ${REASON_METADATA[first.reasonCode]?.label || first.reasonCode}`,
          reasonCode: first.reasonCode,
          category: first.category,
          affectedItem: first.itemName,
          sku: first.sku,
          totalLoss,
          incidentCount,
          severity,
          rootCauseSummary: rootCause,
          managerSopRecommendation: sop,
          latestRecord: recs[recs.length - 1]
        });
      }
    });

    return issues.sort((a, b) => b.totalLoss - a.totalLoss);
  }, [filteredRecords]);

  // Handle acknowledge issue
  const toggleAcknowledgeIssue = (id: string) => {
    setAcknowledgedIssues((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div
      id="waste-trends-summary-dashboard-card"
      className={`rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
        isThresholdExceeded
          ? 'bg-amber-50/80 dark:bg-amber-950/25 border-2 border-amber-400/90 dark:border-amber-600/90 ring-4 ring-amber-400/15 shadow-amber-500/10'
          : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800'
      } ${className}`}
    >
      {/* Card Header */}
      <div className={`p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300 ${
        isThresholdExceeded
          ? 'bg-amber-100/70 dark:bg-amber-900/40 border-amber-300/80 dark:border-amber-800/80'
          : 'bg-stone-50/50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800'
      }`}>
        <div className="flex items-start space-x-3.5">
          <div className={`p-2.5 rounded-xl border shadow-xs ${
            isThresholdExceeded
              ? 'bg-amber-200/90 dark:bg-amber-900/90 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700'
              : 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900'
          }`}>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="font-bold text-base text-stone-900 dark:text-white tracking-tight">
                Waste Trends & Operational Root Causes
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                Last {timeHorizonDays} Days
              </span>
              {isThresholdExceeded ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-stone-950 flex items-center gap-1 shadow-xs animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  <span>THRESHOLD ALERT: {breachedCategories.length} CATEGORY EXCEEDED</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Threshold Monitored ({thresholdPercentage}% Limit)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
              Automated threshold monitor comparing category waste loss to total inventory cost valuation (${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </p>
          </div>
        </div>

        {/* Filters and View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Threshold Percentage Configurator */}
          <div className="flex items-center gap-1 bg-white/90 dark:bg-stone-800 px-2 py-1 rounded-xl border border-stone-300/80 dark:border-stone-700 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">Limit:</span>
            {[1.0, 1.5, 2.0, 3.0].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setThresholdPercentage(pct)}
                title={`Set category waste threshold to ${pct}% of total inventory cost`}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  thresholdPercentage === pct
                    ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Time Horizon Selector */}
          <div className="bg-stone-200/70 dark:bg-stone-800 p-1 rounded-xl flex items-center gap-1 border border-stone-300/50 dark:border-stone-700">
            {[
              { days: 7, label: '7D' },
              { days: 14, label: '14D' },
              { days: 30, label: '30D' },
              { days: 90, label: '90D' },
            ].map((option) => (
              <button
                key={option.days}
                id={`waste-trend-period-${option.days}`}
                onClick={() => setTimeHorizonDays(option.days)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeHorizonDays === option.days
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            id="waste-trend-dept-filter"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <option value="All">All Departments</option>
            <option value="Back of House">Back of House (Line)</option>
            <option value="Kitchen Prep & Dish">Kitchen Prep & Dish</option>
            <option value="Bar & Beverage">Bar & Beverage</option>
            <option value="Front of House">Front of House</option>
          </select>
        </div>
      </div>

      {/* Automated Threshold Monitor Amber Alert Banner */}
      {isThresholdExceeded && (
        <div
          id="waste-threshold-amber-alert-banner"
          className="p-4 bg-amber-500/15 dark:bg-amber-950/50 border-b border-amber-300 dark:border-amber-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-amber-950 dark:text-amber-200 animate-in fade-in duration-200"
        >
          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-amber-500 text-stone-950 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 font-black" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-tight flex items-center gap-2">
                <span>AUTOMATED THRESHOLD MONITOR: Amber Highlight Active</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  Threshold: &gt; {thresholdPercentage}% of Total Inventory Cost
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-300/90 mt-0.5">
                {breachedCategories.length} category {breachedCategories.length === 1 ? 'has' : 'have'} exceeded the {thresholdPercentage}% threshold of total inventory valuation (${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}):
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {breachedCategories.map((cat) => (
                  <div
                    key={cat.category}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700/80 text-xs font-bold text-amber-950 dark:text-amber-100 flex items-center space-x-1.5 shadow-2xs"
                  >
                    <span>{cat.category}:</span>
                    <span className="text-red-700 dark:text-red-400 font-mono">${cat.totalCost.toFixed(2)}</span>
                    <span className="text-[10px] text-amber-800 dark:text-amber-300">
                      ({cat.pctOfInventory}% of total inv vs {thresholdPercentage}% limit • +${cat.dollarOverLimit.toFixed(2)} over)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveViewMode('thresholds')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs shrink-0 self-start md:self-center transition-all cursor-pointer"
          >
            Inspect Category Thresholds →
          </button>
        </div>
      )}

      {/* KPI Highlight Strip */}
      <div className={`grid grid-cols-2 lg:grid-cols-5 gap-3.5 p-5 border-b ${
        isThresholdExceeded
          ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20'
          : 'border-stone-100 dark:border-stone-800/80 bg-gradient-to-r from-stone-50/40 via-white to-stone-50/40 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-900'
      }`}>
        {/* Total Cost Metric */}
        <div className="p-3.5 bg-white/80 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
            <span className="font-semibold">Total Waste Loss</span>
            <DollarSign className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white">
            ${totalPeriodWasteCost.toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-600 dark:text-stone-300 flex items-center gap-1">
            <span>{totalIncidents} incidents</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              ${avgCostPerIncident.toFixed(2)}/avg
            </span>
          </div>
        </div>

        {/* Total Inventory Valuation Metric */}
        <div className="p-3.5 bg-white/80 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
            <span className="font-semibold">Total Inventory Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-stone-900 dark:text-white font-mono">
            ${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-between">
            <span>Max Category Allowed:</span>
            <span className="font-bold text-stone-900 dark:text-white font-mono">
              ${((thresholdPercentage / 100) * totalInventoryValuation).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Threshold Monitor Status Metric */}
        <div className={`p-3.5 rounded-xl border space-y-1 ${
          isThresholdExceeded
            ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100'
            : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Threshold Monitor</span>
            {isThresholdExceeded ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div className="text-sm font-black flex items-center gap-1.5">
            {isThresholdExceeded ? (
              <span className="text-amber-800 dark:text-amber-300">⚠️ Amber Alert ({breachedCategories.length})</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400">✓ All Clear (0 &gt; {thresholdPercentage}%)</span>
            )}
          </div>
          <div className="text-[10px] text-stone-600 dark:text-stone-300">
            {isThresholdExceeded
              ? `${breachedCategories[0]?.category}: ${breachedCategories[0]?.pctOfInventory}% of inv`
              : `All categories under ${thresholdPercentage}% limit`}
          </div>
        </div>

        {/* Top Reason Metric */}
        <div className="p-3.5 bg-white/80 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
            <span className="font-semibold">#1 Loss Driver</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-stone-900 dark:text-white truncate" title={topReason?.label || 'None'}>
            {topReason ? topReason.label : 'No Data'}
          </div>
          <div className="text-[11px] text-stone-600 dark:text-stone-300 flex items-center gap-1">
            {topReason ? (
              <>
                <span className="font-bold text-red-600 dark:text-red-400">
                  ${topReason.totalCost.toFixed(2)}
                </span>
                <span>({topReason.percentage.toFixed(1)}%)</span>
              </>
            ) : (
              <span>Zero logged loss</span>
            )}
          </div>
        </div>

        {/* Recurring Anomalies Metric */}
        <div className="p-3.5 bg-white/80 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/80 space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
            <span className="font-semibold">Recurring Patterns</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <span>{recurringOperationalIssues.length}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              SOP Action
            </span>
          </div>
          <div className="text-[11px] text-stone-600 dark:text-stone-300">
            {new Set(recurringOperationalIssues.map((i) => i.affectedItem)).size} critical items
          </div>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="px-5 pt-3 pb-0 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none bg-stone-50/30 dark:bg-stone-900/30">
        <div className="flex items-center gap-2">
          <button
            id="waste-tab-reasons"
            onClick={() => setActiveViewMode('reasons')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeViewMode === 'reasons'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Top Loss Reasons ({reasonAggregations.length})</span>
          </button>

          <button
            id="waste-tab-thresholds"
            onClick={() => setActiveViewMode('thresholds')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeViewMode === 'thresholds'
                ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-extrabold'
                : isThresholdExceeded
                ? 'border-transparent text-amber-700 dark:text-amber-400 hover:text-amber-900'
                : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${isThresholdExceeded ? 'text-amber-600 animate-bounce' : 'text-stone-400'}`} />
            <span>Category Threshold Monitor {isThresholdExceeded && `(${breachedCategories.length} Exceeded)`}</span>
          </button>

          <button
            id="waste-tab-timeline"
            onClick={() => setActiveViewMode('timeline')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeViewMode === 'timeline'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>30-Day Timeline</span>
          </button>

          <button
            id="waste-tab-anomalies"
            onClick={() => setActiveViewMode('anomalies')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeViewMode === 'anomalies'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>SOP Action Plans ({recurringOperationalIssues.length})</span>
          </button>

          <button
            id="waste-tab-shifts"
            onClick={() => setActiveViewMode('shifts')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeViewMode === 'shifts'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shift Breakdown</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Top Waste Reasons Visualizer (Recharts Bar & Breakdown) */}
      {activeViewMode === 'reasons' && (
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recharts Bar Chart */}
            <div className="lg:col-span-7 bg-stone-50/70 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-red-500" />
                  <span>Cost Impact by Waste Reason ($)</span>
                </div>
                <span className="text-[11px] text-stone-600 dark:text-stone-300">Click bar to drill down</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reasonAggregations}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                    <XAxis
                      type="number"
                      tickFormatter={(val) => `$${val}`}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      width={160}
                      tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-stone-900 text-white p-3 rounded-xl shadow-xl text-xs border border-stone-700 space-y-1">
                              <div className="font-bold text-red-400">{data.label}</div>
                              <div className="text-stone-300">{data.category}</div>
                              <div className="pt-1 border-t border-stone-800 flex justify-between gap-4 font-mono">
                                <span>Total Loss:</span>
                                <span className="font-bold text-white">${data.totalCost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between gap-4 text-stone-400 font-mono text-[11px]">
                                <span>Incidents:</span>
                                <span>{data.incidentCount} logs</span>
                              </div>
                              <div className="flex justify-between gap-4 text-stone-400 font-mono text-[11px]">
                                <span>Share:</span>
                                <span>{data.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="text-[10px] text-stone-400 italic pt-1 border-t border-stone-800">
                                Affected: {data.itemsList}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="totalCost"
                      radius={[0, 6, 6, 0]}
                      onClick={(entry) => setHighlightedReason(entry.code)}
                      cursor="pointer"
                    >
                      {reasonAggregations.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={highlightedReason === entry.code ? '#b91c1c' : entry.color}
                          opacity={highlightedReason && highlightedReason !== entry.code ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut Chart & Category Composition */}
            <div className="lg:col-span-5 bg-stone-50/70 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200/80 dark:border-stone-700/80 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-amber-500" />
                  <span>Waste Distribution Share</span>
                </div>
                <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300">
                  ${totalPeriodWasteCost.toFixed(2)}
                </span>
              </div>
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonAggregations}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="totalCost"
                    >
                      {reasonAggregations.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Cost']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-stone-600 dark:text-stone-300 uppercase tracking-wider font-semibold">Total</span>
                  <span className="text-sm font-black text-stone-900 dark:text-white">${totalPeriodWasteCost.toFixed(0)}</span>
                </div>
              </div>

              {/* Mini Legend List */}
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
                {reasonAggregations.slice(0, 4).map((r) => (
                  <div
                    key={r.code}
                    onClick={() => setHighlightedReason(highlightedReason === r.code ? null : r.code)}
                    className={`p-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      highlightedReason === r.code
                        ? 'bg-red-100 dark:bg-red-950/70 font-bold'
                        : 'hover:bg-stone-200/50 dark:hover:bg-stone-700/50 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="truncate">{r.label}</span>
                    </div>
                    <div className="font-mono font-semibold shrink-0">
                      ${r.totalCost.toFixed(2)} ({r.percentage.toFixed(0)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reason Deep-Dive List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                Reason Impact & Recurring Anomaly Breakdown
              </h4>
              {highlightedReason && (
                <button
                  type="button"
                  onClick={() => setHighlightedReason(null)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold"
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reasonAggregations
                .filter((r) => !highlightedReason || r.code === highlightedReason)
                .map((r) => (
                  <div
                    key={r.code}
                    className={`p-3.5 rounded-xl border transition-all ${
                      highlightedReason === r.code
                        ? 'bg-red-50/50 dark:bg-red-950/30 border-red-400 ring-2 ring-red-500/20'
                        : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/80 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <span
                          className="w-3 h-3 rounded-full mt-0.5 shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <div>
                          <div className="font-bold text-xs text-stone-900 dark:text-white flex items-center space-x-2">
                            <span>{r.label}</span>
                            {r.recurringAnomalies > 0 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-800">
                                {r.recurringAnomalies} ANOMALIES
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                            {REASON_METADATA[r.code]?.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <div className="text-xs font-bold text-stone-900 dark:text-white">
                          ${r.totalCost.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-stone-600 dark:text-stone-300">
                          {r.incidentCount} logs • {r.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-700/60 flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-300">
                      <span className="truncate">Items: {r.itemsList}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedIncidentModal(r.records[0])}
                        className="text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white font-bold flex items-center space-x-0.5 shrink-0 ml-2"
                      >
                        <span>View Logs</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Automated Category Threshold Monitor */}
      {activeViewMode === 'thresholds' && (
        <div className="p-5 space-y-6 animate-in fade-in duration-200">
          {/* Threshold Monitor Control & Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
              <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Total Inventory Valuation
              </div>
              <div className="text-xl font-black text-stone-900 dark:text-white font-mono">
                ${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-stone-500">
                Active stock baseline for threshold calculation
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                <span>Max Allowed per Category</span>
                <span className="font-mono font-bold">{thresholdPercentage}% Limit</span>
              </div>
              <div className="text-xl font-black text-amber-900 dark:text-amber-200 font-mono">
                ${((thresholdPercentage / 100) * totalInventoryValuation).toFixed(2)}
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-400">
                Any category waste above this triggers the amber highlight
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-1 ${
              isThresholdExceeded
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isThresholdExceeded ? 'text-rose-900 dark:text-rose-300' : 'text-emerald-900 dark:text-emerald-300'}>
                  Threshold Monitor Status
                </span>
                {isThresholdExceeded ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <div className="text-xl font-black font-mono">
                {isThresholdExceeded ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    {breachedCategories.length} Categories Exceeded
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    100% Compliant
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-600 dark:text-stone-400">
                {isThresholdExceeded
                  ? `+$${breachedCategories.reduce((sum, c) => sum + c.dollarOverLimit, 0).toFixed(2)} total cost over threshold limit`
                  : `All ${categoryWasteAnalysis.length} categories within safety limits`}
              </div>
            </div>
          </div>

          {/* Category-by-Category Threshold Progress List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Category Waste vs Total Inventory Cost Thresholds</span>
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Target threshold benchmark: <span className="font-bold text-amber-600 dark:text-amber-400">{thresholdPercentage}%</span> of total inventory cost (${((thresholdPercentage / 100) * totalInventoryValuation).toFixed(2)})
                </p>
              </div>

              {/* Quick Threshold Limit Presets */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-semibold text-stone-500">Preset Limit:</span>
                {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setThresholdPercentage(val)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      thresholdPercentage === val
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {categoryWasteAnalysis.map((cat) => {
                const maxPctScale = Math.max(thresholdPercentage * 1.6, ...categoryWasteAnalysis.map((c) => c.pctOfInventory), 2.5);
                const progressWidthPct = Math.min(100, (cat.pctOfInventory / maxPctScale) * 100);
                const thresholdLinePct = (thresholdPercentage / maxPctScale) * 100;

                return (
                  <div
                    key={cat.category}
                    className={`p-4 rounded-xl border transition-all ${
                      cat.isBreached
                        ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700/80 shadow-xs ring-1 ring-amber-400/20'
                        : 'bg-white dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className={`p-2 rounded-lg ${
                          cat.isBreached
                            ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-stone-900 dark:text-white">
                              {cat.category}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                              {cat.categoryGroup}
                            </span>
                            {cat.isBreached ? (
                              <span className="px-2 py-0.2 text-[9px] font-extrabold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-full border border-amber-300 dark:border-amber-700">
                                ⚠️ THRESHOLD EXCEEDED (+{cat.varianceAboveThresholdPct}%)
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full">
                                ✓ Compliant
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                            {cat.incidentCount} logged waste events • Items: {cat.itemsSummary}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 font-mono">
                        <div className="text-right">
                          <div className="text-xs font-black text-stone-900 dark:text-white">
                            ${cat.totalCost.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {cat.pctOfInventory}% of total inv
                          </div>
                        </div>

                        {cat.isBreached && (
                          <div className="text-right pl-3 border-l border-amber-200 dark:border-amber-800">
                            <div className="text-xs font-black text-red-600 dark:text-red-400">
                              +${cat.dollarOverLimit.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-amber-800 dark:text-amber-400 font-sans">
                              Over Limit
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Threshold Visual Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="relative w-full bg-stone-200 dark:bg-stone-700 h-3 rounded-full overflow-visible">
                        {/* Target Threshold Marker Line */}
                        <div
                          className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-stone-900 dark:bg-white z-10 shadow-xs"
                          style={{ left: `${thresholdLinePct}%` }}
                          title={`Threshold Limit: ${thresholdPercentage}%`}
                        />

                        {/* Progress Bar Fill */}
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.isBreached
                              ? 'bg-amber-500'
                              : cat.pctOfInventory >= thresholdPercentage * 0.75
                              ? 'bg-yellow-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${progressWidthPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                        <span>0.0%</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          Threshold: {thresholdPercentage}% (${cat.dollarThresholdLimit.toFixed(2)})
                        </span>
                        <span>{maxPctScale.toFixed(1)}% Scale</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 30-Day Waste Timeline Visualizer & Forecast Projection */}
      {activeViewMode === 'timeline' && (
        <div className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                  Daily Waste Dollar Trajectory &amp; 30-Day Forecast Model
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Linear Regression (y = {timelineRegressionAnalysis.slope}x + {timelineRegressionAnalysis.intercept})
                </span>
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5">
                Evaluates historical daily waste trajectory and projects next 30 days based on linear trend fitting
              </p>
            </div>

            {/* Toggle Forecast Line */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowForecast(!showForecast)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  showForecast
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{showForecast ? '30-Day Forecast Active' : 'Show 30-Day Forecast'}</span>
              </button>
            </div>
          </div>

          {/* Forecast & Regression Diagnostic Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
              <div className="text-[11px] font-medium text-stone-500">Daily Trajectory Slope</div>
              <div className="text-sm font-black font-mono flex items-center gap-1">
                {timelineRegressionAnalysis.slope >= 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">+{timelineRegressionAnalysis.slope.toFixed(2)}/day</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">{timelineRegressionAnalysis.slope.toFixed(2)}/day</span>
                )}
              </div>
              <div className="text-[10px] text-stone-500">
                {timelineRegressionAnalysis.trendDirection === 'increasing' ? 'Waste pace accelerating' : timelineRegressionAnalysis.trendDirection === 'decreasing' ? 'Waste pace improving' : 'Stable daily loss'}
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-1">
              <div className="text-[11px] font-medium text-blue-900 dark:text-blue-300">Projected 30-Day Cumulative Waste</div>
              <div className="text-sm font-black text-blue-700 dark:text-blue-300 font-mono">
                ${timelineRegressionAnalysis.projected30DayTotal.toFixed(2)}
              </div>
              <div className="text-[10px] text-blue-800 dark:text-blue-400">
                ${timelineRegressionAnalysis.avgDailyForecast.toFixed(2)}/day forecasted avg
              </div>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
              <div className="text-[11px] font-medium text-stone-500">Historical Avg Daily Loss</div>
              <div className="text-sm font-black text-stone-900 dark:text-white font-mono">
                ${(totalPeriodWasteCost / Math.max(1, timeHorizonDays)).toFixed(2)}/day
              </div>
              <div className="text-[10px] text-stone-500">
                Over past {timeHorizonDays} recorded days
              </div>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
              <div className="text-[11px] font-medium text-stone-500">Model Fit (R² Coefficient)</div>
              <div className="text-sm font-black text-stone-900 dark:text-white font-mono">
                R² = {timelineRegressionAnalysis.rSquared}
              </div>
              <div className="text-[10px] text-stone-500">
                {timelineRegressionAnalysis.rSquared > 0.4 ? 'Moderate correlation' : 'High day-to-day variance'}
              </div>
            </div>
          </div>

          <div className="h-72 w-full bg-stone-50/70 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200/80 dark:border-stone-700/80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={showForecast ? timelineRegressionAnalysis.combinedChartData : timelineRegressionAnalysis.historicalDays}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="wasteCostGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(val) => `$${val}`}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isForecastPoint = data.isForecast;
                      return (
                        <div className="bg-stone-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1.5 border border-stone-700 font-mono">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-red-400">{data.displayDate}</span>
                            {isForecastPoint ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/40 font-sans">
                                30D Forecast Projection
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 font-sans">
                                Actual Historical
                              </span>
                            )}
                          </div>

                          {data.cost !== null && (
                            <div className="flex justify-between gap-3 text-white">
                              <span>Actual Loss:</span>
                              <span className="font-bold text-red-400">${Number(data.cost).toFixed(2)}</span>
                            </div>
                          )}

                          {data.forecastCost !== null && isForecastPoint && (
                            <div className="flex justify-between gap-3 text-blue-300">
                              <span>Forecast Loss:</span>
                              <span className="font-bold font-mono">${Number(data.forecastCost).toFixed(2)}</span>
                            </div>
                          )}

                          <div className="flex justify-between gap-3 text-amber-300 text-[11px]">
                            <span>Linear Regression Fit:</span>
                            <span>${Number(data.trendLine).toFixed(2)}</span>
                          </div>

                          {!isForecastPoint && (
                            <div className="flex justify-between gap-3 text-stone-400 text-[11px]">
                              <span>Incidents:</span>
                              <span>{data.incidents} items</span>
                            </div>
                          )}

                          {data.topItem && !isForecastPoint && (
                            <div className="text-[10px] text-stone-400 italic pt-1 border-t border-stone-800">
                              Primary Item: {data.topItem}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                {/* Historical Waste Area */}
                <Area
                  type="monotone"
                  name="Historical Actual Loss ($)"
                  dataKey="cost"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#wasteCostGradient)"
                  connectNulls={false}
                />
                {/* Linear Regression Trend Line across historical */}
                <Line
                  type="monotone"
                  name="Linear Regression Fit ($)"
                  dataKey="trendLine"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
                {/* 30-Day Forecasted Projection Line */}
                {showForecast && (
                  <Line
                    type="monotone"
                    name="30-Day Forecast Projection ($)"
                    dataKey="forecastCost"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={{ r: 2.5, fill: '#3b82f6' }}
                    connectNulls={true}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Timeline Anomaly Callout Pins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Aug 21: Dairy Walk-in Temp Spike</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-1">
                Walk-in door unlatched overnight; cheese spoilage at 51°F ($17.33).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs">
              <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Aug 16: Grill Timer Battery Loss</span>
              </div>
              <p className="text-[11px] text-rose-800 dark:text-rose-400 mt-1">
                Over-seared USDA Prime Ribeye on 3-top during peak rush ($43.50).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span>Jul 28: Seafood Ice-Bed FIFO</span>
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-400 mt-1">
                Salmon placed on dry top shelf instead of ice bed ($33.60).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Recurring Operational Issues & SOP Action Center */}
      {activeViewMode === 'anomalies' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Manager Operational SOP Action Plans</span>
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                Identified recurring root causes across multiple shifts requiring station interventions
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 border border-rose-200 dark:border-rose-900">
              {recurringOperationalIssues.length} Recurring Issues
            </span>
          </div>

          <div className="space-y-3">
            {recurringOperationalIssues.map((issue) => {
              const isAcknowledged = acknowledgedIssues[issue.id];
              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isAcknowledged
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                      : issue.severity === 'high'
                      ? 'bg-white dark:bg-stone-800/70 border-rose-300 dark:border-rose-900/80 shadow-xs'
                      : 'bg-white dark:bg-stone-800/70 border-stone-200 dark:border-stone-700/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          issue.severity === 'high'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}>
                          {issue.severity.toUpperCase()} PRIORITY
                        </span>
                        <h5 className="font-bold text-xs text-stone-900 dark:text-white">
                          {issue.title}
                        </h5>
                        <span className="text-[10px] font-mono text-stone-600 dark:text-stone-300">
                          SKU: {issue.sku}
                        </span>
                      </div>

                      <div className="text-xs text-stone-700 dark:text-stone-300">
                        <span className="font-bold text-stone-900 dark:text-white">Root Cause:</span>{' '}
                        {issue.rootCauseSummary}
                      </div>

                      <div className="p-2.5 mt-2 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-900 dark:text-white">Manager SOP Action:</span>{' '}
                          {issue.managerSopRecommendation}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between shrink-0 gap-2 font-mono">
                      <div>
                        <div className="text-sm font-black text-stone-900 dark:text-white">
                          ${issue.totalLoss.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-stone-600 dark:text-stone-300">
                          {issue.incidentCount} logged incidents
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleAcknowledgeIssue(issue.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          isAcknowledged
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 shadow-xs'
                        }`}
                      >
                        {isAcknowledged ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>SOP Enacted</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Acknowledge SOP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Shift & Station Breakdown */}
      {activeViewMode === 'shifts' && (
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-white">
                Shift & Day-Part Waste Distribution
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                Identify operational bottlenecks during morning prep vs. dinner closing rushes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {shiftDistribution.map((shift) => (
              <div
                key={shift.name}
                className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {shift.name}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shift.color }} />
                </div>
                <div className="text-lg font-black text-stone-900 dark:text-white font-mono">
                  ${shift.cost.toFixed(2)}
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-300 flex items-center justify-between">
                  <span>{shift.count} recorded logs</span>
                  <span>{totalPeriodWasteCost > 0 ? ((shift.cost / totalPeriodWasteCost) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Department Grouping Breakdown */}
          <div className="bg-stone-50/70 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200/80 dark:border-stone-700/80 space-y-2">
            <h5 className="text-xs font-bold text-stone-900 dark:text-white">
              Loss by Station Department
            </h5>
            <div className="space-y-2">
              {['Back of House', 'Kitchen Prep & Dish', 'Bar & Beverage'].map((dept) => {
                const deptRecords = filteredRecords.filter((r) => r.department === dept);
                const deptCost = deptRecords.reduce((sum, r) => sum + r.totalWasteCost, 0);
                const pct = totalPeriodWasteCost > 0 ? (deptCost / totalPeriodWasteCost) * 100 : 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-stone-800 dark:text-stone-200">
                      <span>{dept}</span>
                      <span className="font-mono">${deptCost.toFixed(2)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Incident Log Detail Modal */}
      {selectedIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                  Waste Incident Inspection
                </h4>
                <p className="text-xs text-stone-500 font-mono">
                  Record ID: {selectedIncidentModal.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncidentModal(null)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl space-y-1 font-mono">
                <div className="font-bold text-sm text-stone-900 dark:text-white">
                  {selectedIncidentModal.itemName}
                </div>
                <div className="text-stone-500">
                  SKU: {selectedIncidentModal.sku} • Category: {selectedIncidentModal.category}
                </div>
                <div className="text-red-600 dark:text-red-400 font-bold pt-1">
                  Wasted: {selectedIncidentModal.quantityWasted} {selectedIncidentModal.unitOfMeasure} @ ${selectedIncidentModal.unitCost.toFixed(2)} = ${selectedIncidentModal.totalWasteCost.toFixed(2)}
                </div>
              </div>

              <div>
                <span className="font-bold text-stone-700 dark:text-stone-300">Reason:</span>{' '}
                {REASON_METADATA[selectedIncidentModal.reasonCode]?.label}
              </div>
              <div>
                <span className="font-bold text-stone-700 dark:text-stone-300">Incident Description:</span>{' '}
                {selectedIncidentModal.reasonDescription || 'No description entered'}
              </div>
              <div>
                <span className="font-bold text-stone-700 dark:text-stone-300">Logged By:</span>{' '}
                {selectedIncidentModal.loggedByName} ({selectedIncidentModal.loggedByRole})
              </div>
              <div>
                <span className="font-bold text-stone-700 dark:text-stone-300">Corrective Action Taken:</span>{' '}
                {selectedIncidentModal.correctiveAction || 'None specified'}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIncidentModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
