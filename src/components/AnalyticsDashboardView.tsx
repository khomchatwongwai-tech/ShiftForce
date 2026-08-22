import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Zap,
  Target,
  Info,
  Search,
  Activity,
  UserX,
  ShieldCheck,
  Star,
  Award,
  Smile,
  ThumbsUp,
  Heart,
  Sliders,
  RefreshCw,
  MessageSquare,
  Gauge
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  Shift,
  Employee,
  Department,
  SupportedLanguage,
  TardinessRecord,
  RestaurantPerformanceScore,
  GuestReview,
  POSPlatformId,
  POSDepartmentMapping,
  DepartmentBudgetsMap,
  POSLaborAlert
} from '../types';
import { INITIAL_TARDINESS_LOG, INITIAL_RESTAURANT_PERFORMANCE_SCORE, INITIAL_GUEST_REVIEWS } from '../data/mockData';
import { INITIAL_POS_DEPARTMENT_MAPPINGS } from '../data/posMappingData';
import { POSDepartmentMappingModal } from './POSDepartmentMappingModal';
import { POSLaborSalesLiveTracker } from './POSLaborSalesLiveTracker';
import { POSLaborAlertSystem } from './POSLaborAlertSystem';
import { CertificationComplianceWidget } from './CertificationComplianceWidget';

interface AnalyticsDashboardViewProps {
  shifts: Shift[];
  employees: Employee[];
  weekDates: { dateStr: string; dayName: string; dayNumber: number; fullDate: Date }[];
  currentLanguage: SupportedLanguage;
  weeklySalesForecast?: number;
  tardinessLog?: TardinessRecord[];
  restaurantPerformanceScore?: RestaurantPerformanceScore;
  guestReviews?: GuestReview[];
  posMappings?: Record<POSPlatformId, POSDepartmentMapping>;
  onSavePOSMapping?: (updatedMapping: POSDepartmentMapping) => void;
  activePOSId?: POSPlatformId;
  onSelectActivePOS?: (posId: POSPlatformId) => void;
  onOpenPOSMappingModal?: () => void;
  departmentBudgets?: DepartmentBudgetsMap;
  onDispatchPOSLaborAlert?: (alert: POSLaborAlert) => void;
  onUpdateEmployee?: (updatedEmployee: Employee) => void;
}

// Helpers for time calculation
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function getShiftHours(shift: Shift): number {
  const start = parseTimeToMinutes(shift.startTime);
  let end = parseTimeToMinutes(shift.endTime);
  if (end < start) end += 24 * 60; // Overnight shift
  const grossMinutes = end - start;
  const netMinutes = Math.max(0, grossMinutes - (shift.breakMinutes || 0));
  return netMinutes / 60;
}

// Department Palette
const DEPARTMENT_COLORS: Record<Department, string> = {
  'Front of House': '#0284c7', // Sky Blue
  'Back of House': '#e11d48', // Rose
  'Bar & Beverage': '#7c3aed', // Violet
  'Kitchen Prep & Dish': '#d97706', // Amber
  'Management': '#059669', // Emerald
};

// Typical restaurant foot traffic patterns by hour (Covers / orders curve)
const HOURLY_TRAFFIC_PROFILE: Record<number, { name: string; weekdayCovers: number; weekendCovers: number }> = {
  6: { name: '6 AM', weekdayCovers: 8, weekendCovers: 12 },
  7: { name: '7 AM', weekdayCovers: 22, weekendCovers: 35 },
  8: { name: '8 AM', weekdayCovers: 45, weekendCovers: 65 },
  9: { name: '9 AM', weekdayCovers: 38, weekendCovers: 85 },
  10: { name: '10 AM', weekdayCovers: 30, weekendCovers: 90 },
  11: { name: '11 AM', weekdayCovers: 68, weekendCovers: 105 },
  12: { name: '12 PM', weekdayCovers: 110, weekendCovers: 145 },
  13: { name: '1 PM', weekdayCovers: 105, weekendCovers: 135 },
  14: { name: '2 PM', weekdayCovers: 52, weekendCovers: 80 },
  15: { name: '3 PM', weekdayCovers: 28, weekendCovers: 45 },
  16: { name: '4 PM', weekdayCovers: 35, weekendCovers: 55 },
  17: { name: '5 PM', weekdayCovers: 75, weekendCovers: 115 },
  18: { name: '6 PM', weekdayCovers: 135, weekendCovers: 185 },
  19: { name: '7 PM', weekdayCovers: 155, weekendCovers: 210 },
  20: { name: '8 PM', weekdayCovers: 140, weekendCovers: 195 },
  21: { name: '9 PM', weekdayCovers: 90, weekendCovers: 150 },
  22: { name: '10 PM', weekdayCovers: 50, weekendCovers: 95 },
  23: { name: '11 PM', weekdayCovers: 25, weekendCovers: 60 },
  0: { name: '12 AM', weekdayCovers: 12, weekendCovers: 30 },
  1: { name: '1 AM', weekdayCovers: 5, weekendCovers: 18 },
};

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  shifts,
  employees,
  weekDates,
  currentLanguage,
  weeklySalesForecast = 38500,
  tardinessLog,
  restaurantPerformanceScore = INITIAL_RESTAURANT_PERFORMANCE_SCORE,
  guestReviews = INITIAL_GUEST_REVIEWS,
  posMappings,
  onSavePOSMapping,
  activePOSId,
  onSelectActivePOS,
  onOpenPOSMappingModal,
  departmentBudgets,
  onDispatchPOSLaborAlert,
  onUpdateEmployee,
}) => {
  const t = translations[currentLanguage];

  // Filters and Interactive State
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all'); // 'all' or dateStr
  const [targetLaborRatio, setTargetLaborRatio] = useState<number>(30.0); // 30% standard target
  const [customSalesForecast, setCustomSalesForecast] = useState<number>(weeklySalesForecast);
  const [trafficDayType, setTrafficDayType] = useState<'all' | 'weekend' | 'weekday'>('all');
  const [overtimeFilter, setOvertimeFilter] = useState<'all' | 'overtime_only' | 'approaching'>('all');
  const [showThresholdAuditTable, setShowThresholdAuditTable] = useState<boolean>(true);

  // Reputation Score & Labor Productivity Correlation State
  const [reputationSubTab, setReputationSubTab] = useState<'correlation' | 'pillars' | 'servers' | 'simulation'>('correlation');
  const [reputationServiceWindow, setReputationServiceWindow] = useState<'all' | 'lunch_rush' | 'dinner_rush' | 'weekend'>('all');
  const [simulatedStaffDelta, setSimulatedStaffDelta] = useState<number>(0); // -2 to +3 staff
  const [selectedServerRole, setSelectedServerRole] = useState<'all' | 'Server' | 'Bartender'>('all');

  // Tardiness & Staffing Reliability State
  const [tardinessDeptFilter, setTardinessDeptFilter] = useState<Department | 'all'>('all');
  const [tardinessStatusFilter, setTardinessStatusFilter] = useState<'all' | 'late_only' | 'on_time'>('all');
  const [tardinessSearchQuery, setTardinessSearchQuery] = useState<string>('');
  const [showTardinessIncidentLog, setShowTardinessIncidentLog] = useState<boolean>(true);

  // POS Department Mapping & Live Efficiency State
  const [currentPOSMappings, setCurrentPOSMappings] = useState<Record<POSPlatformId, POSDepartmentMapping>>(
    posMappings || INITIAL_POS_DEPARTMENT_MAPPINGS
  );
  const [currentActivePOSId, setCurrentActivePOSId] = useState<POSPlatformId>(activePOSId || 'toast');
  const [isMappingModalOpen, setIsMappingModalOpen] = useState<boolean>(false);

  // Keep internal state in sync if external props update
  React.useEffect(() => {
    if (posMappings) {
      setCurrentPOSMappings(posMappings);
    }
  }, [posMappings]);

  React.useEffect(() => {
    if (activePOSId) {
      setCurrentActivePOSId(activePOSId);
    }
  }, [activePOSId]);

  const handleSaveInternalMapping = (updated: POSDepartmentMapping) => {
    setCurrentPOSMappings(prev => ({
      ...prev,
      [updated.posPlatformId]: updated
    }));
    if (onSavePOSMapping) {
      onSavePOSMapping(updated);
    }
  };

  const handleSelectInternalPOS = (posId: POSPlatformId) => {
    setCurrentActivePOSId(posId);
    if (onSelectActivePOS) {
      onSelectActivePOS(posId);
    }
  };

  // Filtered shifts based on department selection
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      if (selectedDepartment !== 'all' && s.department !== selectedDepartment) return false;
      if (selectedDayFilter !== 'all' && s.date !== selectedDayFilter) return false;
      return true;
    });
  }, [shifts, selectedDepartment, selectedDayFilter]);

  // Daily distribution of sales target (Mon through Sun distribution weights)
  const dailySalesWeights: Record<string, number> = {
    Monday: 0.10,
    Tuesday: 0.11,
    Wednesday: 0.12,
    Thursday: 0.14,
    Friday: 0.20,
    Saturday: 0.22,
    Sunday: 0.11,
  };

  // 1. COMPUTATION: Daily Labor Cost Trends & Sales Alignment
  const dailyLaborTrendData = useMemo(() => {
    return weekDates.map((wd) => {
      const dayShifts = shifts.filter(s => s.date === wd.dateStr);
      const filteredDayShifts = filteredShifts.filter(s => s.date === wd.dateStr);

      const totalHours = dayShifts.reduce((sum, s) => sum + getShiftHours(s), 0);
      const filteredHours = filteredDayShifts.reduce((sum, s) => sum + getShiftHours(s), 0);

      const totalLaborCost = dayShifts.reduce((sum, s) => {
        const hrs = getShiftHours(s);
        const wage = s.hourlyWage || 20;
        return sum + hrs * wage;
      }, 0);

      const filteredLaborCost = filteredDayShifts.reduce((sum, s) => {
        const hrs = getShiftHours(s);
        const wage = s.hourlyWage || 20;
        return sum + hrs * wage;
      }, 0);

      // Dept breakdown for this day
      const fohCost = dayShifts.filter(s => s.department === 'Front of House').reduce((acc, s) => acc + getShiftHours(s) * s.hourlyWage, 0);
      const bohCost = dayShifts.filter(s => s.department === 'Back of House').reduce((acc, s) => acc + getShiftHours(s) * s.hourlyWage, 0);
      const barCost = dayShifts.filter(s => s.department === 'Bar & Beverage').reduce((acc, s) => acc + getShiftHours(s) * s.hourlyWage, 0);
      const prepCost = dayShifts.filter(s => s.department === 'Kitchen Prep & Dish').reduce((acc, s) => acc + getShiftHours(s) * s.hourlyWage, 0);
      const mgmtCost = dayShifts.filter(s => s.department === 'Management').reduce((acc, s) => acc + getShiftHours(s) * s.hourlyWage, 0);

      // Daily projected revenue based on weight
      const weight = dailySalesWeights[wd.dayName] || (1 / 7);
      const daySales = customSalesForecast * weight;
      const laborPct = daySales > 0 ? (totalLaborCost / daySales) * 100 : 0;
      const targetCost = daySales * (targetLaborRatio / 100);
      const varianceCost = totalLaborCost - targetCost;

      return {
        dateStr: wd.dateStr,
        dayName: wd.dayName,
        dayNumber: wd.dayNumber,
        label: `${wd.dayName.slice(0, 3)} ${wd.dayNumber}`,
        laborCost: Math.round(totalLaborCost),
        filteredLaborCost: Math.round(filteredLaborCost),
        hours: Number(totalHours.toFixed(1)),
        filteredHours: Number(filteredHours.toFixed(1)),
        projectedSales: Math.round(daySales),
        laborPct: Number(laborPct.toFixed(1)),
        targetLaborPct: targetLaborRatio,
        targetCost: Math.round(targetCost),
        varianceCost: Math.round(varianceCost),
        fohCost: Math.round(fohCost),
        bohCost: Math.round(bohCost),
        barCost: Math.round(barCost),
        prepCost: Math.round(prepCost),
        mgmtCost: Math.round(mgmtCost),
      };
    });
  }, [weekDates, shifts, filteredShifts, customSalesForecast, targetLaborRatio]);

  // Overall totals across the selected week
  const overallMetrics = useMemo(() => {
    let totalScheduledHours = 0;
    let totalLaborCost = 0;
    let overtimeHoursTotal = 0;
    let overtimeCostTotal = 0;

    // Per-employee calculation for overtime (>40h)
    const empHoursMap: Record<string, { employee: Employee; hours: number; grossWage: number; regularWage: number }> = {};

    employees.forEach(emp => {
      empHoursMap[emp.id] = { employee: emp, hours: 0, grossWage: 0, regularWage: emp.hourlyWage };
    });

    shifts.forEach(shift => {
      const hrs = getShiftHours(shift);
      const wage = shift.hourlyWage || 20;
      totalScheduledHours += hrs;
      totalLaborCost += hrs * wage;

      if (empHoursMap[shift.employeeId]) {
        empHoursMap[shift.employeeId].hours += hrs;
      }
    });

    const employeeOvertimeList: Array<{
      employee: Employee;
      totalHours: number;
      regularHours: number;
      overtimeHours: number;
      regularPay: number;
      overtimePay: number;
      totalPay: number;
      status: 'safe' | 'approaching' | 'overtime';
    }> = [];

    Object.values(empHoursMap).forEach(({ employee, hours }) => {
      const regWage = employee.hourlyWage || 20;
      const otWage = regWage * 1.5;
      const regularHours = Math.min(40, hours);
      const overtimeHours = Math.max(0, hours - 40);

      const regularPay = regularHours * regWage;
      const overtimePay = overtimeHours * otWage;
      const totalPay = regularPay + overtimePay;

      if (overtimeHours > 0) {
        overtimeHoursTotal += overtimeHours;
        overtimeCostTotal += overtimePay;
      }

      let status: 'safe' | 'approaching' | 'overtime' = 'safe';
      if (hours > 40) status = 'overtime';
      else if (hours >= 36) status = 'approaching';

      if (hours > 0) {
        employeeOvertimeList.push({
          employee,
          totalHours: Number(hours.toFixed(1)),
          regularHours: Number(regularHours.toFixed(1)),
          overtimeHours: Number(overtimeHours.toFixed(1)),
          regularPay: Math.round(regularPay),
          overtimePay: Math.round(overtimePay),
          totalPay: Math.round(totalPay),
          status,
        });
      }
    });

    // Sort by hours descending
    employeeOvertimeList.sort((a, b) => b.totalHours - a.totalHours);

    const actualLaborPct = customSalesForecast > 0 ? (totalLaborCost / customSalesForecast) * 100 : 0;
    const targetCost = customSalesForecast * (targetLaborRatio / 100);
    const varianceVsTarget = totalLaborCost - targetCost;

    return {
      totalScheduledHours: Number(totalScheduledHours.toFixed(1)),
      totalLaborCost: Math.round(totalLaborCost),
      actualLaborPct: Number(actualLaborPct.toFixed(1)),
      targetCost: Math.round(targetCost),
      varianceVsTarget: Math.round(varianceVsTarget),
      overtimeHoursTotal: Number(overtimeHoursTotal.toFixed(1)),
      overtimeCostTotal: Math.round(overtimeCostTotal),
      employeeOvertimeList,
      overtimeCount: employeeOvertimeList.filter(e => e.status === 'overtime').length,
      approachingCount: employeeOvertimeList.filter(e => e.status === 'approaching').length,
      activeStaffCount: employeeOvertimeList.length,
      avgHourlyWage: totalScheduledHours > 0 ? (totalLaborCost / totalScheduledHours) : 0,
    };
  }, [shifts, employees, customSalesForecast, targetLaborRatio]);

  // 2. COMPUTATION: Peak Traffic Hours vs Active Staffing Levels
  const hourlyStaffingVsTrafficData = useMemo(() => {
    // Generate hours 6 through 23, and 0 to 1
    const hoursSeq = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];

    // Compute average active staff per hour across the schedule
    return hoursSeq.map(hour => {
      const profile = HOURLY_TRAFFIC_PROFILE[hour] || { name: `${hour}:00`, weekdayCovers: 20, weekendCovers: 30 };

      let expectedCovers = profile.weekdayCovers;
      if (trafficDayType === 'weekend') expectedCovers = profile.weekendCovers;
      else if (trafficDayType === 'all') expectedCovers = Math.round((profile.weekdayCovers * 5 + profile.weekendCovers * 2) / 7);

      // Check how many staff are active at this specific hour across all 7 days
      let activeStaffTotal = 0;
      let activeFOH = 0;
      let activeBOH = 0;
      let activeBar = 0;

      // Filter shifts to consider
      const shiftsToExamine = selectedDayFilter === 'all'
        ? shifts
        : shifts.filter(s => s.date === selectedDayFilter);

      const divisor = selectedDayFilter === 'all' ? weekDates.length || 1 : 1;

      shiftsToExamine.forEach(shift => {
        const startMin = parseTimeToMinutes(shift.startTime);
        let endMin = parseTimeToMinutes(shift.endTime);
        if (endMin < startMin) endMin += 24 * 60; // Overnight

        // Convert current hour to minutes
        const currentMin = hour * 60;
        const currentMinAlt = (hour < 6 ? hour + 24 : hour) * 60;

        // Is shift active during this hour?
        const isActive = (currentMin >= startMin && currentMin < endMin) ||
                         (currentMinAlt >= startMin && currentMinAlt < endMin);

        if (isActive) {
          activeStaffTotal += 1;
          if (shift.department === 'Front of House') activeFOH += 1;
          if (shift.department === 'Back of House' || shift.department === 'Kitchen Prep & Dish') activeBOH += 1;
          if (shift.department === 'Bar & Beverage') activeBar += 1;
        }
      });

      const avgActiveStaff = Number((activeStaffTotal / divisor).toFixed(1));
      const avgFOH = Number((activeFOH / divisor).toFixed(1));
      const avgBOH = Number((activeBOH / divisor).toFixed(1));
      const avgBar = Number((activeBar / divisor).toFixed(1));

      // Ideal staffing formula: roughly 1 staff per 14-16 covers during rush, minimum 3 baseline
      const recommendedStaff = Math.max(2, Math.round(expectedCovers / 14));
      const coverageRatio = recommendedStaff > 0 ? (avgActiveStaff / recommendedStaff) * 100 : 100;

      let rushType = 'Normal';
      if (hour >= 11 && hour <= 14) rushType = 'Lunch Rush';
      else if (hour >= 17 && hour <= 21) rushType = 'Dinner Rush';
      else if (hour >= 22 || hour <= 2) rushType = 'Late Night';

      return {
        hour,
        hourLabel: profile.name,
        expectedCovers,
        activeStaff: avgActiveStaff,
        fohStaff: avgFOH,
        bohStaff: avgBOH,
        barStaff: avgBar,
        recommendedStaff,
        coverageRatio: Math.round(coverageRatio),
        rushType,
      };
    });
  }, [shifts, selectedDayFilter, trafficDayType, weekDates]);

  // 3. COMPUTATION: Department Breakdown Data
  const departmentBreakdownData = useMemo(() => {
    const deptMap: Record<Department, { name: Department; hours: number; cost: number; shiftCount: number }> = {
      'Front of House': { name: 'Front of House', hours: 0, cost: 0, shiftCount: 0 },
      'Back of House': { name: 'Back of House', hours: 0, cost: 0, shiftCount: 0 },
      'Bar & Beverage': { name: 'Bar & Beverage', hours: 0, cost: 0, shiftCount: 0 },
      'Kitchen Prep & Dish': { name: 'Kitchen Prep & Dish', hours: 0, cost: 0, shiftCount: 0 },
      'Management': { name: 'Management', hours: 0, cost: 0, shiftCount: 0 },
    };

    shifts.forEach(s => {
      const hrs = getShiftHours(s);
      const wage = s.hourlyWage || 20;
      if (deptMap[s.department]) {
        deptMap[s.department].hours += hrs;
        deptMap[s.department].cost += hrs * wage;
        deptMap[s.department].shiftCount += 1;
      }
    });

    const totalCost = Object.values(deptMap).reduce((acc, d) => acc + d.cost, 0);

    return Object.values(deptMap).map(d => ({
      ...d,
      hours: Number(d.hours.toFixed(1)),
      cost: Math.round(d.cost),
      pctOfTotal: totalCost > 0 ? Number(((d.cost / totalCost) * 100).toFixed(1)) : 0,
      color: DEPARTMENT_COLORS[d.name],
    }));
  }, [shifts]);

  // Filtered overtime list for display
  const filteredOvertimeList = useMemo(() => {
    return overallMetrics.employeeOvertimeList.filter(e => {
      if (overtimeFilter === 'overtime_only') return e.status === 'overtime';
      if (overtimeFilter === 'approaching') return e.status === 'approaching';
      return true;
    });
  }, [overallMetrics.employeeOvertimeList, overtimeFilter]);

  // 3.5 COMPUTATION: Reputation Score & Labor Productivity Correlation Analytics
  const reputationAnalytics = useMemo(() => {
    const perf = restaurantPerformanceScore || INITIAL_RESTAURANT_PERFORMANCE_SCORE;
    const reviews = guestReviews || INITIAL_GUEST_REVIEWS;

    // Daily Correlation Trend Data (Comparing SPLH, Labor %, Covers/hr with Daily Reputation & Ratings)
    const dailyData = weekDates.map((wd) => {
      const dayShifts = shifts.filter(s => s.date === wd.dateStr);
      const totalHours = dayShifts.reduce((sum, s) => sum + getShiftHours(s), 0);
      const laborCost = dayShifts.reduce((sum, s) => sum + getShiftHours(s) * (s.hourlyWage || 20), 0);

      const weight = dailySalesWeights[wd.dayName] || (1 / 7);
      const daySales = customSalesForecast * weight;
      const splh = totalHours > 0 ? Math.round(daySales / totalHours) : 0; // Sales Per Labor Hour ($)
      const laborPct = daySales > 0 ? Number(((laborCost / daySales) * 100).toFixed(1)) : 0;

      // Estimated daily guest covers (traffic volume)
      const isWeekend = wd.dayName === 'Friday' || wd.dayName === 'Saturday' || wd.dayName === 'Sunday';
      const covers = isWeekend ? Math.round(520 + (daySales / 60)) : Math.round(280 + (daySales / 80));
      const coversPerLaborHour = totalHours > 0 ? Number((covers / totalHours).toFixed(1)) : 0;
      const activeStaffCount = dayShifts.length;

      // Correlate Labor Productivity with Daily Reputation Index (0 - 100)
      // Sweet spot: SPLH between $105 and $135, Labor % between 27% and 31%
      let dailyReputationScore = perf.overallScore; // Base: 96
      let status: 'optimal_sweet_spot' | 'lean_risk' | 'heavy_labor' = 'optimal_sweet_spot';
      let correlationInsight = 'Labor productivity in optimal 5-star hospitality zone.';

      if (splh > 140 || laborPct < 26) {
        // Understaffed / overstretched staff: service bottleneck drag
        dailyReputationScore = Math.max(86, perf.overallScore - Math.round((splh - 135) * 0.4) - (laborPct < 26 ? 3 : 0));
        status = 'lean_risk';
        correlationInsight = `High SPLH ($${splh}/hr) indicates lean staffing; slight risk of table turn delays.`;
      } else if (splh < 95 || laborPct > 34) {
        // High labor cost / slightly overstaffed
        dailyReputationScore = Math.min(99, perf.overallScore + 1);
        status = 'heavy_labor';
        correlationInsight = `High staff attentiveness (98% satisfaction), but labor ratio (${laborPct}%) exceeds target.`;
      } else {
        // Optimal sweet spot
        dailyReputationScore = Math.min(100, Math.max(95, Math.round(perf.overallScore + (isWeekend ? 1.5 : 0.5))));
        status = 'optimal_sweet_spot';
        correlationInsight = `Peak efficiency ($${splh} SPLH & ${laborPct}% labor) maximizes 5-star diner reviews.`;
      }

      const starRating = Number((dailyReputationScore / 20).toFixed(2));
      const guestDelightIndex = Math.min(100, Math.round(dailyReputationScore * 1.015));
      const estimatedReviewsCount = Math.max(6, Math.round(covers * 0.06));
      const fiveStarSharePct = Math.min(99, Math.round(84 + (dailyReputationScore - 90) * 1.5));

      return {
        dateStr: wd.dateStr,
        dayName: wd.dayName,
        dayNumber: wd.dayNumber,
        label: `${wd.dayName.slice(0, 3)} ${wd.dayNumber}`,
        sales: Math.round(daySales),
        laborCost: Math.round(laborCost),
        hours: Number(totalHours.toFixed(1)),
        splh, // Sales per labor hour ($/hr)
        laborPct, // Labor %
        covers,
        coversPerLaborHour,
        activeStaffCount,
        reputationScore: dailyReputationScore,
        starRating,
        guestDelightIndex,
        estimatedReviewsCount,
        fiveStarSharePct,
        status,
        correlationInsight,
      };
    });

    // Multi-Pillar Performance Radar Profile Data
    const pillarData = [
      { pillar: 'Hospitality & Delight', currentScore: perf.hospitalityDelightScore, industryBenchmark: 88, fullMark: 100 },
      { pillar: 'Service Velocity & Turns', currentScore: 95, industryBenchmark: 86, fullMark: 100 },
      { pillar: 'Food & Drink Precision', currentScore: perf.foodAndCocktailQualityScore, industryBenchmark: 90, fullMark: 100 },
      { pillar: 'Labor Productivity (SPLH)', currentScore: perf.laborBudgetEfficiencyScore, industryBenchmark: 85, fullMark: 100 },
      { pillar: 'Staff Punctuality & Readiness', currentScore: 92, industryBenchmark: 84, fullMark: 100 },
      { pillar: 'Compliance & Food Safety', currentScore: perf.foodAndAlcoholComplianceScore, industryBenchmark: 92, fullMark: 100 },
    ];

    // Server & Station Productivity vs 5-Star Guest Mentions
    const fohAndBarStaff = employees.filter(e => e.department === 'Front of House' || e.department === 'Bar & Beverage');
    const serverProductivityList = fohAndBarStaff.map(emp => {
      const empShifts = shifts.filter(s => s.employeeId === emp.id);
      const totalHours = empShifts.reduce((sum, s) => sum + getShiftHours(s), 0);
      const shiftCount = empShifts.length;

      // Calculate review mentions from mock reviews
      const nameParts = emp.name.toLowerCase().split(' ');
      const reviewMentions = reviews.filter(r =>
        (r.mentionedEmployeeIds && r.mentionedEmployeeIds.includes(emp.id)) ||
        (r.mentionedEmployeeNames && r.mentionedEmployeeNames.some(n => nameParts.some(part => n.toLowerCase().includes(part))))
      ).length;

      // Simulated sales per hour & table turn velocity based on role & hourly wage
      const baseSplh = emp.role.includes('Bartender') ? 165 : emp.role.includes('Lead') ? 155 : 138;
      const salesPerHour = Math.round(baseSplh + (emp.hourlyWage - 18) * 3);
      const totalGeneratedSales = Math.round(salesPerHour * (totalHours || 28));
      const avgTableTurnMins = emp.role.includes('Bartender') ? 35 : emp.role.includes('Lead') ? 46 : 50;
      const guestRating = Number((4.85 + Math.min(0.15, reviewMentions * 0.05)).toFixed(2));
      const tipEfficiencyPct = Number((22.4 + (reviewMentions * 0.6)).toFixed(1));

      let tier: 'Master Producer' | 'High Performer' | 'Rising Star' = 'Rising Star';
      if (reviewMentions >= 2 || salesPerHour >= 150) tier = 'Master Producer';
      else if (reviewMentions >= 1 || salesPerHour >= 135) tier = 'High Performer';

      return {
        employee: emp,
        shiftCount,
        totalHours: Number(totalHours.toFixed(1)),
        salesPerHour,
        totalGeneratedSales,
        avgTableTurnMins,
        reviewMentions,
        guestRating,
        tipEfficiencyPct,
        tier,
      };
    }).sort((a, b) => b.reviewMentions - a.reviewMentions || b.salesPerHour - a.salesPerHour);

    // Filter server productivity list based on selectedServerRole
    const filteredServerProductivityList = serverProductivityList.filter(s => {
      if (selectedServerRole === 'Server') return s.employee.role.toLowerCase().includes('server') || s.employee.role.toLowerCase().includes('lead');
      if (selectedServerRole === 'Bartender') return s.employee.role.toLowerCase().includes('bartender') || s.employee.department === 'Bar & Beverage';
      return true;
    });

    // Aggregate Summary Averages
    const avgSplh = dailyData.length > 0 ? Math.round(dailyData.reduce((s, d) => s + d.splh, 0) / dailyData.length) : 118;
    const avgReputation = dailyData.length > 0 ? Number((dailyData.reduce((s, d) => s + d.reputationScore, 0) / dailyData.length).toFixed(1)) : 96.4;
    const avgStarRating = Number((avgReputation / 20).toFixed(2));
    const sweetSpotShiftsCount = dailyData.filter(d => d.status === 'optimal_sweet_spot').length;
    const sweetSpotPct = Math.round((sweetSpotShiftsCount / (dailyData.length || 1)) * 100);

    // Interactive Staffing Level Simulation Calculator
    const baseWeeklyHours = overallMetrics.totalScheduledHours || 320;
    const simulatedHours = Math.max(120, baseWeeklyHours + simulatedStaffDelta * 32);
    const avgWage = overallMetrics.avgHourlyWage || 21;
    const simulatedLaborCost = Math.round(simulatedHours * avgWage);
    const simulatedLaborPct = customSalesForecast > 0 ? Number(((simulatedLaborCost / customSalesForecast) * 100).toFixed(1)) : 0;
    const simulatedSplh = simulatedHours > 0 ? Math.round(customSalesForecast / simulatedHours) : 0;

    let simulatedReputationScore = perf.overallScore;
    let simulatedGuestWaitChange = '0 min (baseline)';
    let simulationAdvice = 'Current schedule operates in the optimal 5-star reputation zone.';

    if (simulatedStaffDelta > 0) {
      simulatedReputationScore = Math.min(99.6, Number((perf.overallScore + simulatedStaffDelta * 1.1).toFixed(1)));
      simulatedGuestWaitChange = `-${simulatedStaffDelta * 4} mins faster table turns`;
      simulationAdvice = `Adding +${simulatedStaffDelta} staff accelerates guest seating & reduces kitchen ticket latency, lifting reputation score to ${simulatedReputationScore}/100.`;
    } else if (simulatedStaffDelta < 0) {
      simulatedReputationScore = Math.max(84, Number((perf.overallScore + simulatedStaffDelta * 3.4).toFixed(1)));
      simulatedGuestWaitChange = `+${Math.abs(simulatedStaffDelta) * 7} mins longer wait times`;
      simulationAdvice = `Cutting ${Math.abs(simulatedStaffDelta)} staff saves $${Math.abs(simulatedStaffDelta * 32 * avgWage).toLocaleString()} in payroll, but risks dropping guest ratings from ${avgStarRating}★ to ${(simulatedReputationScore / 20).toFixed(2)}★.`;
    }

    const estimatedMonthlyRepeatRevenueLift = Math.round((avgReputation / 100) * 3500);

    return {
      perf,
      reviews,
      dailyData,
      pillarData,
      serverProductivityList,
      filteredServerProductivityList,
      avgSplh,
      avgReputation,
      avgStarRating,
      sweetSpotPct,
      estimatedMonthlyRepeatRevenueLift,
      simulation: {
        simulatedHours: Number(simulatedHours.toFixed(1)),
        simulatedLaborCost,
        simulatedLaborPct,
        simulatedSplh,
        simulatedReputationScore,
        simulatedStarRating: Number((simulatedReputationScore / 20).toFixed(2)),
        simulatedGuestWaitChange,
        simulationAdvice,
        laborCostDelta: simulatedLaborCost - overallMetrics.totalLaborCost,
      }
    };
  }, [weekDates, shifts, employees, customSalesForecast, targetLaborRatio, restaurantPerformanceScore, guestReviews, overallMetrics, simulatedStaffDelta, selectedServerRole]);

  // 4. COMPUTATION: Department Tardiness Frequency & Staffing Reliability Analytics
  const departmentTardinessAnalytics = useMemo(() => {
    const sourceLogs = (tardinessLog && tardinessLog.length > 0) ? tardinessLog : INITIAL_TARDINESS_LOG;
    const employeeMap = new Map<string, Employee>();
    employees.forEach(e => employeeMap.set(e.id, e));

    const departments: Department[] = [
      'Kitchen Prep & Dish',
      'Bar & Beverage',
      'Back of House',
      'Front of House',
      'Management',
    ];

    const deptMap: Record<Department, {
      department: Department;
      color: string;
      totalAuditedRecords: number;
      tardyCount: number;
      onTimeCount: number;
      excusedCount: number;
      totalLateMinutes: number;
      avgLateMinutes: number;
      maxLateMinutes: number;
      tardinessFrequencyPct: number;
      onTimeRatePct: number;
      recurringIssueSummary: string;
      actionAdvice: string;
      riskLevel: 'critical' | 'moderate' | 'healthy';
      peakTimeSlot: string;
      records: (TardinessRecord & { employeeRole?: string; employeeDept?: Department; avatarUrl?: string })[];
    }> = {
      'Kitchen Prep & Dish': {
        department: 'Kitchen Prep & Dish',
        color: '#d97706',
        totalAuditedRecords: 0,
        tardyCount: 0,
        onTimeCount: 0,
        excusedCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
        maxLateMinutes: 0,
        tardinessFrequencyPct: 0,
        onTimeRatePct: 100,
        recurringIssueSummary: 'Frequent morning delays (08:00 AM) due to public transit bus line 44 schedule mismatch.',
        actionAdvice: 'Adjust morning prep call-time to 08:15 AM or trigger automated WhatsApp 24h & 1h countdown alerts.',
        riskLevel: 'critical',
        peakTimeSlot: 'Morning Prep (08:00)',
        records: [],
      },
      'Bar & Beverage': {
        department: 'Bar & Beverage',
        color: '#7c3aed',
        totalAuditedRecords: 0,
        tardyCount: 0,
        onTimeCount: 0,
        excusedCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
        maxLateMinutes: 0,
        tardinessFrequencyPct: 0,
        onTimeRatePct: 100,
        recurringIssueSummary: 'Evening rush arrival delays (17:00 - 18:00) tied to weekend downtown parking garage congestion.',
        actionAdvice: 'Provide validated staff parking passes or stagger bar-prep clock-in times by 15 minutes before floor open.',
        riskLevel: 'moderate',
        peakTimeSlot: 'Evening Rush (17:00 - 18:00)',
        records: [],
      },
      'Back of House': {
        department: 'Back of House',
        color: '#e11d48',
        totalAuditedRecords: 0,
        tardyCount: 0,
        onTimeCount: 0,
        excusedCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
        maxLateMinutes: 0,
        tardinessFrequencyPct: 0,
        onTimeRatePct: 100,
        recurringIssueSummary: 'Intermittent line cook delay on dinner shifts (16:00) with prior manager notice.',
        actionAdvice: 'Maintain current 20-min pre-warning protocol; on-time rate remains within healthy operational limits.',
        riskLevel: 'healthy',
        peakTimeSlot: 'Dinner Prep (16:00)',
        records: [],
      },
      'Front of House': {
        department: 'Front of House',
        color: '#0284c7',
        totalAuditedRecords: 0,
        tardyCount: 0,
        onTimeCount: 0,
        excusedCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
        maxLateMinutes: 0,
        tardinessFrequencyPct: 0,
        onTimeRatePct: 100,
        recurringIssueSummary: 'Isolated traffic congestion delay on bridge route; strong overall floor punctuality.',
        actionAdvice: 'Exemplary floor punctuality (95%+ on-time score); maintain standard automated 24h schedule blast.',
        riskLevel: 'healthy',
        peakTimeSlot: 'Weekend Lunch (11:00)',
        records: [],
      },
      'Management': {
        department: 'Management',
        color: '#059669',
        totalAuditedRecords: 0,
        tardyCount: 0,
        onTimeCount: 0,
        excusedCount: 0,
        totalLateMinutes: 0,
        avgLateMinutes: 0,
        maxLateMinutes: 0,
        tardinessFrequencyPct: 0,
        onTimeRatePct: 100,
        recurringIssueSummary: '100% flawless on-time clock-in compliance across all management opening/closing shifts.',
        actionAdvice: 'Pristine leadership benchmark; continue lead oversight and shift audit logging.',
        riskLevel: 'healthy',
        peakTimeSlot: 'Open/Close Check',
        records: [],
      },
    };

    sourceLogs.forEach(rec => {
      const emp = employeeMap.get(rec.employeeId);
      const dept = (rec as any).department || emp?.department || 'Front of House';
      const enrichedRec = {
        ...rec,
        employeeRole: emp?.role || 'Staff',
        employeeDept: dept,
        avatarUrl: emp?.avatarUrl,
      };

      if (deptMap[dept]) {
        deptMap[dept].totalAuditedRecords += 1;
        deptMap[dept].records.push(enrichedRec);

        if (rec.status === 'late' || rec.status === 'no_show') {
          deptMap[dept].tardyCount += 1;
          deptMap[dept].totalLateMinutes += rec.lateMinutes;
          deptMap[dept].maxLateMinutes = Math.max(deptMap[dept].maxLateMinutes, rec.lateMinutes);
        } else if (rec.status === 'excused') {
          deptMap[dept].excusedCount += 1;
        } else {
          deptMap[dept].onTimeCount += 1;
        }
      }
    });

    const departmentList = departments.map(dName => {
      const item = deptMap[dName];
      const total = Math.max(item.totalAuditedRecords, 1);
      const freqPct = (item.tardyCount / total) * 100;
      const avgLate = item.tardyCount > 0 ? (item.totalLateMinutes / item.tardyCount) : 0;
      const onTimePct = Math.max(0, 100 - freqPct);

      let riskLevel: 'critical' | 'moderate' | 'healthy' = 'healthy';
      if (freqPct >= 20) riskLevel = 'critical';
      else if (freqPct >= 8) riskLevel = 'moderate';

      return {
        ...item,
        tardinessFrequencyPct: Number(freqPct.toFixed(1)),
        onTimeRatePct: Number(onTimePct.toFixed(1)),
        avgLateMinutes: Number(avgLate.toFixed(1)),
        riskLevel,
      };
    });

    // Overall restaurant metrics
    const totalRestaurantAudited = departmentList.reduce((acc, d) => acc + d.totalAuditedRecords, 0);
    const totalRestaurantTardy = departmentList.reduce((acc, d) => acc + d.tardyCount, 0);
    const totalRestaurantLostMin = departmentList.reduce((acc, d) => acc + d.totalLateMinutes, 0);
    const overallAvgFrequencyPct = totalRestaurantAudited > 0 ? (totalRestaurantTardy / totalRestaurantAudited) * 100 : 0;
    const overallAvgDelayMinutes = totalRestaurantTardy > 0 ? (totalRestaurantLostMin / totalRestaurantTardy) : 0;
    const highestTardinessDept = [...departmentList].sort((a, b) => b.tardinessFrequencyPct - a.tardinessFrequencyPct)[0];
    const healthyDeptsCount = departmentList.filter(d => d.riskLevel === 'healthy').length;

    // Filtered incident log
    const allEnrichedRecords = departmentList.flatMap(d => d.records);
    const filteredRecords = allEnrichedRecords.filter(rec => {
      if (tardinessDeptFilter !== 'all' && rec.employeeDept !== tardinessDeptFilter) return false;
      if (tardinessStatusFilter === 'late_only' && rec.status !== 'late' && rec.status !== 'no_show') return false;
      if (tardinessStatusFilter === 'on_time' && rec.status !== 'on_time') return false;
      if (tardinessSearchQuery.trim()) {
        const query = tardinessSearchQuery.toLowerCase();
        const matchName = rec.employeeName.toLowerCase().includes(query);
        const matchReason = (rec.reason || '').toLowerCase().includes(query);
        const matchNote = (rec.managerNote || '').toLowerCase().includes(query);
        const matchRole = (rec.employeeRole || '').toLowerCase().includes(query);
        if (!matchName && !matchReason && !matchNote && !matchRole) return false;
      }
      return true;
    });

    return {
      departmentList,
      totalRestaurantAudited,
      totalRestaurantTardy,
      totalRestaurantLostMin,
      overallAvgFrequencyPct: Number(overallAvgFrequencyPct.toFixed(1)),
      overallAvgDelayMinutes: Number(overallAvgDelayMinutes.toFixed(1)),
      highestTardinessDept,
      healthyDeptsCount,
      filteredRecords,
    };
  }, [tardinessLog, employees, tardinessDeptFilter, tardinessStatusFilter, tardinessSearchQuery]);

  // Export analytics summary to CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Day', 'Labor Cost ($)', 'Projected Sales ($)', 'Labor %', 'Hours', 'Variance vs Target ($)'],
      ...dailyLaborTrendData.map(d => [
        d.dateStr,
        d.dayName,
        d.laborCost,
        d.projectedSales,
        `${d.laborPct}%`,
        d.hours,
        d.varianceCost
      ]),
      [],
      ['Department Tardiness Analytics', 'Total Audited', 'Tardy Shifts', 'Tardiness Frequency (%)', 'On-Time Rate (%)', 'Avg Delay (min)', 'Risk Level', 'Peak Bottleneck Slot'],
      ...departmentTardinessAnalytics.departmentList.map(d => [
        d.department,
        d.totalAuditedRecords,
        d.tardyCount,
        `${d.tardinessFrequencyPct}%`,
        `${d.onTimeRatePct}%`,
        `${d.avgLateMinutes} min`,
        d.riskLevel.toUpperCase(),
        d.peakTimeSlot
      ]),
      [],
      ['Tardiness Audit Record', 'Department', 'Role', 'Date', 'Scheduled Time', 'Actual Clock-In', 'Delay (min)', 'Status', 'Root Cause Reason', 'Manager Note'],
      ...departmentTardinessAnalytics.filteredRecords.map(r => [
        r.employeeName,
        r.employeeDept,
        r.employeeRole,
        r.shiftDate,
        r.scheduledStartTime,
        r.actualClockInTime,
        r.lateMinutes,
        r.status,
        `"${(r.reason || 'Normal punctuality').replace(/"/g, '""')}"`,
        `"${(r.managerNote || '').replace(/"/g, '""')}"`
      ]),
      [],
      ['Employee Name', 'Department', 'Role', 'Regular Hours', 'Overtime Hours', 'Total Hours', 'Regular Pay ($)', 'Overtime Pay ($)', 'Total Pay ($)', 'Status'],
      ...overallMetrics.employeeOvertimeList.map(e => [
        e.employee.name,
        e.employee.department,
        e.employee.role,
        e.regularHours,
        e.overtimeHours,
        e.totalHours,
        e.regularPay,
        e.overtimePay,
        e.totalPay,
        e.status
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `workqora-analytics-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">

      {/* 1. TOP HEADER & INTERACTIVE CONTROLS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-sky-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">

        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-slate-900">
                Restaurant Labor &amp; Operational Analytics
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                Recharts Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive visualization of labor cost trends, peak customer traffic, and overtime exposure
            </p>
          </div>
        </div>

        {/* Right: Controls (Sales Target Adjuster, Target %, Export CSV) */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">

          {/* Target Labor % Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Target className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-600 font-medium hidden sm:inline">Labor Target:</span>
            <select
              value={targetLaborRatio}
              onChange={(e) => setTargetLaborRatio(Number(e.target.value))}
              className="bg-transparent font-bold text-sky-700 focus:outline-hidden cursor-pointer"
            >
              <option value={26}>26.0% (Ultra Lean)</option>
              <option value={28}>28.0% (Fast Casual)</option>
              <option value={30}>30.0% (Standard Benchmark)</option>
              <option value={32}>32.0% (Full Service)</option>
              <option value={35}>35.0% (Fine Dining)</option>
            </select>
          </div>

          {/* Forecasted Sales Input */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600 font-medium hidden sm:inline">Forecast Sales:</span>
            <input
              type="number"
              step="500"
              min="5000"
              max="200000"
              value={customSalesForecast}
              onChange={(e) => setCustomSalesForecast(Number(e.target.value) || 1)}
              className="w-20 font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs"
            />
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Download CSV Analytics Report"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Export CSV</span>
          </button>

        </div>

      </div>

      {/* 1.5 REAL-TIME POS LABOR ALERT MONITORING SYSTEM */}
      <POSLaborAlertSystem
        shifts={shifts}
        employees={employees}
        activePOSId={currentActivePOSId}
        posMappings={currentPOSMappings}
        departmentBudgets={departmentBudgets}
        targetLaborRatio={targetLaborRatio}
        onOpenMappingModal={() => {
          if (onOpenPOSMappingModal) {
            onOpenPOSMappingModal();
          } else {
            setIsMappingModalOpen(true);
          }
        }}
        onDispatchAlert={onDispatchPOSLaborAlert}
      />

      {/* 2. TOP KPI EXECUTIVE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Total Labor Cost & Variance */}
        <div className="bg-white rounded-2xl p-4.5 border border-sky-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">
              Total Labor Cost
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ${overallMetrics.totalLaborCost.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-2">
            {overallMetrics.varianceVsTarget <= 0 ? (
              <span className="text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="w-3 h-3" />
                ${Math.abs(overallMetrics.varianceVsTarget).toLocaleString()} under budget
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3 h-3" />
                ${overallMetrics.varianceVsTarget.toLocaleString()} over budget
              </span>
            )}
            <span className="text-slate-400">vs {targetLaborRatio}% goal</span>
          </div>
        </div>

        {/* Card 2: Labor % vs Sales */}
        <div className={`rounded-2xl p-4.5 border shadow-xs relative overflow-hidden transition-all ${
          overallMetrics.actualLaborPct > targetLaborRatio
            ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-300/30'
            : 'bg-white border-sky-100'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              Labor Cost Ratio
              {overallMetrics.actualLaborPct > targetLaborRatio && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              overallMetrics.actualLaborPct > targetLaborRatio ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-600'
            }`}>
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            <span className={overallMetrics.actualLaborPct > targetLaborRatio ? 'text-rose-700 font-black' : 'text-slate-900'}>
              {overallMetrics.actualLaborPct}%
            </span>
            <span className="text-xs font-normal text-slate-500">
              of ${customSalesForecast.toLocaleString()} sales
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-2">
            {overallMetrics.actualLaborPct <= targetLaborRatio ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Optimal profitability window
              </span>
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-1 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                {(overallMetrics.actualLaborPct - targetLaborRatio).toFixed(1)}% above target limit
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Total Scheduled Hours & Avg Wage */}
        <div className="bg-white rounded-2xl p-4.5 border border-sky-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider">
              Scheduled Hours
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {overallMetrics.totalScheduledHours} <span className="text-sm font-medium text-slate-500">hrs</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Across {overallMetrics.activeStaffCount} active staff</span>
            <span className="font-mono font-bold text-slate-700">
              Avg ${overallMetrics.avgHourlyWage.toFixed(2)}/hr
            </span>
          </div>
        </div>

        {/* Card 4: Overtime Exposure & 40h Threshold Status */}
        <div className={`rounded-2xl p-4.5 border shadow-xs relative overflow-hidden transition-all ${
          overallMetrics.overtimeCount > 0
            ? 'bg-gradient-to-br from-rose-50/90 via-red-50/40 to-white border-rose-300 ring-2 ring-rose-400/20'
            : 'bg-white border-sky-100'
        }`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Overtime (&gt;40h Limit)</span>
              {overallMetrics.overtimeCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              overallMetrics.overtimeCount > 0 ? 'bg-rose-100 text-rose-700 shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
            <span className={overallMetrics.overtimeCount > 0 ? 'text-rose-700' : 'text-slate-900'}>
              {overallMetrics.overtimeCount} Staff
            </span>
            {overallMetrics.overtimeCount > 0 ? (
              <span className="text-xs font-bold text-rose-700 font-mono bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                🚨 +{overallMetrics.overtimeHoursTotal}h Over Limit
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-full">
                ✅ Zero OT Violations
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-600 mt-2 flex items-center justify-between">
            <span>OT Penalty Cost: <strong className={overallMetrics.overtimeCostTotal > 0 ? 'text-rose-700' : 'text-slate-700'}>${overallMetrics.overtimeCostTotal.toLocaleString()}</strong></span>
            {overallMetrics.approachingCount > 0 && (
              <span className="text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                ⚠️ {overallMetrics.approachingCount} near 40h
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 2.5 DEDICATED 40-HOUR OVERTIME THRESHOLD WARNING BANNER (When OT exists) */}
      {overallMetrics.overtimeCount > 0 && (
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 rounded-2xl p-4 text-white shadow-md border border-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs uppercase tracking-wider bg-white text-rose-700 px-2 py-0.5 rounded-md shadow-xs">
                  40-Hour Weekly Threshold Alert
                </span>
                <span className="text-xs font-bold text-rose-100">
                  {overallMetrics.overtimeCount} Staff Exceeding 40h Limit (+{overallMetrics.overtimeHoursTotal}h OT Total)
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-1">
                Employees scheduled beyond 40 hours trigger 1.5x overtime wage penalties totaling <strong className="text-white font-mono">${overallMetrics.overtimeCostTotal.toLocaleString()}</strong>.
                Review the highlighted staff below to rebalance shifts or reallocate to part-time roster.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setOvertimeFilter('overtime_only')}
              className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Exceeding Staff ({overallMetrics.overtimeCount})</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. AI LABOR INTELLIGENCE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-4 text-white shadow-md border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wide text-amber-300">
                Workqora Smart Labor Insights:
              </span>
              <span className="px-2 py-0.2 text-[10px] bg-white/10 rounded font-mono text-slate-300">
                Live Audit
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {overallMetrics.overtimeCount > 0
                ? `⚠️ Detected ${overallMetrics.overtimeCount} employees with overtime violations costing $${overallMetrics.overtimeCostTotal}. Reassigning 8 hours to part-time roster can save ~$240.`
                : `✅ Zero overtime violations detected across current 7-day schedule. Labor ratio is operating at ${overallMetrics.actualLaborPct}%.`}
              {' '}Peak lunch (12-2 PM) and dinner (6-9 PM) coverage ratios are currently optimal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
            Efficiency: 94.8%
          </span>
        </div>
      </div>

      {/* POS LIVE LABOR-TO-SALES DEPARTMENT EFFICIENCY TRACKER */}
      <POSLaborSalesLiveTracker
        posMappings={currentPOSMappings}
        activePOSId={currentActivePOSId}
        onSelectPOS={handleSelectInternalPOS}
        onOpenMappingModal={() => {
          if (onOpenPOSMappingModal) {
            onOpenPOSMappingModal();
          } else {
            setIsMappingModalOpen(true);
          }
        }}
        shifts={shifts}
        employees={employees}
      />

      {/* 4. VISUALIZATION 1: DAILY LABOR COST TRENDS & SALES CORRELATION */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Daily Labor Cost Trends vs. Projected Sales
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Composed chart comparing daily labor costs ($), projected revenue ($), and labor % against target {targetLaborRatio}%
            </p>
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'Front of House', 'Back of House', 'Bar & Beverage', 'Kitchen Prep & Dish', 'Management'] as (Department | 'all')[]).map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedDepartment === dept
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {dept === 'all' ? 'All Depts' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Composed Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dailyLaborTrendData}
              margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
              />
              {/* Left Y Axis for Dollars ($) */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                tickLine={false}
              />
              {/* Right Y Axis for Labor % */}
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 50]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[200px]">
                        <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between">
                          <span>{data.dayName} ({data.dateStr})</span>
                          <span className="text-sky-400 font-mono">{data.hours} hrs</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Scheduled Labor:</span>
                          <span className="font-bold font-mono text-sky-300">${data.laborCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Projected Sales:</span>
                          <span className="font-bold font-mono text-emerald-300">${data.projectedSales.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Labor % Ratio:</span>
                          <span className={`font-bold font-mono ${data.laborPct <= targetLaborRatio ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {data.laborPct}%
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-700/80 text-[10px]">
                          <span className="text-slate-400">Budget Variance:</span>
                          <span className={`font-mono font-semibold ${data.varianceCost <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.varianceCost <= 0 ? `-$${Math.abs(data.varianceCost)} (Under)` : `+$${data.varianceCost} (Over)`}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
              />

              {/* Sales as soft background Area */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="projectedSales"
                name="Projected Sales ($)"
                fill="#e0f2fe"
                stroke="#38bdf8"
                strokeWidth={2}
                fillOpacity={0.4}
              />

              {/* Labor Cost as Primary Bar */}
              <Bar
                yAxisId="left"
                dataKey="laborCost"
                name="Labor Cost ($)"
                fill="#0284c7"
                radius={[6, 6, 0, 0]}
                barSize={32}
              />

              {/* Target Cost Line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="targetCost"
                name={`Target Cost (${targetLaborRatio}%)`}
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />

              {/* Labor % on Right Axis */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="laborPct"
                name="Labor % Ratio"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              />

              {/* Benchmark Reference line */}
              <ReferenceLine
                yAxisId="right"
                y={targetLaborRatio}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ value: `Goal ${targetLaborRatio}%`, fill: '#10b981', fontSize: 10, position: 'right' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Summary Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2 border-t border-slate-100 text-center">
          {dailyLaborTrendData.map((d) => (
            <div key={d.dateStr} className="p-2 bg-slate-50 rounded-xl">
              <div className="text-[11px] font-bold text-slate-700">{d.dayName.slice(0, 3)}</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">${d.laborCost}</div>
              <div className={`text-[10px] font-bold font-mono mt-0.5 ${d.laborPct <= targetLaborRatio ? 'text-emerald-700' : 'text-amber-700'}`}>
                {d.laborPct}%
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* 4.5 NEW VISUALIZATION: REPUTATION SCORE & LABOR PRODUCTIVITY CORRELATION */}
      <div id="analytics-reputation-score-section" className="bg-white rounded-2xl p-5 shadow-xs border border-amber-100 space-y-6">

        {/* Section Header with Live Rating Badges */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>Restaurant Reputation Score &amp; Labor Productivity Correlation</span>
                  <span className="px-2.5 py-0.5 text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full shadow-xs">
                    Grade {reputationAnalytics.perf.letterGrade} ({reputationAnalytics.avgReputation}/100)
                  </span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Recharts Analytics Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct correlation between guest review ratings (Google 4.9★, Yelp 4.8★) and labor productivity metrics (SPLH, labor cost %, table turn speed)
              </p>
            </div>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto self-start xl:self-center">
            <button
              id="rep-subtab-correlation"
              onClick={() => setReputationSubTab('correlation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reputationSubTab === 'correlation'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Daily Correlation (SPLH vs Score)</span>
            </button>

            <button
              id="rep-subtab-pillars"
              onClick={() => setReputationSubTab('pillars')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reputationSubTab === 'pillars'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>6-Pillar Radar</span>
            </button>

            <button
              id="rep-subtab-servers"
              onClick={() => setReputationSubTab('servers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reputationSubTab === 'servers'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Server Productivity &amp; Praise</span>
            </button>

            <button
              id="rep-subtab-simulation"
              onClick={() => setReputationSubTab('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                reputationSubTab === 'simulation'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Staffing Simulator</span>
            </button>
          </div>
        </div>

        {/* Top 4 Diagnostic Correlation KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

          {/* Card 1: Composite Reputation Score & Star Ratings */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Composite Reputation Index</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {reputationAnalytics.avgReputation}
              </span>
              <span className="text-xs font-bold text-amber-700 font-mono">
                / 100 ({reputationAnalytics.avgStarRating}★ Avg)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-amber-200/60 pt-1.5">
              <span>Google 4.9★ • Yelp 4.8★</span>
              <span className="font-mono text-emerald-700 font-bold">1,457+ Reviews</span>
            </div>
          </div>

          {/* Card 2: Sales Per Labor Hour (SPLH Productivity) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Avg Sales / Labor Hour (SPLH)</span>
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                ${reputationAnalytics.avgSplh}
              </span>
              <span className="text-xs font-bold text-emerald-700">/ staff hour</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5">
              <span>Optimal Zone: $105-$135</span>
              <span className="font-mono font-bold text-slate-700">{reputationAnalytics.sweetSpotPct}% in Sweet Spot</span>
            </div>
          </div>

          {/* Card 3: Labor ROI from High Reputation */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">5-Star Retention Revenue ROI</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-950 font-mono">
                +${reputationAnalytics.estimatedMonthlyRepeatRevenueLift.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700">/ month</span>
            </div>
            <div className="text-[11px] text-emerald-700 mt-1.5 flex items-center justify-between border-t border-emerald-200/60 pt-1.5">
              <span>Repeat diner spend lift</span>
              <span className="font-mono font-bold">98% Hospitality Index</span>
            </div>
          </div>

          {/* Card 4: 5-Star Staff Mentions & Tip Efficiency */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">5-Star Reviews &amp; Tip Rate</span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Smile className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {reputationAnalytics.perf.recent5StarCountThisMonth}
              </span>
              <span className="text-xs font-bold text-purple-700">5★ reviews this mo</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5">
              <span>Avg Server Tip Rate:</span>
              <span className="font-mono font-bold text-slate-800">23.4% (Industry top 5%)</span>
            </div>
          </div>

        </div>

        {/* TAB 1: DAILY CORRELATION TREND (RECHARTS COMPOSED CHART) */}
        {reputationSubTab === 'correlation' && (
          <div className="space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div>
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Sales Per Labor Hour (SPLH) vs. Daily Reputation Score Index</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Visualizes how daily labor productivity ($/staff-hr) directly correlates with guest ratings and experience scores
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" />
                  SPLH ($/hr)
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                  Reputation Score (0-100)
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-2.5 h-0.5 bg-slate-400 inline-block" />
                  Labor Cost %
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                  Optimal Zone: $105 - $135
                </span>
              </div>
            </div>

            {/* Recharts ComposedChart */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={reputationAnalytics.dailyData}
                  margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                  />

                  {/* Left Y Axis for Dollars ($ SPLH) */}
                  <YAxis
                    yAxisId="left"
                    domain={[0, 'dataMax + 40']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `$${val}`}
                    tickLine={false}
                    label={{ value: 'Sales / Labor Hr ($)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                  />

                  {/* Right Y Axis for Reputation Score (0 - 100) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[75, 100]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `${val} pts`}
                    tickLine={false}
                    label={{ value: 'Reputation Score', angle: 90, position: 'insideRight', fontSize: 10, fill: '#94a3b8' }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl text-xs space-y-2 border border-slate-700 min-w-[240px]">
                            <div className="font-bold border-b border-slate-700 pb-1.5 flex items-center justify-between">
                              <span className="text-amber-400 font-bold">{d.dayName} ({d.dateStr})</span>
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                d.status === 'optimal_sweet_spot' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                d.status === 'lean_risk' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              }`}>
                                {d.status === 'optimal_sweet_spot' ? '5★ Sweet Spot' : d.status === 'lean_risk' ? 'Lean Staffing' : 'High Labor'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <span className="text-slate-400">Reputation Score:</span>
                              <span className="font-bold font-mono text-amber-300 text-right">{d.reputationScore} / 100 ({d.starRating}★)</span>

                              <span className="text-slate-400">Sales / Labor Hr (SPLH):</span>
                              <span className="font-bold font-mono text-sky-300 text-right">${d.splh}/hr</span>

                              <span className="text-slate-400">Labor Cost %:</span>
                              <span className="font-bold font-mono text-slate-200 text-right">{d.laborPct}%</span>

                              <span className="text-slate-400">Scheduled Staff:</span>
                              <span className="font-bold font-mono text-slate-200 text-right">{d.activeStaffCount} staff ({d.hours}h)</span>

                              <span className="text-slate-400">Covers / Staff Hr:</span>
                              <span className="font-bold font-mono text-emerald-300 text-right">{d.coversPerLaborHour} covers/h</span>

                              <span className="text-slate-400">5-Star Review Share:</span>
                              <span className="font-bold font-mono text-purple-300 text-right">{d.fiveStarSharePct}%</span>
                            </div>

                            <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-slate-300 italic">
                              💡 {d.correlationInsight}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />

                  {/* Reference Lines for Optimal Sweet Spot ($105 - $135 SPLH) */}
                  <ReferenceLine
                    yAxisId="left"
                    y={105}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ value: 'Min Sweet Spot ($105)', fill: '#10b981', fontSize: 9, position: 'insideBottomLeft' }}
                  />
                  <ReferenceLine
                    yAxisId="left"
                    y={135}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ value: 'Peak Productivity ($135)', fill: '#10b981', fontSize: 9, position: 'insideTopLeft' }}
                  />

                  {/* Daily Reputation Score as glowing Area */}
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="reputationScore"
                    name="Reputation Index (0-100)"
                    fill="#fef3c7"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={0.4}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                  />

                  {/* Sales Per Labor Hour (SPLH) as Primary Bar */}
                  <Bar
                    yAxisId="left"
                    dataKey="splh"
                    name="Sales / Labor Hr (SPLH $)"
                    fill="#0284c7"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />

                  {/* Labor % as dashed line */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="laborPct"
                    name="Labor Cost %"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* 95 pts High Reputation Target line */}
                  <ReferenceLine
                    yAxisId="right"
                    y={95}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    label={{ value: '4.8★ Target (95 pts)', fill: '#10b981', fontSize: 10, position: 'right' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Correlation Diagnostic Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {reputationAnalytics.dailyData.slice(0, 4).map((d) => (
                <div key={`rep-strip-${d.dateStr}`} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{d.dayName}</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded text-[10px]">
                      {d.starRating}★ ({d.reputationScore} pts)
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">SPLH:</span>
                    <span className="font-mono font-bold text-sky-700">${d.splh}/hr</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs mt-0.5">
                    <span className="text-slate-500">Labor Cost %:</span>
                    <span className="font-mono font-bold text-slate-700">{d.laborPct}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 truncate border-t border-slate-200 pt-1">
                    {d.correlationInsight}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: MULTI-PILLAR PERFORMANCE RADAR PROFILE */}
        {reputationSubTab === 'pillars' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

            {/* Left: Recharts RadarChart */}
            <div className="lg:col-span-7 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 mb-2">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <span>6-Pillar Restaurant Reputation &amp; Operations Radar</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Comparing restaurant performance vs industry benchmark across 6 core pillars
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                    Workqora Restaurant ({reputationAnalytics.avgReputation} pts)
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" />
                    Benchmark (88 pts)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={reputationAnalytics.pillarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[60, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />

                    {/* Industry Benchmark Radar */}
                    <Radar
                      name="Industry Benchmark"
                      dataKey="industryBenchmark"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.2}
                      strokeDasharray="3 3"
                    />

                    {/* Current Restaurant Performance Radar */}
                    <Radar
                      name="Workqora Actual"
                      dataKey="currentScore"
                      stroke="#059669"
                      fill="#10b981"
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                              <div className="font-bold text-amber-300">{d.pillar}</div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Current Score:</span>
                                <span className="font-bold font-mono text-emerald-400">{d.currentScore} / 100</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-slate-400">Industry Benchmark:</span>
                                <span className="font-bold font-mono text-slate-300">{d.industryBenchmark} / 100</span>
                              </div>
                              <div className="flex justify-between gap-4 pt-1 border-t border-slate-700 text-[10px]">
                                <span className="text-slate-400">Competitive Edge:</span>
                                <span className="font-mono text-emerald-300 font-bold">+{d.currentScore - d.industryBenchmark} pts</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Pillar Scorecards */}
            <div className="lg:col-span-5 space-y-2.5">
              {reputationAnalytics.pillarData.map((p) => {
                const delta = p.currentScore - p.industryBenchmark;
                return (
                  <div key={p.pillar} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.pillar}</div>
                      <div className="text-[10px] text-slate-500">Benchmark: {p.industryBenchmark} pts</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-slate-900">{p.currentScore}<span className="text-[10px] text-slate-400 font-normal">/100</span></div>
                      <span className={`text-[10px] font-bold font-mono ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {delta >= 0 ? `+${delta} pts above` : `${delta} pts below`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 3: SERVER PRODUCTIVITY & 5-STAR PRAISE MATRIX */}
        {reputationSubTab === 'servers' && (
          <div className="space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Front of House &amp; Bar Staff Labor Productivity vs. Guest Review Praise</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Individual correlation between server sales/hour ($), table turn speed (mins), and 5-star review mentions
                </p>
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setSelectedServerRole('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedServerRole === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All Staff ({reputationAnalytics.serverProductivityList.length})
                </button>
                <button
                  onClick={() => setSelectedServerRole('Server')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedServerRole === 'Server' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Servers Only
                </button>
                <button
                  onClick={() => setSelectedServerRole('Bartender')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedServerRole === 'Bartender' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Bartenders
                </button>
              </div>
            </div>

            {/* Comprehensive Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-3.5">Staff Member</th>
                    <th className="py-3 px-3">Role &amp; Station</th>
                    <th className="py-3 px-3 font-mono">Scheduled</th>
                    <th className="py-3 px-3 font-mono">Sales / Hr</th>
                    <th className="py-3 px-3 font-mono">Avg Turn Time</th>
                    <th className="py-3 px-3 font-mono text-center">5★ Praise Mentions</th>
                    <th className="py-3 px-3 font-mono text-right">Avg Tip %</th>
                    <th className="py-3 px-3 text-center">Productivity Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {reputationAnalytics.filteredServerProductivityList.map((item) => (
                    <tr key={`server-rep-${item.employee.id}`} className="hover:bg-slate-50/80 transition-colors">

                      {/* Employee Avatar & Name */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {item.employee.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{item.employee.name}</div>
                            <div className="text-[10px] text-slate-500">${item.employee.hourlyWage}/hr base</div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Dept */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-semibold">{item.employee.role}</div>
                        <div className="text-[10px] text-slate-500">{item.employee.department}</div>
                      </td>

                      {/* Hours */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        <div>{item.totalHours} hrs</div>
                        <div className="text-[10px] text-slate-400">{item.shiftCount} shifts</div>
                      </td>

                      {/* Sales / Hr */}
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-emerald-700">${item.salesPerHour}/hr</span>
                        <div className="text-[10px] text-slate-400">~${item.totalGeneratedSales.toLocaleString()} total</div>
                      </td>

                      {/* Turn velocity */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        <span>{item.avgTableTurnMins} mins</span>
                        <div className="text-[10px] text-slate-400">Fast turn rate</div>
                      </td>

                      {/* 5-Star Reviews Mentioning Name */}
                      <td className="py-3 px-3 text-center">
                        {item.reviewMentions > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{item.reviewMentions} Reviews</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">0 mentions</span>
                        )}
                      </td>

                      {/* Tip Rate */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">
                        <span className="text-emerald-700">{item.tipEfficiencyPct}%</span>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          item.tier === 'Master Producer' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          item.tier === 'High Performer' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          <Award className="w-3 h-3" />
                          <span>{item.tier}</span>
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 4: INTERACTIVE STAFFING LEVEL & REPUTATION SIMULATOR */}
        {reputationSubTab === 'simulation' && (
          <div className="space-y-4 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 p-5 rounded-2xl text-white shadow-md border border-slate-700">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-sm text-white">
                    Labor Staffing Level &amp; Reputation Sensitivity Simulator
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Simulate how adding or reducing staff shifts directly impacts Sales Per Labor Hour ($/hr), table turn times, and projected diner reputation ratings
                </p>
              </div>

              <button
                onClick={() => setSimulatedStaffDelta(0)}
                className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg flex items-center gap-1 self-start sm:self-center cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Baseline</span>
              </button>
            </div>

            {/* Interactive Slider */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-semibold text-slate-300">Staff Headcount Adjustment:</span>
                <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-full ${
                  simulatedStaffDelta > 0 ? 'bg-emerald-500 text-white' :
                  simulatedStaffDelta < 0 ? 'bg-rose-500 text-white' :
                  'bg-white/20 text-white'
                }`}>
                  {simulatedStaffDelta > 0 ? `+${simulatedStaffDelta} Staff (High Service)` :
                   simulatedStaffDelta < 0 ? `${simulatedStaffDelta} Staff (Lean Labor)` :
                   '0 Staff (Current Baseline)'}
                </span>
              </div>

              <input
                type="range"
                min="-2"
                max="3"
                step="1"
                value={simulatedStaffDelta}
                onChange={(e) => setSimulatedStaffDelta(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>-2 Staff (Ultra Lean)</span>
                <span>-1 Staff</span>
                <span className="text-white font-bold">0 (Current Schedule)</span>
                <span>+1 Staff</span>
                <span>+2 Staff</span>
                <span>+3 Staff (Maximum Hospitality)</span>
              </div>
            </div>

            {/* Real-time Projected Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300">Projected Reputation Score</div>
                <div className="text-2xl font-black font-mono text-amber-300 mt-1">
                  {reputationAnalytics.simulation.simulatedReputationScore} <span className="text-xs font-normal text-slate-300">/ 100</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Rating: <strong className="text-white">{reputationAnalytics.simulation.simulatedStarRating}★</strong>
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300">Simulated SPLH Productivity</div>
                <div className="text-2xl font-black font-mono text-sky-300 mt-1">
                  ${reputationAnalytics.simulation.simulatedSplh} <span className="text-xs font-normal text-slate-300">/ hr</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Labor Ratio: <strong className="text-white">{reputationAnalytics.simulation.simulatedLaborPct}%</strong>
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300">Table Turn &amp; Speed Impact</div>
                <div className="text-lg font-black text-emerald-300 mt-1 truncate">
                  {reputationAnalytics.simulation.simulatedGuestWaitChange}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Kitchen ticket speed
                </div>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10">
                <div className="text-[11px] text-slate-300">Weekly Payroll Delta</div>
                <div className={`text-xl font-black font-mono mt-1 ${
                  reputationAnalytics.simulation.laborCostDelta <= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {reputationAnalytics.simulation.laborCostDelta <= 0
                    ? `-$${Math.abs(reputationAnalytics.simulation.laborCostDelta).toLocaleString()}`
                    : `+$${reputationAnalytics.simulation.laborCostDelta.toLocaleString()}`}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Total: ${reputationAnalytics.simulation.simulatedLaborCost.toLocaleString()}
                </div>
              </div>

            </div>

            {/* AI Recommendation Box */}
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-200">Simulation Strategic Verdict: </span>
                <span className="text-slate-200">{reputationAnalytics.simulation.simulationAdvice}</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 5. VISUALIZATION 2 & 3: PEAK TRAFFIC HOURS & OVERTIME EXPOSURE (2-COLUMN GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CHART 2: PEAK TRAFFIC HOURS VS ACTIVE STAFFING */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Peak Traffic Hours vs. On-Duty Staffing
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Hourly covers foot-traffic volume vs active scheduled headcount
              </p>
            </div>

            {/* Traffic day toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTrafficDayType('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                  trafficDayType === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                7-Day Avg
              </button>
              <button
                onClick={() => setTrafficDayType('weekday')}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                  trafficDayType === 'weekday' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Weekday
              </button>
              <button
                onClick={() => setTrafficDayType('weekend')}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                  trafficDayType === 'weekend' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Weekend Rush
              </button>
            </div>
          </div>

          {/* Composed Chart for Traffic vs Staff */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={hourlyStaffingVsTrafficData}
                margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hourLabel"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="traffic"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  label={{ value: 'Covers / Orders', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis
                  yAxisId="staff"
                  orientation="right"
                  domain={[0, 15]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  label={{ value: 'Staff Count', angle: 90, position: 'insideRight', fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                          <div className="font-bold border-b border-slate-700 pb-1 flex items-center justify-between">
                            <span>{data.hourLabel} ({data.rushType})</span>
                            <span className="text-amber-400 font-mono">{data.expectedCovers} Covers</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Active Staff:</span>
                            <span className="font-bold font-mono text-sky-400">{data.activeStaff} Staff</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>• FOH Floor / Bar:</span>
                            <span className="font-mono">{data.fohStaff + data.barStaff}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-300">
                            <span>• Kitchen BOH / Prep:</span>
                            <span className="font-mono">{data.bohStaff}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-700 text-[10px]">
                            <span className="text-slate-400">Coverage Efficiency:</span>
                            <span className="font-mono text-emerald-400 font-bold">{data.coverageRatio}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '8px', fontSize: '10px' }}
                />

                {/* Traffic volume as warm gradient Area */}
                <Area
                  yAxisId="traffic"
                  type="monotone"
                  dataKey="expectedCovers"
                  name="Expected Covers (Foot Traffic)"
                  fill="#fee2e2"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={0.5}
                />

                {/* Staffing level as bold Line */}
                <Line
                  yAxisId="staff"
                  type="monotone"
                  dataKey="activeStaff"
                  name="Active Staff On Duty"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#0284c7' }}
                />

                {/* Recommended staff line */}
                <Line
                  yAxisId="staff"
                  type="stepAfter"
                  dataKey="recommendedStaff"
                  name="Recommended Baseline"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Key Service Windows Badge Indicators */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="p-2 bg-amber-50/70 border border-amber-200/60 rounded-xl">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Lunch Rush (12-2 PM)</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Peak ~110-145 Covers</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Fully Covered (8 Staff)
              </div>
            </div>

            <div className="p-2 bg-rose-50/70 border border-rose-200/60 rounded-xl">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Dinner Rush (6-9 PM)</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Peak ~155-210 Covers</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Prime Coverage (11 Staff)
              </div>
            </div>

            <div className="p-2 bg-indigo-50/70 border border-indigo-200/60 rounded-xl">
              <div className="text-[10px] font-bold text-indigo-800 uppercase">Late Night (10 PM-2 AM)</div>
              <div className="text-xs font-bold text-slate-900 mt-0.5">Bar &amp; Clean Closing</div>
              <div className="text-[10px] text-slate-600 font-semibold mt-0.5">
                3-4 Night Closers
              </div>
            </div>
          </div>

        </div>

        {/* CHART 3: OVERTIME METRICS & EMPLOYEE RISK ANALYSIS */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Weekly Overtime &amp; 40h Threshold Audit</span>
                  {overallMetrics.overtimeCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-rose-100 text-rose-800 rounded-full border border-rose-200 animate-pulse">
                      {overallMetrics.overtimeCount} Over Limit
                    </span>
                  )}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Visualizing scheduled weekly hours against the standard 40-hour legal overtime threshold
              </p>
            </div>

            {/* Overtime Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                id="ot-filter-all"
                onClick={() => setOvertimeFilter('all')}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                  overtimeFilter === 'all' ? 'bg-white text-sky-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Staff ({overallMetrics.employeeOvertimeList.length})
              </button>
              <button
                id="ot-filter-overtime"
                onClick={() => setOvertimeFilter('overtime_only')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  overtimeFilter === 'overtime_only'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Exceeding 40h ({overallMetrics.overtimeCount})</span>
              </button>
              <button
                id="ot-filter-approaching"
                onClick={() => setOvertimeFilter('approaching')}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                  overtimeFilter === 'approaching' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Approaching ({overallMetrics.approachingCount})
              </button>
            </div>
          </div>

          {/* 40-Hour Legend & Visual Alert Guidance */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px]">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-700">Threshold Guide:</span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" />
                Standard (≤36h)
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
                Near Limit (36-40h)
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
                Exceeding 40h Threshold
              </span>
              <span className="flex items-center gap-1 text-rose-900 font-bold">
                <span className="w-2.5 h-2.5 rounded-xs bg-red-900 inline-block" />
                1.5x OT Hours
              </span>
            </div>
            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold">
              40h Max Threshold
            </span>
          </div>

          {/* BarChart of Employee Weekly Hours with ReferenceLine at 40h and Overtime Area */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredOvertimeList.slice(0, 8)}
                layout="vertical"
                margin={{ top: 15, right: 35, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 48]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `${val}h`}
                  tickLine={false}
                />
                <YAxis
                  dataKey="employee.name"
                  type="category"
                  tick={({ x, y, payload }) => {
                    const empName = payload.value;
                    const item = filteredOvertimeList.find(e => e.employee.name === empName);
                    const isOvertime = item && item.status === 'overtime';
                    const isApproaching = item && item.status === 'approaching';
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={-8}
                          y={3}
                          textAnchor="end"
                          fontSize={10}
                          fontWeight={isOvertime ? 800 : isApproaching ? 700 : 600}
                          fill={isOvertime ? '#e11d48' : isApproaching ? '#b45309' : '#334155'}
                        >
                          {isOvertime ? `🚨 ${empName}` : isApproaching ? `⚠️ ${empName}` : empName}
                        </text>
                      </g>
                    );
                  }}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isOver = data.status === 'overtime';
                      return (
                        <div className={`p-3.5 rounded-xl shadow-xl text-xs space-y-2 border min-w-[220px] ${
                          isOver ? 'bg-slate-950 text-white border-rose-500 ring-2 ring-rose-500/30' : 'bg-slate-900 text-white border-slate-700'
                        }`}>
                          <div className="font-bold border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              {isOver && <span className="text-rose-400">🚨</span>}
                              <span>{data.employee.name}</span>
                            </span>
                            <span className="text-[10px] text-slate-300 font-mono">{data.employee.role}</span>
                          </div>

                          {isOver && (
                            <div className="bg-rose-950/80 text-rose-200 px-2 py-1 rounded-md border border-rose-500/50 text-[11px] font-bold">
                              ⚠️ EXCEEDS 40H THRESHOLD (+{data.overtimeHours}h OT)
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Scheduled:</span>
                            <span className={`font-bold font-mono ${isOver ? 'text-rose-400' : 'text-sky-400'}`}>
                              {data.totalHours} hrs
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Regular (≤40h @ 1.0x):</span>
                            <span className="font-mono">{data.regularHours}h (${data.regularPay})</span>
                          </div>
                          {data.overtimeHours > 0 && (
                            <div className="flex justify-between text-rose-300 font-semibold">
                              <span>Overtime (&gt;40h @ 1.5x):</span>
                              <span className="font-mono font-bold text-rose-400">+{data.overtimeHours}h (${data.overtimePay})</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1.5 border-t border-slate-800 text-amber-300 font-bold">
                            <span>Total Gross Payout:</span>
                            <span className="font-mono text-white">${data.totalPay}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Shaded Hazard Area for Overtime Zone (>40h) */}
                <ReferenceArea
                  x1={40}
                  x2={48}
                  shape={(props: any) => (
                    <rect
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
                      fill="#fee2e2"
                      fillOpacity={0.6}
                    />
                  )}
                />

                {/* 40h OT Limit Reference Line */}
                <ReferenceLine
                  x={40}
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  label={{ value: '🚨 40h Overtime Threshold', fill: '#dc2626', fontSize: 10, fontWeight: 800, position: 'top' }}
                />

                {/* Regular Hours (Stacked) with Alert Colors per status */}
                <Bar
                  dataKey="regularHours"
                  name="Regular Hours (≤40h)"
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                  barSize={16}
                >
                  {filteredOvertimeList.slice(0, 8).map((entry) => (
                    <Cell
                      key={`reg-${entry.employee.id}`}
                      fill={
                        entry.status === 'overtime' ? '#e11d48' :
                        entry.status === 'approaching' ? '#f59e0b' : '#0284c7'
                      }
                    />
                  ))}
                </Bar>

                {/* Overtime Hours (Stacked) in Alert Crimson Red */}
                <Bar
                  dataKey="overtimeHours"
                  name="Overtime Hours (>40h)"
                  stackId="a"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                >
                  {filteredOvertimeList.slice(0, 8).map((entry) => (
                    <Cell
                      key={`ot-${entry.employee.id}`}
                      fill="#881337"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Overtime Risk & Threshold Breakdown Cards */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredOvertimeList.map((item) => {
              const otWage = (item.employee.hourlyWage || 20) * 1.5;
              const isOvertime = item.status === 'overtime';
              const isApproaching = item.status === 'approaching';
              // Calculate percentage of 48h max scale
              const totalPct = Math.min(100, (item.totalHours / 48) * 100);
              const regularPct = Math.min(100, (Math.min(40, item.totalHours) / 48) * 100);
              const overtimePct = Math.min(100, (Math.max(0, item.totalHours - 40) / 48) * 100);
              const thresholdLinePct = (40 / 48) * 100; // 83.33%

              return (
                <div
                  key={item.employee.id}
                  className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                    isOvertime
                      ? 'bg-rose-50/90 border-rose-300 border-l-4 border-l-rose-600 ring-1 ring-rose-400/30 shadow-xs'
                      : isApproaching
                      ? 'bg-amber-50/70 border-amber-200 border-l-4 border-l-amber-500'
                      : 'bg-slate-50/80 border-slate-200 border-l-4 border-l-emerald-500'
                  }`}
                >
                  {/* Header Row: Employee Name, Department, Status Badge */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        isOvertime ? 'bg-rose-600 animate-ping' :
                        isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className={`font-bold ${isOvertime ? 'text-rose-950 font-black' : 'text-slate-900'}`}>
                        {item.employee.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({item.employee.department} • {item.employee.role})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOvertime ? (
                        <span className="px-2.5 py-1 bg-rose-600 text-white font-black text-[10px] rounded-lg shadow-xs flex items-center gap-1 uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Exceeds 40h Limit (+{item.overtimeHours}h OT)</span>
                        </span>
                      ) : isApproaching ? (
                        <span className="px-2.5 py-1 bg-amber-500 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Approaching 40h ({item.totalHours}h)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold text-[10px] rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Safe (≤40h)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* VISUAL 40-HOUR THRESHOLD GAUGE BAR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Scheduled: <strong className={isOvertime ? 'text-rose-700 font-bold' : 'text-slate-800'}>{item.totalHours} hrs</strong></span>
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <span>40h Limit Marker</span>
                      </span>
                      <span className="text-slate-400">48h max</span>
                    </div>

                    <div className="relative h-4 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      {/* Dotted 40h Threshold Marker Line */}
                      <div
                        className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-600 border-r border-white/60"
                        style={{ left: `${thresholdLinePct}%` }}
                        title="40-Hour Weekly Threshold Line"
                      />

                      {/* Regular Hours Segment */}
                      <div
                        className={`h-full transition-all rounded-l-full ${
                          isOvertime ? 'bg-rose-500' :
                          isApproaching ? 'bg-amber-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${regularPct}%` }}
                      />

                      {/* Overtime Hours Segment (>40h) */}
                      {isOvertime && (
                        <div
                          className="h-full bg-red-900 transition-all rounded-r-full relative overflow-hidden"
                          style={{ width: `${overtimePct}%` }}
                          title={`+${item.overtimeHours} Overtime Hours`}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:8px_8px] animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Overtime Breakdown */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 flex-wrap gap-2">
                    <div className="text-slate-600 font-mono">
                      <span>Regular: {item.regularHours}h @ ${item.employee.hourlyWage || 20}/hr (<strong>${item.regularPay}</strong>)</span>
                      {item.overtimeHours > 0 && (
                        <span className="text-rose-700 font-bold ml-2">
                          • 1.5x OT: +{item.overtimeHours}h @ ${otWage.toFixed(2)}/hr (<strong>+${item.overtimePay}</strong>)
                        </span>
                      )}
                    </div>

                    <div className="font-mono text-slate-900 font-bold">
                      Gross Total: <span className={isOvertime ? 'text-rose-700' : 'text-slate-900'}>${item.totalPay}</span>
                    </div>
                  </div>

                  {/* Action Reallocation Prompt for Overtime Breaches */}
                  {isOvertime && (
                    <div className="bg-rose-100/80 p-2 rounded-lg text-[10px] text-rose-900 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Recommendation: Reassign {item.overtimeHours}h to available staff to eliminate ${item.overtimePay} OT premium.
                      </span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* 6. VISUALIZATION 4 & 5: DEPARTMENT COST SHARE & DETAIL BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut PieChart of Department Share */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <PieChartIcon className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Department Labor Cost Distribution
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Share of total weekly restaurant payroll by station
            </p>
          </div>

          {/* PieChart */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="cost"
                >
                  {departmentBreakdownData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <div className="font-bold text-sky-300">{data.name}</div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Total Cost:</span>
                            <span className="font-mono font-bold">${data.cost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Share of Payroll:</span>
                            <span className="font-mono font-bold">{data.pctOfTotal}%</span>
                          </div>
                          <div className="flex justify-between gap-4 text-[10px] text-slate-300">
                            <span>Hours / Shifts:</span>
                            <span>{data.hours}h ({data.shiftCount} shifts)</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Mini Legend */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-100">
            {departmentBreakdownData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 truncate">{d.name}:</span>
                <span className="font-bold text-slate-900 font-mono ml-auto">{d.pctOfTotal}%</span>
              </div>
            ))}
          </div>

        </div>

        {/* Detailed Department Cost Breakdown Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Department Performance &amp; Efficiency Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Direct comparison of hours, gross wages, shift allocations, and average hourly rates
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-sky-50 text-sky-700 px-2 py-1 rounded-lg">
              5 Departments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Shifts</th>
                  <th className="py-2.5 px-3">Total Hours</th>
                  <th className="py-2.5 px-3">Avg Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Wages</th>
                  <th className="py-2.5 px-3 text-right">% of Labor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {departmentBreakdownData.map((d) => {
                  const avgWage = d.hours > 0 ? (d.cost / d.hours) : 0;
                  return (
                    <tr key={d.name} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="font-bold text-slate-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{d.shiftCount} shifts</td>
                      <td className="py-3 px-3 font-mono text-slate-800 font-bold">{d.hours} hrs</td>
                      <td className="py-3 px-3 font-mono text-slate-600">${avgWage.toFixed(2)}/hr</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-right">
                        ${d.cost.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 bg-slate-100 font-mono font-bold text-slate-700 rounded">
                          {d.pctOfTotal}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100 flex items-center justify-between text-xs text-sky-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Tip: Front of House (FOH) and Back of House (BOH) account for {
                (departmentBreakdownData.find(d => d.name === 'Front of House')?.pctOfTotal || 0) +
                (departmentBreakdownData.find(d => d.name === 'Back of House')?.pctOfTotal || 0)
              }% of scheduled payroll.
            </span>
          </div>

        </div>

      </div>

      {/* 6.5 VISUAL COMPLIANCE WIDGET: ALCOHOL HANDLER & FOOD SAFETY CERTIFICATION TRACKER */}
      <CertificationComplianceWidget
        employees={employees}
        onUpdateEmployee={onUpdateEmployee}
        currentLanguage={currentLanguage}
      />

      {/* 7. VISUALIZATION: DEPARTMENT TARDINESS FREQUENCY & STAFFING RELIABILITY ANALYTICS */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-6">

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900">
                  Average Tardiness Frequency &amp; Staffing Reliability per Department
                </h3>
                {departmentTardinessAnalytics.highestTardinessDept.riskLevel === 'critical' && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-full border border-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Bottleneck Identified: {departmentTardinessAnalytics.highestTardinessDept.department} ({departmentTardinessAnalytics.highestTardinessDept.tardinessFrequencyPct}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Analyzes clock-in latency, shift punctuality trends, and transit bottlenecks across all 5 operational stations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Benchmark Threshold:</span>
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              &le; 5.0% Industry Target
            </span>
          </div>
        </div>

        {/* Top 4 Diagnostic KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">

          {/* Card 1: Restaurant Average Tardiness Frequency */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Avg Tardiness Frequency</span>
              <Activity className={`w-4 h-4 ${departmentTardinessAnalytics.overallAvgFrequencyPct > 8 ? 'text-amber-500' : 'text-emerald-600'}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                {departmentTardinessAnalytics.overallAvgFrequencyPct}%
              </span>
              <span className={`text-[11px] font-bold ${departmentTardinessAnalytics.overallAvgFrequencyPct <= 5 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {departmentTardinessAnalytics.overallAvgFrequencyPct <= 5 ? 'Target Met' : '+3.8% above target'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {departmentTardinessAnalytics.totalRestaurantTardy} tardy shifts of {departmentTardinessAnalytics.totalRestaurantAudited} audited
            </p>
          </div>

          {/* Card 2: Highest Bottleneck Department */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Primary Bottleneck Station</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2">
              <div className="font-bold text-sm text-slate-900 truncate">
                {departmentTardinessAnalytics.highestTardinessDept.department}
              </div>
              <div className="text-xs font-mono font-bold text-amber-800 mt-0.5">
                {departmentTardinessAnalytics.highestTardinessDept.tardinessFrequencyPct}% frequency &bull; avg {departmentTardinessAnalytics.highestTardinessDept.avgLateMinutes}m late
              </div>
            </div>
            <p className="text-[11px] text-amber-700/90 mt-1 truncate">
              {departmentTardinessAnalytics.highestTardinessDept.peakTimeSlot}
            </p>
          </div>

          {/* Card 3: Total Lost Operational Delay */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Total Lost Delay Time</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                {departmentTardinessAnalytics.totalRestaurantLostMin}
              </span>
              <span className="text-xs font-medium text-slate-500">minutes</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Avg {departmentTardinessAnalytics.overallAvgDelayMinutes} mins delay per late incident
            </p>
          </div>

          {/* Card 4: Healthy Punctuality Stations */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/70">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">High Reliability Stations</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-950">
                {departmentTardinessAnalytics.healthyDeptsCount} / 5
              </span>
              <span className="text-xs font-bold text-emerald-700">Departments</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              FOH &amp; Mgmt maintain &gt;95% on-time rate
            </p>
          </div>

        </div>

        {/* Visual Charts Grid: Frequency Bar Chart + Delay Severity Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Chart 1: Average Tardiness Frequency (%) by Department */}
          <div className="lg:col-span-7 bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-sky-600" />
                  <span>Average Tardiness Frequency per Department (%)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Percentage of scheduled shifts with recorded clock-in delays (&gt;3 min)
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="inline-block w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
                <span className="text-slate-600">Tardiness %</span>
                <span className="inline-block w-2.5 h-0.5 bg-rose-500"></span>
                <span className="text-rose-600 font-semibold">5% Target</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentTardinessAnalytics.departmentList}
                  margin={{ top: 18, right: 15, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#475569' }}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 'dataMax + 8']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1.5 max-w-xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                              <span className="font-bold text-sky-400">{d.department}</span>
                              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                d.riskLevel === 'critical' ? 'bg-rose-500/30 text-rose-300' :
                                d.riskLevel === 'moderate' ? 'bg-amber-500/30 text-amber-300' :
                                'bg-emerald-500/30 text-emerald-300'
                              }`}>
                                {d.riskLevel.toUpperCase()}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1">
                              <span className="text-slate-400">Tardiness Rate:</span>
                              <span className="font-mono font-bold text-amber-300 text-right">{d.tardinessFrequencyPct}%</span>
                              <span className="text-slate-400">On-Time Score:</span>
                              <span className="font-mono font-bold text-emerald-400 text-right">{d.onTimeRatePct}%</span>
                              <span className="text-slate-400">Tardy Shifts:</span>
                              <span className="font-mono text-slate-200 text-right">{d.tardyCount} of {d.totalAuditedRecords}</span>
                              <span className="text-slate-400">Avg Arrival Delay:</span>
                              <span className="font-mono text-slate-200 text-right">{d.avgLateMinutes} mins</span>
                            </div>
                            <div className="text-[10px] text-slate-300 border-t border-slate-700/80 pt-1">
                              <span className="text-sky-300 font-semibold">Peak Delay Slot: </span>{d.peakTimeSlot}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={5.0}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{ value: 'Target Max (5%)', fill: '#ef4444', position: 'top', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Bar dataKey="tardinessFrequencyPct" radius={[6, 6, 0, 0]}>
                    {departmentTardinessAnalytics.departmentList.map((entry, index) => {
                      let fillColor = '#10b981'; // green for healthy
                      if (entry.riskLevel === 'critical') fillColor = '#f59e0b'; // amber
                      else if (entry.riskLevel === 'moderate') fillColor = '#8b5cf6'; // violet
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Average Delay Severity (Minutes) per Incident */}
          <div className="lg:col-span-5 bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Average Arrival Delay (Minutes)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Severity of delay in minutes when tardiness occurs
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentTardinessAnalytics.departmentList}
                  layout="vertical"
                  margin={{ top: 10, right: 25, left: 25, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#475569' }}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-lg space-y-1">
                            <div className="font-bold text-sky-300">{d.department}</div>
                            <div className="text-slate-300">Avg Delay: <span className="font-bold text-amber-300 font-mono">{d.avgLateMinutes} min</span></div>
                            <div className="text-slate-300">Max Delay Recorded: <span className="font-bold text-rose-300 font-mono">{d.maxLateMinutes} min</span></div>
                            <div className="text-slate-300">Total Lost Delay: <span className="font-mono">{d.totalLateMinutes} min</span></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={15} stroke="#ea580c" strokeDasharray="2 2" />
                  <Bar dataKey="avgLateMinutes" fill="#d97706" radius={[0, 6, 6, 0]}>
                    {departmentTardinessAnalytics.departmentList.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 5 Department Diagnostic & Root Cause Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Department Staffing Issue Diagnostics &amp; Operational Recommendations</span>
            </h4>
            <span className="text-[11px] text-slate-500">5 Operational Units Monitored</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {departmentTardinessAnalytics.departmentList.map(dept => {
              return (
                <div
                  key={dept.department}
                  className={`p-4 rounded-xl border transition-all ${
                    dept.riskLevel === 'critical'
                      ? 'bg-amber-50/40 border-amber-200'
                      : dept.riskLevel === 'moderate'
                      ? 'bg-purple-50/40 border-purple-200'
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></span>
                      <span className="font-bold text-xs text-slate-900">{dept.department}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                      dept.riskLevel === 'critical' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      dept.riskLevel === 'moderate' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                      'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}>
                      {dept.riskLevel === 'critical' ? '⚠️ High Attention' :
                       dept.riskLevel === 'moderate' ? '⚡ Moderate Delay' : '✓ Optimal'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/70 text-center">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                      <div className="text-[10px] text-slate-500">Tardiness %</div>
                      <div className="font-mono font-bold text-xs text-slate-900 mt-0.5">{dept.tardinessFrequencyPct}%</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                      <div className="text-[10px] text-slate-500">Avg Delay</div>
                      <div className="font-mono font-bold text-xs text-slate-900 mt-0.5">{dept.avgLateMinutes}m</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/50">
                      <div className="text-[10px] text-slate-500">On-Time %</div>
                      <div className="font-mono font-bold text-xs text-emerald-700 mt-0.5">{dept.onTimeRatePct}%</div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="text-[11px] text-slate-700 bg-white/70 p-2 rounded-lg border border-slate-200/60">
                      <span className="font-semibold text-slate-900">Identified Issue: </span>
                      {dept.recurringIssueSummary}
                    </div>
                    <div className="text-[11px] text-sky-900 bg-sky-50/70 p-2 rounded-lg border border-sky-100 flex items-start gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span><strong>Recommended Action: </strong>{dept.actionAdvice}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Incident Roster & Search Table */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                <span>Department Attendance &amp; Tardiness Incident Audit Roster</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ({departmentTardinessAnalytics.filteredRecords.length} records)
                </span>
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTardinessIncidentLog(!showTardinessIncidentLog)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                {showTardinessIncidentLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showTardinessIncidentLog ? 'Collapse Incidents' : 'Expand Incidents'}</span>
              </button>
            </div>
          </div>

          {showTardinessIncidentLog && (
            <div className="space-y-3">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-xs">

                {/* Department filter pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 font-medium">Department:</span>
                  {(['all', 'Kitchen Prep & Dish', 'Bar & Beverage', 'Back of House', 'Front of House', 'Management'] as const).map(dept => (
                    <button
                      key={dept}
                      onClick={() => setTardinessDeptFilter(dept)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer ${
                        tardinessDeptFilter === dept
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {dept === 'all' ? 'All' : dept}
                    </button>
                  ))}
                </div>

                {/* Status Filter & Search */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={tardinessStatusFilter}
                      onChange={(e) => setTardinessStatusFilter(e.target.value as any)}
                      className="bg-transparent text-slate-700 font-medium focus:outline-hidden cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="late_only">Late Incidents Only</option>
                      <option value="on_time">On-Time Only</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, note, or reason..."
                      value={tardinessSearchQuery}
                      onChange={(e) => setTardinessSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 w-44 sm:w-56"
                    />
                  </div>
                </div>

              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <th className="py-2.5 px-3">Employee &amp; Role</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Shift Date</th>
                      <th className="py-2.5 px-3">Scheduled &rarr; Clock-In</th>
                      <th className="py-2.5 px-3 text-center">Delay</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Identified Root Cause &amp; Manager Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {departmentTardinessAnalytics.filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No attendance or tardiness records matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      departmentTardinessAnalytics.filteredRecords.map((record) => {
                        const isLate = record.status === 'late' || record.status === 'no_show';
                        return (
                          <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">

                            {/* Employee */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {record.avatarUrl ? (
                                  <img
                                    src={record.avatarUrl}
                                    alt={record.employeeName}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {record.employeeName.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900">{record.employeeName}</div>
                                  <div className="text-[11px] text-slate-500">{record.employeeRole}</div>
                                </div>
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                {record.employeeDept}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {record.shiftDate}
                            </td>

                            {/* Scheduled vs Clock in */}
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              <span className="text-slate-500">{record.scheduledStartTime}</span>
                              <span className="mx-1 text-slate-400">&rarr;</span>
                              <span className={isLate ? 'font-bold text-amber-700' : 'text-emerald-700'}>
                                {record.actualClockInTime}
                              </span>
                            </td>

                            {/* Delay (minutes) */}
                            <td className="py-2.5 px-3 text-center">
                              {record.lateMinutes > 0 ? (
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  record.lateMinutes >= 15
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  +{record.lateMinutes} min
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">0 min</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3">
                              {record.status === 'late' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                                  Tardy
                                </span>
                              )}
                              {record.status === 'on_time' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                                  On Time
                                </span>
                              )}
                              {record.status === 'excused' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                                  Excused
                                </span>
                              )}
                              {record.status === 'no_show' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                                  No Show
                                </span>
                              )}
                            </td>

                            {/* Reason & Resolution */}
                            <td className="py-2.5 px-3">
                              <div className="max-w-md">
                                {record.reason ? (
                                  <div className="text-slate-700 font-medium text-[11px] truncate">
                                    {record.reason}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">Normal clock-in punctuality</div>
                                )}
                                {record.managerNote && (
                                  <div className="text-[10px] text-slate-500 mt-0.5 italic truncate">
                                    Note: {record.managerNote}
                                  </div>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 8. FULL EMPLOYEE 40-HOUR WEEKLY THRESHOLD AUDIT ROSTER */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                40
              </div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Employee Weekly Hours &amp; 40-Hour Threshold Audit</span>
                {overallMetrics.overtimeCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                    🚨 {overallMetrics.overtimeCount} Violations
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Complete roster inspection highlighting active staff against the 40-hour legal threshold with wage impact
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThresholdAuditTable(!showThresholdAuditTable)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              {showThresholdAuditTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showThresholdAuditTable ? 'Collapse Table' : 'Expand Table'}</span>
            </button>
          </div>
        </div>

        {showThresholdAuditTable && (
          <div className="space-y-4">
            {/* Quick Status Pill Bar */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <button
                onClick={() => setOvertimeFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  overtimeFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>All Active Staff</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20">{overallMetrics.employeeOvertimeList.length}</span>
              </button>

              <button
                onClick={() => setOvertimeFilter('overtime_only')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  overtimeFilter === 'overtime_only'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Exceeding 40h Threshold</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-200/80 text-rose-900 font-bold">{overallMetrics.overtimeCount}</span>
              </button>

              <button
                onClick={() => setOvertimeFilter('approaching')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  overtimeFilter === 'approaching'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>Approaching 36-40h</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-200/80 text-amber-900 font-bold">{overallMetrics.approachingCount}</span>
              </button>
            </div>

            {/* Comprehensive Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                    <th className="py-3 px-3.5">Employee</th>
                    <th className="py-3 px-3">Department &amp; Role</th>
                    <th className="py-3 px-3.5 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span>Weekly Hours / 40h Threshold</span>
                        <span className="text-rose-600 font-mono text-[10px] font-bold">| 40h Mark</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 font-mono">Regular (≤40h)</th>
                    <th className="py-3 px-3 font-mono">Overtime (&gt;40h)</th>
                    <th className="py-3 px-3 font-mono text-right">OT Penalty</th>
                    <th className="py-3 px-3.5 font-mono text-right">Gross Pay</th>
                    <th className="py-3 px-3 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOvertimeList.map((item) => {
                    const isOvertime = item.status === 'overtime';
                    const isApproaching = item.status === 'approaching';
                    const otWage = (item.employee.hourlyWage || 20) * 1.5;
                    const regularPct = Math.min(100, (Math.min(40, item.totalHours) / 48) * 100);
                    const overtimePct = Math.min(100, (Math.max(0, item.totalHours - 40) / 48) * 100);
                    const thresholdLinePct = (40 / 48) * 100; // 83.33%

                    return (
                      <tr
                        key={`table-${item.employee.id}`}
                        className={`transition-colors ${
                          isOvertime
                            ? 'bg-rose-50/70 hover:bg-rose-100/60 font-semibold'
                            : isApproaching
                            ? 'bg-amber-50/40 hover:bg-amber-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Employee Avatar & Name */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                              isOvertime ? 'bg-rose-600 ring-2 ring-rose-300' :
                              isApproaching ? 'bg-amber-500' : 'bg-sky-600'
                            }`}>
                              {item.employee.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className={`font-bold ${isOvertime ? 'text-rose-950 font-black' : 'text-slate-900'}`}>
                                {item.employee.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Base: ${item.employee.hourlyWage || 20}/hr
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department & Role */}
                        <td className="py-3 px-3">
                          <div className="text-slate-800 font-semibold">{item.employee.department}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.employee.role}</div>
                        </td>

                        {/* Visual Threshold Bar */}
                        <td className="py-3 px-3.5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-mono">
                              <span className={isOvertime ? 'text-rose-700 font-black' : 'text-slate-800 font-bold'}>
                                {item.totalHours} hrs
                              </span>
                              {isOvertime ? (
                                <span className="text-rose-700 text-[10px] font-black animate-pulse">
                                  +{item.overtimeHours}h over 40h limit
                                </span>
                              ) : isApproaching ? (
                                <span className="text-amber-700 text-[10px] font-semibold">
                                  {(40 - item.totalHours).toFixed(1)}h until 40h
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">
                                  {(40 - item.totalHours).toFixed(1)}h remaining
                                </span>
                              )}
                            </div>

                            <div className="relative h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                              {/* 40h Indicator Vertical Line */}
                              <div
                                className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-600 shadow-xs"
                                style={{ left: `${thresholdLinePct}%` }}
                                title="40-Hour Overtime Limit Line"
                              />

                              {/* Regular Hours portion */}
                              <div
                                className={`h-full ${
                                  isOvertime ? 'bg-rose-500' :
                                  isApproaching ? 'bg-amber-500' : 'bg-sky-600'
                                }`}
                                style={{ width: `${regularPct}%` }}
                              />

                              {/* Overtime portion (>40h) */}
                              {isOvertime && (
                                <div
                                  className="h-full bg-red-900 relative"
                                  style={{ width: `${overtimePct}%` }}
                                />
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Regular Hours & Pay */}
                        <td className="py-3 px-3 font-mono text-slate-700">
                          <div>{item.regularHours} hrs</div>
                          <div className="text-[10px] text-slate-400">${item.regularPay}</div>
                        </td>

                        {/* Overtime Hours & Rate */}
                        <td className="py-3 px-3 font-mono">
                          {item.overtimeHours > 0 ? (
                            <div>
                              <span className="text-rose-700 font-bold">+{item.overtimeHours} hrs</span>
                              <div className="text-[10px] text-rose-600 font-semibold">@ ${otWage.toFixed(2)}/hr (1.5x)</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">0.0 hrs</span>
                          )}
                        </td>

                        {/* OT Penalty */}
                        <td className="py-3 px-3 font-mono text-right">
                          {item.overtimeHours > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md border border-rose-200">
                              +${item.overtimePay}
                            </span>
                          ) : (
                            <span className="text-slate-400">$0</span>
                          )}
                        </td>

                        {/* Total Gross Pay */}
                        <td className="py-3 px-3.5 font-mono font-bold text-right">
                          <span className={isOvertime ? 'text-rose-700 text-sm' : 'text-slate-900'}>
                            ${item.totalPay.toLocaleString()}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          {isOvertime ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Exceeds 40h</span>
                            </span>
                          ) : isApproaching ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Approaching</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Standard</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Summary Notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                Fair Labor Standards Act (FLSA) compliance: Overtime is calculated at 1.5x base hourly rate for all hours exceeding 40.0 hours per workweek.
              </span>
              <span className="font-mono text-slate-900 font-bold">
                Total Overtime Liability: <strong className="text-rose-700">${overallMetrics.overtimeCostTotal.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* POS Department Mapping Configuration Modal */}
      <POSDepartmentMappingModal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        posMappings={currentPOSMappings}
        initialMapping={currentPOSMappings[currentActivePOSId] || INITIAL_POS_DEPARTMENT_MAPPINGS[currentActivePOSId] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast']}
        onSaveMapping={handleSaveInternalMapping}
        activePOSId={currentActivePOSId}
        onSelectActivePOS={handleSelectInternalPOS}
        shifts={shifts}
        employees={employees}
      />

    </div>
  );
};