import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  Filter, 
  Sparkles, 
  Send, 
  Edit3, 
  Trash2, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  PieChart, 
  Search, 
  Layers, 
  Sunrise, 
  Sun, 
  Moon, 
  Zap, 
  Bookmark, 
  ChevronDown, 
  X, 
  Check, 
  Sliders,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Shield,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { Shift, Employee, Department, RestaurantRole, SupportedLanguage, ShiftTemplate, ShiftPatternTag, DepartmentBudgetsMap, AvailabilityRequest, TimeOffRequest } from '../types';
import { translations } from '../utils/i18n';
import { ShiftTemplatesModal } from './ShiftTemplatesModal';
import { DepartmentBudgetModal } from './DepartmentBudgetModal';
import { SmartAutoFillModal } from './SmartAutoFillModal';
import { AIPaperScheduleScannerModal } from './AIPaperScheduleScannerModal';
import { OvertimePublishConfirmationModal, OvertimeItemSummary } from './OvertimePublishConfirmationModal';
import { INITIAL_DEPARTMENT_BUDGETS } from '../data/mockData';

const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

interface ScheduleCalendarViewProps {
  shifts: Shift[];
  employees: Employee[];
  weekDates: { dateStr: string; dayName: string; dayNumber: number; fullDate: Date }[];
  currentLanguage: SupportedLanguage;
  templates: ShiftTemplate[];
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onAddBatchShifts?: (shifts: Omit<Shift, 'id'>[]) => void;
  onUpdateShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onOpenPublishModal: () => void;
  onOpenAIOptimizer: () => void;
  onOpenRemindersScheduler?: () => void;
  onSaveTemplate: (template: ShiftTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyTemplateToShift: (template: ShiftTemplate, employeeId: string, dateStr: string) => void;
  weeklySalesForecast?: number;
  departmentBudgets?: DepartmentBudgetsMap;
  onUpdateDepartmentBudgets?: (newBudgets: DepartmentBudgetsMap) => void;
}

export interface LaborCostGuardToastData {
  id: string;
  department: Department;
  budgetLimit: number;
  newScheduledCost: number;
  previousScheduledCost: number;
  excessAmount: number;
  percentUsed: number;
  triggerType: 'add_shift' | 'edit_shift' | 'batch_add' | 'template_apply' | 'live_audit';
  employeeName?: string;
  shiftDetails?: string;
  addedCost?: number;
  timestamp: string;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  shifts,
  employees,
  weekDates,
  currentLanguage,
  templates,
  onAddShift,
  onAddBatchShifts,
  onUpdateShift,
  onDeleteShift,
  onOpenPublishModal,
  onOpenAIOptimizer,
  onOpenRemindersScheduler,
  onSaveTemplate,
  onDeleteTemplate,
  onApplyTemplateToShift,
  weeklySalesForecast = 38500,
  departmentBudgets,
  onUpdateDepartmentBudgets,
}) => {
  const t = translations[currentLanguage];
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isAddingShift, setIsAddingShift] = useState(false);
  const [newShiftDate, setNewShiftDate] = useState<string>(weekDates[0]?.dateStr || '');
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isPaperScannerOpen, setIsPaperScannerOpen] = useState(false);
  const [isQuickShelfExpanded, setIsQuickShelfExpanded] = useState(true);
  const [isWarningDetailsExpanded, setIsWarningDetailsExpanded] = useState(false);
  const [warningFilter, setWarningFilter] = useState<'all' | 'daily_8h' | 'weekly_40h' | 'none'>('none');

  // Real-time Labor Cost Guard State & Auto-Dismiss Reference
  const [laborCostGuardToast, setLaborCostGuardToast] = useState<LaborCostGuardToastData | null>(null);
  const [isGuardEnabled, setIsGuardEnabled] = useState<boolean>(true);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Quick Dropdown for day-specific template apply
  const [dayTemplatePickerDate, setDayTemplatePickerDate] = useState<string | null>(null);

  // Form State for Add / Edit Modal
  const [formEmployeeId, setFormEmployeeId] = useState<string>(employees[0]?.id || '');
  const [formStartTime, setFormStartTime] = useState<string>('16:00');
  const [formEndTime, setFormEndTime] = useState<string>('23:30');
  const [formBreakMinutes, setFormBreakMinutes] = useState<number>(30);
  const [formNotes, setFormNotes] = useState<string>('Dinner rush coverage');
  const [formManagerNotes, setFormManagerNotes] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // "Save as template" form fields
  const [saveAsTemplateChecked, setSaveAsTemplateChecked] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateTag, setNewTemplateTag] = useState<ShiftPatternTag>('Opening');

  const departments: (Department | 'all')[] = [
    'all',
    'Front of House',
    'Back of House',
    'Bar & Beverage',
    'Kitchen Prep & Dish',
    'Management',
  ];

  // Helper to calculate total hours for a shift
  const getShiftHours = (s: Shift) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return Math.max(0, (diff - s.breakMinutes) / 60);
  };

  // Filtered shifts based on department, search, and warning compliance filters
  const filteredShifts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shifts.filter(s => {
      const matchesDept = selectedDepartment === 'all' || s.department === selectedDepartment;
      const matchesSearch = q === '' || 
        (s.employeeName || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q);

      let matchesWarning = true;
      if (warningFilter === 'daily_8h') {
        matchesWarning = getShiftHours(s) > 8;
      } else if (warningFilter === 'weekly_40h') {
        const empShifts = shifts.filter(other => other.employeeId === s.employeeId);
        const totalWkHours = empShifts.reduce((sum, other) => sum + getShiftHours(other), 0);
        matchesWarning = totalWkHours > 40;
      } else if (warningFilter === 'all') {
        const empShifts = shifts.filter(other => other.employeeId === s.employeeId);
        const totalWkHours = empShifts.reduce((sum, other) => sum + getShiftHours(other), 0);
        matchesWarning = getShiftHours(s) > 8 || totalWkHours > 40;
      }

      return matchesDept && matchesSearch && matchesWarning;
    });
  }, [shifts, selectedDepartment, searchQuery, warningFilter]);

  // Underneath Schedule Calculations (Labor, Hours, Overtime risks)
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalLaborCost = 0;
    const deptBreakdown: Record<Department, { hours: number; cost: number; shiftsCount: number }> = {
      'Front of House': { hours: 0, cost: 0, shiftsCount: 0 },
      'Back of House': { hours: 0, cost: 0, shiftsCount: 0 },
      'Bar & Beverage': { hours: 0, cost: 0, shiftsCount: 0 },
      'Kitchen Prep & Dish': { hours: 0, cost: 0, shiftsCount: 0 },
      'Management': { hours: 0, cost: 0, shiftsCount: 0 },
    };

    // Track employee total hours for overtime alert (>40 hrs) and single shifts >8h
    const empHoursMap: Record<string, { employeeId: string; name: string; hours: number; shiftsCount: number }> = {};
    const shiftsExceeding8h: { shift: Shift; hours: number; excessHours: number }[] = [];

    shifts.forEach(s => {
      const hrs = getShiftHours(s);
      const cost = hrs * s.hourlyWage;
      totalHours += hrs;
      totalLaborCost += cost;

      if (hrs > 8) {
        shiftsExceeding8h.push({
          shift: s,
          hours: Number(hrs.toFixed(2)),
          excessHours: Number((hrs - 8).toFixed(2)),
        });
      }

      if (deptBreakdown[s.department]) {
        deptBreakdown[s.department].hours += hrs;
        deptBreakdown[s.department].cost += cost;
        deptBreakdown[s.department].shiftsCount += 1;
      }

      if (!empHoursMap[s.employeeId]) {
        empHoursMap[s.employeeId] = { employeeId: s.employeeId, name: s.employeeName, hours: 0, shiftsCount: 0 };
      }
      empHoursMap[s.employeeId].hours += hrs;
      empHoursMap[s.employeeId].shiftsCount += 1;
    });

    const overtimeEmployees = Object.values(empHoursMap)
      .filter(e => e.hours > 40)
      .map(e => ({
        ...e,
        hours: Number(e.hours.toFixed(2)),
        overtimeHours: Number((e.hours - 40).toFixed(2)),
      }));

    const laborPercentage = weeklySalesForecast > 0 ? (totalLaborCost / weeklySalesForecast) * 100 : 0;
    const hasAnyWarning = shiftsExceeding8h.length > 0 || overtimeEmployees.length > 0;

    return {
      totalHours,
      totalLaborCost,
      deptBreakdown,
      overtimeEmployees,
      shiftsExceeding8h,
      hasAnyWarning,
      laborPercentage,
    };
  }, [shifts, weeklySalesForecast]);

  const liveBudgets = useMemo(() => {
    return departmentBudgets || INITIAL_DEPARTMENT_BUDGETS;
  }, [departmentBudgets]);

  // Real-time Department Budget & Budget Remaining Analytics
  const budgetAnalytics = useMemo(() => {
    const allDepartmentsList: Department[] = [
      'Front of House',
      'Back of House',
      'Bar & Beverage',
      'Kitchen Prep & Dish',
      'Management',
    ];

    const deptBudgetsList = allDepartmentsList.map((dept) => {
      const budget = liveBudgets[dept] || 0;
      const scheduled = stats.deptBreakdown[dept] || { hours: 0, cost: 0, shiftsCount: 0 };
      const remaining = budget - scheduled.cost;
      const percentUsed = budget > 0 ? (scheduled.cost / budget) * 100 : (scheduled.cost > 0 ? 100 : 0);
      let status: 'safe' | 'warning' | 'over_budget' = 'safe';
      if (remaining < 0) status = 'over_budget';
      else if (percentUsed >= 85) status = 'warning';

      return {
        department: dept,
        weeklyBudget: budget,
        scheduledCost: scheduled.cost,
        scheduledHours: scheduled.hours,
        shiftsCount: scheduled.shiftsCount,
        remainingBudget: remaining,
        percentUsed: Number(percentUsed.toFixed(1)),
        status,
      };
    });

    const totalWeeklyBudget = Object.values(liveBudgets).reduce<number>((acc, v) => acc + (Number(v) || 0), 0);
    const totalScheduledCost = stats.totalLaborCost;
    const totalRemainingBudget = totalWeeklyBudget - totalScheduledCost;
    const totalPercentUsed = totalWeeklyBudget > 0 ? (totalScheduledCost / totalWeeklyBudget) * 100 : 0;
    const isOverTotalBudget = totalRemainingBudget < 0;

    // Filter-specific budget context
    const activeDeptInfo = selectedDepartment !== 'all' 
      ? deptBudgetsList.find((d) => d.department === selectedDepartment) || null
      : null;

    return {
      deptBudgetsList,
      totalWeeklyBudget,
      totalScheduledCost,
      totalRemainingBudget,
      totalPercentUsed: Number(totalPercentUsed.toFixed(1)),
      isOverTotalBudget,
      activeDeptInfo,
    };
  }, [liveBudgets, stats, selectedDepartment]);

  // REAL-TIME LABOR COST GUARD: Check if shift addition/modification pushes department over weekly budget
  const checkAndTriggerLaborCostGuard = (
    dept: Department,
    addedCost: number,
    employeeName?: string,
    shiftDetails?: string,
    triggerType: 'add_shift' | 'edit_shift' | 'batch_add' | 'template_apply' | 'live_audit' = 'add_shift'
  ) => {
    if (!isGuardEnabled) return;
    const deptBudget = liveBudgets[dept] || 0;
    const currentDeptCost = stats.deptBreakdown[dept]?.cost || 0;
    const newDeptCost = currentDeptCost + addedCost;

    if (deptBudget > 0 && newDeptCost > deptBudget) {
      const excess = newDeptCost - deptBudget;
      const pct = (newDeptCost / deptBudget) * 100;
      
      const toastData: LaborCostGuardToastData = {
        id: `guard-toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        department: dept,
        budgetLimit: deptBudget,
        newScheduledCost: Number(newDeptCost.toFixed(2)),
        previousScheduledCost: Number(currentDeptCost.toFixed(2)),
        excessAmount: Number(excess.toFixed(2)),
        percentUsed: Number(pct.toFixed(1)),
        triggerType,
        employeeName,
        shiftDetails,
        addedCost: Number(addedCost.toFixed(2)),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setLaborCostGuardToast(toastData);

      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = setTimeout(() => {
        setLaborCostGuardToast(null);
      }, 8500);
    }
  };

  // Batch add shifts with Labor Cost Guard calculation
  const handleBatchAddShifts = (newShifts: Omit<Shift, 'id'>[]) => {
    const batchDeptCosts: Record<Department, { cost: number; count: number; names: string[] }> = {
      'Front of House': { cost: 0, count: 0, names: [] },
      'Back of House': { cost: 0, count: 0, names: [] },
      'Bar & Beverage': { cost: 0, count: 0, names: [] },
      'Kitchen Prep & Dish': { cost: 0, count: 0, names: [] },
      'Management': { cost: 0, count: 0, names: [] },
    };

    newShifts.forEach(s => {
      const hrs = getShiftHours(s as Shift);
      const cost = hrs * s.hourlyWage;
      if (batchDeptCosts[s.department]) {
        batchDeptCosts[s.department].cost += cost;
        batchDeptCosts[s.department].count += 1;
        if (!batchDeptCosts[s.department].names.includes(s.employeeName)) {
          batchDeptCosts[s.department].names.push(s.employeeName);
        }
      }
    });

    Object.entries(batchDeptCosts).forEach(([deptKey, data]) => {
      if (data.cost > 0) {
        checkAndTriggerLaborCostGuard(
          deptKey as Department,
          data.cost,
          data.names.slice(0, 2).join(', ') + (data.names.length > 2 ? ` +${data.names.length - 2} more` : ''),
          `${data.count} Batch Shifts (+${data.cost.toFixed(2)})`,
          'batch_add'
        );
      }
    });

    if (onAddBatchShifts) {
      onAddBatchShifts(newShifts);
    } else {
      newShifts.forEach(s => onAddShift(s));
    }
  };

  // Template Apply with Labor Cost Guard calculation
  const handleApplyTemplateToShiftWrapped = (template: ShiftTemplate, employeeId: string, dateStr: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      const targetDept = template.department || emp.department;
      const startM = parseTimeToMinutes(template.startTime);
      const endM = parseTimeToMinutes(template.endTime);
      let diff = endM >= startM ? endM - startM : (24 * 60 - startM) + endM;
      const durHours = Math.max(0, (diff - (template.breakMinutes || 0)) / 60);
      const cost = durHours * emp.hourlyWage;

      checkAndTriggerLaborCostGuard(
        targetDept,
        cost,
        emp.name,
        `${template.name} (${template.startTime}-${template.endTime})`,
        'template_apply'
      );
    }
    onApplyTemplateToShift(template, employeeId, dateStr);
  };

  // Real-time Employee Weekly Hours & Overtime (>40 hrs) and Daily Duration (>8 hrs) Map per Shift
  const shiftOvertimeMap = useMemo(() => {
    const map: Record<string, {
      isDailyOver8h: boolean;
      dailyExcessHours: number;
      isOvertime: boolean;
      isWeeklyOvertime: boolean;
      triggersOvertime: boolean;
      triggersWeeklyOvertime: boolean;
      hoursBeforeShift: number;
      hoursAfterShift: number;
      shiftHours: number;
      overtimeHoursOnThisShift: number;
      totalEmployeeWeekHours: number;
      weeklyExcessHours: number;
      employeeName: string;
      hasWarning: boolean;
    }> = {};

    // Group shifts by employeeId
    const shiftsByEmployee: Record<string, Shift[]> = {};
    shifts.forEach((s) => {
      if (!shiftsByEmployee[s.employeeId]) {
        shiftsByEmployee[s.employeeId] = [];
      }
      shiftsByEmployee[s.employeeId].push(s);
    });

    // For each employee, sort shifts chronologically (date, then startTime)
    Object.entries(shiftsByEmployee).forEach(([, empShifts]) => {
      const sorted = [...empShifts].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });

      let runningCumulativeHours = 0;
      const totalEmployeeWeekHours = sorted.reduce((sum, s) => sum + getShiftHours(s), 0);

      sorted.forEach((shift) => {
        const shiftHours = getShiftHours(shift);
        const hoursBeforeShift = runningCumulativeHours;
        runningCumulativeHours += shiftHours;
        const hoursAfterShift = runningCumulativeHours;

        const isDailyOver8h = shiftHours > 8;
        const dailyExcessHours = Math.max(0, shiftHours - 8);

        const isWeeklyOvertime = totalEmployeeWeekHours > 40;
        const triggersWeeklyOvertime = hoursBeforeShift < 40 && hoursAfterShift > 40;
        const isOvertime = hoursAfterShift > 40;
        const overtimeHoursOnThisShift = isOvertime
          ? Math.max(0, hoursAfterShift - Math.max(40, hoursBeforeShift))
          : 0;
        const weeklyExcessHours = Math.max(0, totalEmployeeWeekHours - 40);

        map[shift.id] = {
          isDailyOver8h,
          dailyExcessHours: Number(dailyExcessHours.toFixed(2)),
          isOvertime,
          isWeeklyOvertime,
          triggersOvertime: triggersWeeklyOvertime,
          triggersWeeklyOvertime,
          hoursBeforeShift: Number(hoursBeforeShift.toFixed(2)),
          hoursAfterShift: Number(hoursAfterShift.toFixed(2)),
          shiftHours: Number(shiftHours.toFixed(2)),
          overtimeHoursOnThisShift: Number(overtimeHoursOnThisShift.toFixed(2)),
          totalEmployeeWeekHours: Number(totalEmployeeWeekHours.toFixed(2)),
          weeklyExcessHours: Number(weeklyExcessHours.toFixed(2)),
          employeeName: shift.employeeName,
          hasWarning: isDailyOver8h || isWeeklyOvertime,
        };
      });
    });

    return map;
  }, [shifts]);

  const handleOpenAddModal = (dateStr?: string, prefillTemplate?: ShiftTemplate) => {
    setNewShiftDate(dateStr || weekDates[0]?.dateStr || '');
    setSaveAsTemplateChecked(false);
    setNewTemplateName('');
    setNewTemplateTag('Opening');

    if (prefillTemplate) {
      setSelectedTemplateId(prefillTemplate.id);
      setFormStartTime(prefillTemplate.startTime);
      setFormEndTime(prefillTemplate.endTime);
      setFormBreakMinutes(prefillTemplate.breakMinutes);
      setFormNotes(prefillTemplate.notes || '');
      setFormManagerNotes(prefillTemplate.managerNotes || '');
      // Try to find matching employee
      const match = employees.find(e => e.role === prefillTemplate.role) || employees.find(e => e.department === prefillTemplate.department) || employees[0];
      setFormEmployeeId(match?.id || employees[0]?.id || '');
    } else {
      setSelectedTemplateId('');
      setFormEmployeeId(employees[0]?.id || '');
      setFormStartTime('16:00');
      setFormEndTime('23:30');
      setFormBreakMinutes(30);
      setFormNotes('Dinner rush table station');
      setFormManagerNotes('');
    }
    setIsAddingShift(true);
  };

  const handleApplyTemplatePrefill = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    if (!tmplId) return;
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;

    setFormStartTime(tmpl.startTime);
    setFormEndTime(tmpl.endTime);
    setFormBreakMinutes(tmpl.breakMinutes);
    setFormNotes(tmpl.notes || '');
    setFormManagerNotes(tmpl.managerNotes || '');
    
    // Auto-select staff member with matching role or department if current employee does not match
    const currentEmp = employees.find(e => e.id === formEmployeeId);
    if (currentEmp && currentEmp.role !== tmpl.role) {
      const match = employees.find(e => e.role === tmpl.role) || employees.find(e => e.department === tmpl.department);
      if (match) {
        setFormEmployeeId(match.id);
      }
    }
  };

  const handleSaveAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formEmployeeId) || employees[0];
    if (!emp) return;

    const startM = parseTimeToMinutes(formStartTime);
    const endM = parseTimeToMinutes(formEndTime);
    let diff = endM >= startM ? endM - startM : (24 * 60 - startM) + endM;
    const durHours = Math.max(0, (diff - (formBreakMinutes || 0)) / 60);
    const shiftCost = durHours * emp.hourlyWage;

    // Real-Time Labor Cost Guard evaluation
    checkAndTriggerLaborCostGuard(
      emp.department,
      shiftCost,
      emp.name,
      `${formStartTime} - ${formEndTime} (${durHours.toFixed(1)}h)`,
      'add_shift'
    );

    onAddShift({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      role: emp.role,
      date: newShiftDate,
      startTime: formStartTime,
      endTime: formEndTime,
      breakMinutes: formBreakMinutes,
      hourlyWage: emp.hourlyWage,
      status: 'draft',
      color: emp.color,
      notes: formNotes,
      managerNotes: formManagerNotes.trim() || undefined,
    });

    // If user selected "Save as new template", save to library
    if (saveAsTemplateChecked && newTemplateName.trim()) {
      const createdTmpl: ShiftTemplate = {
        id: `tmpl-custom-${Date.now()}`,
        name: newTemplateName.trim(),
        patternTag: newTemplateTag,
        department: emp.department,
        role: emp.role,
        startTime: formStartTime,
        endTime: formEndTime,
        breakMinutes: formBreakMinutes,
        notes: formNotes.trim(),
        managerNotes: formManagerNotes.trim() || undefined,
        color: emp.color,
        isFavorite: true,
      };
      onSaveTemplate(createdTmpl);
    }

    setIsAddingShift(false);
  };

  const handleOpenEditModal = (shift: Shift) => {
    setEditingShift(shift);
    setFormEmployeeId(shift.employeeId);
    setFormStartTime(shift.startTime);
    setFormEndTime(shift.endTime);
    setFormBreakMinutes(shift.breakMinutes);
    setFormNotes(shift.notes || '');
    setFormManagerNotes(shift.managerNotes || '');
    setSelectedTemplateId('');
    setSaveAsTemplateChecked(false);
    setNewTemplateName(`${shift.role} ${shift.startTime}-${shift.endTime}`);
    setNewTemplateTag('Mid');
  };

  const handleSaveEditShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;

    const emp = employees.find(e => e.id === formEmployeeId) || employees[0];
    if (!emp) return;

    const oldHours = getShiftHours(editingShift);
    const oldCost = oldHours * editingShift.hourlyWage;

    const startM = parseTimeToMinutes(formStartTime);
    const endM = parseTimeToMinutes(formEndTime);
    let diff = endM >= startM ? endM - startM : (24 * 60 - startM) + endM;
    const newHours = Math.max(0, (diff - (formBreakMinutes || 0)) / 60);
    const newCost = newHours * emp.hourlyWage;

    if (editingShift.department === emp.department) {
      const deltaCost = newCost - oldCost;
      checkAndTriggerLaborCostGuard(
        emp.department,
        deltaCost,
        emp.name,
        `${formStartTime} - ${formEndTime} (${newHours.toFixed(1)}h)`,
        'edit_shift'
      );
    } else {
      // Department changed:
      checkAndTriggerLaborCostGuard(
        emp.department,
        newCost,
        emp.name,
        `${formStartTime} - ${formEndTime} (${newHours.toFixed(1)}h)`,
        'edit_shift'
      );
    }

    onUpdateShift({
      ...editingShift,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      role: emp.role,
      startTime: formStartTime,
      endTime: formEndTime,
      breakMinutes: formBreakMinutes,
      hourlyWage: emp.hourlyWage,
      color: emp.color,
      notes: formNotes,
      managerNotes: formManagerNotes.trim() || undefined,
    });

    // If user checked save as template
    if (saveAsTemplateChecked && newTemplateName.trim()) {
      const createdTmpl: ShiftTemplate = {
        id: `tmpl-custom-${Date.now()}`,
        name: newTemplateName.trim(),
        patternTag: newTemplateTag,
        department: emp.department,
        role: emp.role,
        startTime: formStartTime,
        endTime: formEndTime,
        breakMinutes: formBreakMinutes,
        notes: formNotes.trim(),
        managerNotes: formManagerNotes.trim() || undefined,
        color: emp.color,
        isFavorite: true,
      };
      onSaveTemplate(createdTmpl);
    }

    setEditingShift(null);
  };

  // Quick patterns for the shelf
  const favoriteOrCoreTemplates = useMemo(() => {
    const opening = templates.filter(t => t.patternTag === 'Opening');
    const mid = templates.filter(t => t.patternTag === 'Mid');
    const closing = templates.filter(t => t.patternTag === 'Closing');
    const rush = templates.filter(t => t.patternTag === 'Rush');
    return { opening, mid, closing, rush };
  }, [templates]);

  return (
    <div className="space-y-6 relative">

      {/* REAL-TIME LABOR COST GUARD TOAST ALERT */}
      {laborCostGuardToast && (
        <div 
          id="labor-cost-guard-toast"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-rose-400 p-4 text-slate-900 animate-in slide-in-from-top-4 fade-in duration-300 ring-4 ring-rose-500/10"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider rounded-md border border-rose-300">
                    Labor Cost Guard Alert
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {laborCostGuardToast.timestamp}
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 mt-0.5">
                  {laborCostGuardToast.department} Exceeded Budget!
                </h4>
              </div>
            </div>
            <button
              onClick={() => {
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setLaborCostGuardToast(null);
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Message & Metrics */}
          <div className="mt-2.5 p-2.5 bg-rose-50/90 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>Weekly Department Budget:</span>
              <span className="font-mono">${laborCostGuardToast.budgetLimit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>New Scheduled Cost:</span>
              <span className="font-mono text-rose-700">${laborCostGuardToast.newScheduledCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-black pt-1 border-t border-rose-200 text-rose-800">
              <span>Weekly Budget Overrun:</span>
              <span className="font-mono bg-rose-200/80 px-1.5 py-0.5 rounded">
                +${laborCostGuardToast.excessAmount.toFixed(2)} ({laborCostGuardToast.percentUsed}% Allocated)
              </span>
            </div>
            {laborCostGuardToast.employeeName && (
              <div className="text-[10px] text-slate-600 pt-1 border-t border-rose-200/60 font-medium">
                Triggered by: <strong>{laborCostGuardToast.employeeName}</strong> {laborCostGuardToast.shiftDetails ? `(${laborCostGuardToast.shiftDetails})` : ''} {laborCostGuardToast.addedCost ? `• +$${laborCostGuardToast.addedCost.toFixed(2)}` : ''}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedDepartment(laborCostGuardToast.department);
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                setLaborCostGuardToast(null);
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <span>View {laborCostGuardToast.department}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsBudgetModalOpen(true);
                  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                  setLaborCostGuardToast(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Adjust Budget
              </button>
              <button
                onClick={() => {
                  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                  setLaborCostGuardToast(null);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>

          {/* Progress Bar for Auto Dismiss */}
          <div className="mt-2.5 w-full bg-rose-100 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full animate-toast-shrink" />
          </div>
        </div>
      )}
      
      {/* Top Controls: Filter Pills, Search, Shift Templates Button, AI Optimizer, Publish */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-sky-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Department Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Department filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedDepartment === dept
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {dept === 'all' ? t.allDepartments : dept}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Right: Actions (Labor Cost Guard, Scheduled Reminders, Labor Budgets, Templates, AI Vision, AI Optimize, Publish) */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
          
          {/* Real-time Labor Cost Guard Active Indicator & Audit Trigger */}
          <button
            id="labor-cost-guard-status-btn"
            onClick={() => {
              const overLimitDepts = budgetAnalytics.deptBudgetsList.filter(d => d.status === 'over_budget');
              if (overLimitDepts.length > 0) {
                const first = overLimitDepts[0];
                checkAndTriggerLaborCostGuard(
                  first.department,
                  0,
                  undefined,
                  `Live Audit: ${first.scheduledHours.toFixed(1)} hrs ($${first.scheduledCost.toFixed(2)}) against $${first.weeklyBudget.toLocaleString()} limit`,
                  'live_audit'
                );
              } else {
                setIsGuardEnabled(!isGuardEnabled);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer group border ${
              !isGuardEnabled
                ? 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
                : budgetAnalytics.deptBudgetsList.some(d => d.status === 'over_budget')
                ? 'text-rose-900 bg-rose-50 hover:bg-rose-100 border-rose-300 ring-2 ring-rose-400/30 animate-pulse'
                : 'text-sky-900 bg-sky-50 hover:bg-sky-100 border-sky-200'
            }`}
            title="Real-time Labor Cost Guard: Monitors visible schedule against Department Budgets and fires alerts if any shift pushes a department over limit."
          >
            {budgetAnalytics.deptBudgetsList.some(d => d.status === 'over_budget') ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            ) : (
              <ShieldCheck className={`w-4 h-4 ${isGuardEnabled ? 'text-sky-600' : 'text-slate-400'} group-hover:scale-110 transition-transform`} />
            )}
            <span>Labor Cost Guard</span>
            <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md ${
              !isGuardEnabled
                ? 'bg-slate-200 text-slate-700'
                : budgetAnalytics.deptBudgetsList.some(d => d.status === 'over_budget')
                ? 'bg-rose-200 text-rose-950 font-mono'
                : 'bg-sky-200 text-sky-900'
            }`}>
              {!isGuardEnabled
                ? 'Paused'
                : budgetAnalytics.deptBudgetsList.some(d => d.status === 'over_budget')
                ? `${budgetAnalytics.deptBudgetsList.filter(d => d.status === 'over_budget').length} Over Limit`
                : 'Active'}
            </span>
          </button>

          {/* 24-Hour Scheduled Reminders Trigger Button */}
          {onOpenRemindersScheduler && (
            <button
              id="open-reminders-scheduler-btn"
              onClick={onOpenRemindersScheduler}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer group"
              title="Configure & Trigger 24-Hour WhatsApp & 1-Hour Shift Alerts"
            >
              <Zap className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>24h Alerts Trigger</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </button>
          )}

          {/* Department Weekly Labor Budgets Manager Button with Live Budget Remaining */}
          <button
            id="open-department-budgets-btn"
            onClick={() => setIsBudgetModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer group border ${
              budgetAnalytics.isOverTotalBudget
                ? 'text-rose-800 bg-rose-50 hover:bg-rose-100 border-rose-200'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            }`}
            title="Set Weekly Labor Budget for Each Department & View Live Budget Remaining"
          >
            <DollarSign className={`w-4 h-4 transition-transform group-hover:scale-110 ${
              budgetAnalytics.isOverTotalBudget ? 'text-rose-600' : 'text-emerald-600'
            }`} />
            <span>Labor Budgets</span>
            <span className={`ml-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
              budgetAnalytics.isOverTotalBudget
                ? 'bg-rose-200 text-rose-800'
                : 'bg-emerald-200/80 text-emerald-900'
            }`}>
              {budgetAnalytics.totalRemainingBudget >= 0 ? '+' : '-'}${Math.abs(Math.round(budgetAnalytics.totalRemainingBudget)).toLocaleString()} Rem
            </span>
          </button>

          {/* Shift Templates Library Button */}
          <button
            id="open-shift-templates-btn"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all shadow-xs cursor-pointer group"
          >
            <Layers className="w-4 h-4 text-sky-600 group-hover:rotate-12 transition-transform" />
            <span>Shift Templates</span>
            <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-sky-200/70 text-sky-800 rounded-full">
              {templates.length}
            </span>
          </button>

          {/* AI Paper Schedule Scanner Button */}
          <button
            id="open-paper-schedule-scanner-btn"
            onClick={() => setIsPaperScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-sky-950 bg-gradient-to-r from-sky-100 via-blue-50 to-indigo-100 hover:from-sky-200 hover:to-indigo-200 border border-sky-300 rounded-xl transition-all shadow-xs cursor-pointer group"
            title="Take picture of paper schedule sheet or printed timetable and auto-generate shifts with Gemini 3.7 Vision"
          >
            <Camera className="w-4 h-4 text-sky-700 group-hover:scale-110 transition-transform" />
            <span>Scan Paper Schedule</span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-sky-600 text-white rounded-md shadow-2xs">
              AI Vision
            </span>
          </button>

          <button
            id="ai-optimize-schedule-btn"
            onClick={onOpenAIOptimizer}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-600 animate-spin" style={{ animationDuration: '8s' }} />
            <span>AI Optimizer</span>
          </button>

          <button
            id="add-shift-btn"
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>{t.addShift}</span>
          </button>

          <button
            id="publish-schedule-btn"
            onClick={onOpenPublishModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 rounded-xl shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{t.publishSchedule}</span>
          </button>

        </div>

      </div>

      {/* QUICK SHIFT TEMPLATES SHELF (Accelerates schedule building) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 rounded-2xl p-3.5 sm:p-4 text-white shadow-md border border-slate-700/60">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-wide">
                Fast Template Palette
              </span>
              <span className="text-[11px] text-slate-300 ml-2 hidden sm:inline">
                Click any standard shift pattern to 1-click load into the schedule builder:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaperScannerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-amber-100 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-lg cursor-pointer transition-all"
              title="Snap photo of paper schedule sheet with AI Vision"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📸 Snap Paper Sheet</span>
            </button>
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="text-[11px] font-semibold text-sky-300 hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Templates</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsQuickShelfExpanded(!isQuickShelfExpanded)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isQuickShelfExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isQuickShelfExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Opening Pattern */}
            <div className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-2.5 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Sunrise className="w-3 h-3" /> Opening
                </span>
                <span className="font-mono text-[10px] text-slate-300">06:30 - 15:00</span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mb-2">
                Morning FOH &amp; Kitchen Prep
              </p>
              <button
                onClick={() => {
                  const tmpl = favoriteOrCoreTemplates.opening[0] || templates[0];
                  handleOpenAddModal(undefined, tmpl);
                }}
                className="w-full py-1 bg-amber-400/20 hover:bg-amber-400 text-amber-200 hover:text-slate-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Use Opening Pattern</span>
              </button>
            </div>

            {/* Mid Pattern */}
            <div className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-2.5 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-sky-300 flex items-center gap-1">
                  <Sun className="w-3 h-3" /> Mid / Lunch
                </span>
                <span className="font-mono text-[10px] text-slate-300">10:30 - 16:30</span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mb-2">
                Lunch Peak Turn &amp; Expo
              </p>
              <button
                onClick={() => {
                  const tmpl = favoriteOrCoreTemplates.mid[0] || templates[0];
                  handleOpenAddModal(undefined, tmpl);
                }}
                className="w-full py-1 bg-sky-400/20 hover:bg-sky-400 text-sky-200 hover:text-slate-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Use Mid-Day Pattern</span>
              </button>
            </div>

            {/* Closing Pattern */}
            <div className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-2.5 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-indigo-300 flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Closing
                </span>
                <span className="font-mono text-[10px] text-slate-300">17:00 - 02:00</span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mb-2">
                Night Clean, Safe &amp; Lockup
              </p>
              <button
                onClick={() => {
                  const tmpl = favoriteOrCoreTemplates.closing[0] || templates[0];
                  handleOpenAddModal(undefined, tmpl);
                }}
                className="w-full py-1 bg-indigo-400/20 hover:bg-indigo-400 text-indigo-200 hover:text-slate-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Use Closing Pattern</span>
              </button>
            </div>

            {/* Dinner Rush Pattern */}
            <div className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-2.5 transition-all flex flex-col justify-between group">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-rose-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Dinner Rush
                </span>
                <span className="font-mono text-[10px] text-slate-300">15:30 - 23:30</span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mb-2">
                Hot Line &amp; Craft Mixology
              </p>
              <button
                onClick={() => {
                  const tmpl = favoriteOrCoreTemplates.rush[0] || templates[0];
                  handleOpenAddModal(undefined, tmpl);
                }}
                className="w-full py-1 bg-rose-400/20 hover:bg-rose-400 text-rose-200 hover:text-slate-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Use Rush Pattern</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REAL-TIME DEPARTMENT LABOR BUDGET & BUDGET REMAINING INDICATOR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-sky-100">
        
        {/* Header with Title & Adjust Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
              budgetAnalytics.activeDeptInfo
                ? budgetAnalytics.activeDeptInfo.status === 'over_budget'
                  ? 'bg-rose-600'
                  : budgetAnalytics.activeDeptInfo.status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-sky-600'
                : budgetAnalytics.isOverTotalBudget
                ? 'bg-rose-600'
                : 'bg-emerald-600'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">
                  {budgetAnalytics.activeDeptInfo
                    ? `${budgetAnalytics.activeDeptInfo.department} Live Labor Budget`
                    : 'Real-Time Department Labor Budget & Remaining Allowance'}
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                  budgetAnalytics.activeDeptInfo
                    ? budgetAnalytics.activeDeptInfo.status === 'over_budget'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : budgetAnalytics.activeDeptInfo.status === 'warning'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : budgetAnalytics.isOverTotalBudget
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {budgetAnalytics.activeDeptInfo
                    ? budgetAnalytics.activeDeptInfo.status === 'over_budget'
                      ? 'Over Budget'
                      : budgetAnalytics.activeDeptInfo.status === 'warning'
                      ? 'Approaching Limit'
                      : 'On Track'
                    : budgetAnalytics.isOverTotalBudget
                    ? 'Over Total Budget'
                    : 'Within Budget'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {budgetAnalytics.activeDeptInfo
                  ? `Tracking scheduled cost for ${budgetAnalytics.activeDeptInfo.department} against its weekly allocation`
                  : 'Instant recalculation as shifts are added, edited, dragged, or deleted'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-sky-600" />
              <span>Set Department Budgets</span>
            </button>
          </div>
        </div>

        {/* Main Stats: Weekly Budget, Scheduled Cost, and Real-Time Budget Remaining */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          
          {/* Weekly Budget */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {budgetAnalytics.activeDeptInfo ? `${budgetAnalytics.activeDeptInfo.department} Budget` : 'Total Labor Budget'}
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
              ${(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.weeklyBudget : budgetAnalytics.totalWeeklyBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Weekly allocation for current 7-day cycle
            </div>
          </div>

          {/* Scheduled Labor Cost */}
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">
              Scheduled Labor Cost
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
              ${(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.scheduledCost : budgetAnalytics.totalScheduledCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
              {(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.scheduledHours : stats.totalHours).toFixed(1)} hrs scheduled
            </div>
          </div>

          {/* Real-time Budget Remaining Indicator */}
          <div className={`border rounded-xl p-3.5 transition-all ${
            (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) >= 0
              ? 'bg-emerald-50/90 border-emerald-200'
              : 'bg-rose-50/90 border-rose-200'
          }`}>
            <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center justify-between ${
              (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) >= 0
                ? 'text-emerald-800'
                : 'text-rose-800'
            }`}>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Live Budget Remaining
              </span>
              <span className="text-[10px] font-mono font-black">
                {(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.percentUsed : budgetAnalytics.totalPercentUsed).toFixed(1)}% Used
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
              (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}>
              {(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) >= 0 ? '+' : '-'}
              ${Math.abs(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-[10px] font-semibold mt-0.5 ${
              (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}>
              {(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) >= 0
                ? `${(100 - (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.percentUsed : budgetAnalytics.totalPercentUsed)).toFixed(1)}% remaining in budget`
                : `Over budget by $${Math.abs(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget).toFixed(2)}`}
            </div>
          </div>

        </div>

        {/* Live Progress Meter */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span>Budget Expenditure Progress</span>
            <span className="font-mono font-bold">
              {(budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.percentUsed : budgetAnalytics.totalPercentUsed).toFixed(1)}% Allocated
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.remainingBudget : budgetAnalytics.totalRemainingBudget) < 0
                  ? 'bg-rose-500'
                  : (budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.percentUsed : budgetAnalytics.totalPercentUsed) >= 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, budgetAnalytics.activeDeptInfo ? budgetAnalytics.activeDeptInfo.percentUsed : budgetAnalytics.totalPercentUsed)}%`
              }}
            />
          </div>
        </div>

        {/* 5-Station Department Quick Cards (when viewing all) */}
        {selectedDepartment === 'all' && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Station Budget Health (Click to filter):
              </span>
              <span className="text-[10px] text-slate-400">
                5 Department Allocations
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {budgetAnalytics.deptBudgetsList.map((d) => (
                <button
                  key={d.department}
                  onClick={() => setSelectedDepartment(d.department)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group hover:shadow-xs ${
                    d.status === 'over_budget'
                      ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                      : d.status === 'warning'
                      ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-sky-50/60 hover:border-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 truncate">{d.department}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      d.status === 'over_budget' ? 'bg-rose-500 animate-pulse' : d.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      ${d.scheduledCost.toFixed(0)} / ${d.weeklyBudget.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${
                      d.remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {d.remainingBudget >= 0 ? '+' : '-'}${Math.abs(Math.round(d.remainingBudget))}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${
                        d.status === 'over_budget' ? 'bg-rose-500' : d.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, d.percentUsed)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MANAGER OVERTIME & LABOR COMPLIANCE WARNING BANNER */}
      {stats.hasAnyWarning && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-4 shadow-xs text-slate-900 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Manager Overtime &amp; Duration Alert</span>
                  </h4>
                  {stats.shiftsExceeding8h.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-200/90 text-amber-950 border border-amber-400 rounded-md text-[11px] font-bold font-mono">
                      ⚠️ {stats.shiftsExceeding8h.length} Shift{stats.shiftsExceeding8h.length === 1 ? '' : 's'} &gt; 8h Daily
                    </span>
                  )}
                  {stats.overtimeEmployees.length > 0 && (
                    <span className="px-2 py-0.5 bg-rose-200/90 text-rose-950 border border-rose-400 rounded-md text-[11px] font-bold font-mono">
                      ⚠️ {stats.overtimeEmployees.length} Staff &gt; 40h Weekly
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {stats.shiftsExceeding8h.length > 0 && stats.overtimeEmployees.length > 0
                    ? `Detected single shifts exceeding the 8.0-hour daily limit and employee weekly schedules exceeding the 40.0-hour cap.`
                    : stats.shiftsExceeding8h.length > 0
                    ? `Detected single shift durations exceeding the standard 8.0-hour daily limit.`
                    : `Detected employee weekly schedules exceeding the standard 40.0-hour weekly overtime threshold.`
                  }
                </p>
              </div>
            </div>

            {/* Quick Filter & Details Toggle */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex items-center bg-white border border-amber-300 rounded-xl p-0.5 text-xs font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setWarningFilter(warningFilter === 'all' ? 'none' : 'all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    warningFilter === 'all' ? 'bg-amber-500 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  All Alerts ({stats.shiftsExceeding8h.length + stats.overtimeEmployees.length})
                </button>
                {stats.shiftsExceeding8h.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWarningFilter(warningFilter === 'daily_8h' ? 'none' : 'daily_8h')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      warningFilter === 'daily_8h' ? 'bg-amber-500 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    &gt;8h Shifts ({stats.shiftsExceeding8h.length})
                  </button>
                )}
                {stats.overtimeEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWarningFilter(warningFilter === 'weekly_40h' ? 'none' : 'weekly_40h')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      warningFilter === 'weekly_40h' ? 'bg-rose-500 text-white font-bold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    &gt;40h Staff ({stats.overtimeEmployees.length})
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsWarningDetailsExpanded(!isWarningDetailsExpanded)}
                className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>{isWarningDetailsExpanded ? 'Hide Details' : 'View Breakdown'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isWarningDetailsExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expandable Breakdown Drawer */}
          {isWarningDetailsExpanded && (
            <div className="mt-3.5 pt-3 border-t border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Shifts > 8h list */}
              <div className="bg-white/90 rounded-xl p-3 border border-amber-200 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Single Shifts Exceeding 8 Hours ({stats.shiftsExceeding8h.length})</span>
                  </span>
                </div>
                {stats.shiftsExceeding8h.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic py-1">No single shifts exceed the 8h daily limit.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stats.shiftsExceeding8h.map(({ shift, hours, excessHours }) => (
                      <div
                        key={shift.id}
                        onClick={() => handleOpenEditModal(shift)}
                        className="p-2 rounded-lg bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200 flex items-center justify-between cursor-pointer transition-colors"
                        title="Click to edit shift timing"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 text-[11px] truncate flex items-center gap-1">
                            <span>{shift.employeeName}</span>
                            <span className="text-[10px] text-slate-500 font-normal">({shift.department})</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {shift.date} • {shift.startTime}-{shift.endTime} ({shift.role})
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-1.5 py-0.5 bg-amber-200 text-amber-950 font-bold font-mono rounded text-[10px] block">
                            {hours.toFixed(1)}h (+{excessHours.toFixed(1)}h OT)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Staff > 40h list */}
              <div className="bg-white/90 rounded-xl p-3 border border-rose-200 shadow-2xs">
                <div className="font-bold text-slate-800 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-rose-900 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Weekly Schedules Exceeding 40 Hours ({stats.overtimeEmployees.length})</span>
                  </span>
                </div>
                {stats.overtimeEmployees.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic py-1">No employee weekly totals exceed the 40h cap.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {stats.overtimeEmployees.map((emp) => (
                      <div
                        key={emp.employeeId}
                        className="p-2 rounded-lg bg-rose-50/80 border border-rose-200 flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 text-[11px] truncate">{emp.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {emp.shiftsCount} shifts scheduled this week
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="px-1.5 py-0.5 bg-rose-200 text-rose-950 font-bold font-mono rounded text-[10px] block">
                            {emp.hours.toFixed(1)}h (+{emp.overtimeHours.toFixed(1)}h OT)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7-Day Schedule Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        
        {/* Calendar Header: 7 Days */}
        <div className="grid grid-cols-1 sm:grid-cols-7 border-b border-slate-200 bg-sky-50/40 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          {weekDates.map((d, index) => {
            const isToday = new Date().toISOString().slice(0, 10) === d.dateStr;
            const dayShifts = filteredShifts.filter(s => s.date === d.dateStr);
            const dayHours = dayShifts.reduce((acc, s) => acc + getShiftHours(s), 0);

            return (
              <div key={d.dateStr} className={`p-3 ${isToday ? 'bg-sky-100/50' : ''}`}>
                <div className="flex sm:flex-col items-center justify-between sm:justify-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {d.dayName}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-1 mt-0.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${
                      isToday ? 'bg-sky-600 text-white' : 'text-slate-800'
                    }`}>
                      {d.dayNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({dayHours.toFixed(1)}h)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Body Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-7 min-h-[460px] divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {weekDates.map((d) => {
            const dayShifts = filteredShifts.filter(s => s.date === d.dateStr);

            return (
              <div key={d.dateStr} className="p-2 sm:p-2.5 bg-slate-50/20 flex flex-col justify-between space-y-2">
                
                {/* Shift cards container */}
                <div className="space-y-2">
                  {dayShifts.map((shift) => {
                    const hrs = getShiftHours(shift);
                    const otInfo = shiftOvertimeMap[shift.id];
                    const isDaily8h = otInfo?.isDailyOver8h;
                    const isWeekly40h = otInfo?.isWeeklyOvertime;
                    const hasWarning = isDaily8h || isWeekly40h;

                    return (
                      <div
                        key={shift.id}
                        onClick={() => handleOpenEditModal(shift)}
                        style={{ borderLeftColor: shift.color }}
                        className={`p-2.5 rounded-xl border border-l-4 shadow-xs transition-all cursor-pointer group text-left relative ${
                          isDaily8h && isWeekly40h
                            ? 'bg-gradient-to-br from-amber-50/95 via-rose-50/90 to-amber-50/95 border-amber-400 ring-2 ring-amber-500/70 hover:shadow-md'
                            : isDaily8h
                            ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/60 hover:bg-amber-100/90 hover:shadow-md'
                            : isWeekly40h
                            ? otInfo?.triggersWeeklyOvertime
                              ? 'bg-amber-50/95 border-amber-300 ring-2 ring-amber-400/60 hover:bg-amber-100/90 hover:shadow-md'
                              : 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/60 hover:bg-rose-100/90 hover:shadow-md'
                            : 'bg-white hover:bg-sky-50/40 border-slate-200 hover:shadow-md'
                        }`}
                      >
                        {/* Header: Employee Name & Overtime Alert Warning Icon */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 min-w-0 pr-1">
                            {hasWarning && (
                              <span 
                                title={
                                  isDaily8h && isWeekly40h
                                    ? `⚠️ Labor Alert: Single shift exceeds 8h (${hrs.toFixed(1)}h | +${otInfo?.dailyExcessHours}h) AND weekly schedule exceeds 40h (${otInfo?.totalEmployeeWeekHours}h | +${otInfo?.weeklyExcessHours}h OT)`
                                    : isDaily8h
                                    ? `⚠️ Daily Overtime Alert: Single shift is ${hrs.toFixed(1)} hrs (exceeds standard 8.0h limit by +${otInfo?.dailyExcessHours}h)`
                                    : `⚠️ Weekly Overtime Alert: ${shift.employeeName}'s weekly total reaches ${otInfo?.totalEmployeeWeekHours}h (+${otInfo?.weeklyExcessHours}h OT)`
                                }
                                className="shrink-0"
                              >
                                <AlertTriangle className={`w-3.5 h-3.5 ${isDaily8h && isWeekly40h ? 'text-rose-600' : isDaily8h ? 'text-amber-600' : 'text-rose-600'} animate-pulse`} />
                              </span>
                            )}
                            <span className={`font-bold text-xs truncate ${hasWarning ? 'text-amber-950 font-black' : 'text-slate-900'}`}>
                              {shift.employeeName}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isDaily8h
                              ? 'bg-amber-200/90 text-amber-950 font-black border border-amber-300'
                              : isWeekly40h
                              ? 'bg-rose-200/90 text-rose-950 font-black border border-rose-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {hrs.toFixed(1)}h {isDaily8h && '⚠️'}
                          </span>
                        </div>

                        {/* Role & Department */}
                        <div className="text-[11px] text-slate-600 font-medium truncate">
                          {shift.role}
                        </div>

                        {/* Shift Time & Break */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1">
                          <Clock className="w-3 h-3 text-sky-600 shrink-0" />
                          <span>{shift.startTime} - {shift.endTime}</span>
                        </div>

                        {/* Visual Daily Shift Duration Warning (>8 Hours) */}
                        {isDaily8h && (
                          <div className="flex items-center justify-between gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1.5 bg-amber-100/90 text-amber-900 border border-amber-300 shadow-2xs">
                            <span className="flex items-center gap-1 truncate">
                              <Clock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                              <span>&gt;8h Shift ({hrs.toFixed(1)}h)</span>
                            </span>
                            <span className="font-mono text-[9px] shrink-0 font-black text-amber-950">
                              +{otInfo?.dailyExcessHours}h OT
                            </span>
                          </div>
                        )}

                        {/* Visual Weekly Overtime Warning (>40 Weekly Hours) */}
                        {isWeekly40h && (
                          <div className={`flex items-center justify-between gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${isDaily8h ? 'mt-1' : 'mt-1.5'} border shadow-2xs ${
                            otInfo?.triggersWeeklyOvertime 
                              ? 'bg-amber-100/90 text-amber-900 border-amber-300' 
                              : 'bg-rose-100/90 text-rose-900 border-rose-300'
                          }`}>
                            <span className="flex items-center gap-1 truncate">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                              <span>{otInfo?.triggersWeeklyOvertime ? `>40h Breached` : `Weekly OT`}</span>
                            </span>
                            <span className="font-mono text-[9px] shrink-0 font-black">
                              {otInfo?.totalEmployeeWeekHours}h (+{otInfo?.weeklyExcessHours}h)
                            </span>
                          </div>
                        )}

                        {/* Manager Notes Badge */}
                        {shift.managerNotes && (
                          <div 
                            title={`Manager Note: ${shift.managerNotes}`}
                            className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md mt-1 bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs truncate"
                          >
                            <FileText className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span className="truncate">Note: {shift.managerNotes}</span>
                          </div>
                        )}

                        {/* Overtime Justification Note Badge if Approved */}
                        {shift.overtimeJustification && (
                          <div 
                            title={`Approved OT Justification: ${shift.overtimeJustification}`}
                            className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-md mt-1.5 bg-sky-50 text-sky-900 border border-sky-200 shadow-2xs truncate"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                            <span className="truncate">OT Approved: {shift.overtimeJustification.split('[')[0]}</span>
                          </div>
                        )}

                        {/* Status Badge & Actions on hover */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase ${
                            shift.status === 'published' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {shift.status}
                          </span>
                          
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <span className="text-sky-600 hover:text-sky-800 p-0.5" title="Edit Shift">
                              <Edit3 className="w-3 h-3" />
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteShift(shift.id);
                              }}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                              title="Delete Shift"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}

                  {dayShifts.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No shifts
                    </div>
                  )}
                </div>

                {/* Day Action Buttons: + Add Shift & + Quick Template */}
                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => handleOpenAddModal(d.dateStr)}
                    className="w-full py-1.5 text-[11px] font-semibold text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-dashed border-slate-200 hover:border-sky-300 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-sky-600" />
                    <span>Add Shift</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setDayTemplatePickerDate(dayTemplatePickerDate === d.dateStr ? null : d.dateStr)}
                      className="w-full py-1 text-[10px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50/70 hover:bg-sky-100/90 rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Layers className="w-2.5 h-2.5 text-sky-600" />
                      <span>+ Template</span>
                    </button>

                    {/* Day Template Dropdown Menu */}
                    {dayTemplatePickerDate === d.dateStr && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 z-30 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 animate-in fade-in zoom-in-95 text-left text-xs">
                        <div className="flex items-center justify-between pb-1 px-1 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase">
                          <span>Pick Template</span>
                          <button onClick={() => setDayTemplatePickerDate(null)} className="text-slate-400 hover:text-slate-700">✕</button>
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 mt-1">
                          {templates.slice(0, 6).map((tmpl) => (
                            <button
                              key={tmpl.id}
                              onClick={() => {
                                setDayTemplatePickerDate(null);
                                handleOpenAddModal(d.dateStr, tmpl);
                              }}
                              className="w-full p-1.5 hover:bg-sky-50 rounded-lg text-left transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="font-bold text-[11px] text-slate-800 group-hover:text-sky-700">{tmpl.name}</div>
                                <div className="text-[9px] text-slate-400 font-mono">{tmpl.startTime}-{tmpl.endTime} • {tmpl.role}</div>
                              </div>
                              <Plus className="w-3 h-3 text-sky-600 opacity-0 group-hover:opacity-100" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Underneath Schedule Metrics: Hours, Labor Costs, Overtime & Department Breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Weekly Labor Intelligence &amp; Cost Analysis (Underneath Schedule)
              </h3>
              <p className="text-xs text-slate-500">
                Real-time tracking of scheduled hours, gross wages, and restaurant labor ratio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500">
              Projected Sales: <strong className="text-slate-900">${weeklySalesForecast.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
              {t.totalHours}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.totalHours.toFixed(1)} <span className="text-sm font-medium text-slate-500">hrs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Avg {((stats.totalHours) / (employees.length || 1)).toFixed(1)} hrs / employee
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              {t.estimatedLabor}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              ${stats.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Avg Hourly: ${(stats.totalLaborCost / (stats.totalHours || 1)).toFixed(2)}/hr
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              {t.laborPercent}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats.laborPercentage.toFixed(1)}%
            </div>
            <div className="text-[11px] text-emerald-700 mt-0.5 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Target: 28-32% (Optimal)
            </div>
          </div>

          <div className={`border rounded-xl p-4 ${
            stats.hasAnyWarning ? 'bg-amber-50/90 border-amber-300 shadow-2xs' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-between">
              <span>Overtime &amp; Duration Alerts</span>
              {stats.hasAnyWarning && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
              {stats.shiftsExceeding8h.length + stats.overtimeEmployees.length}
              <span className="text-xs font-medium text-slate-500">
                ({stats.shiftsExceeding8h.length} &gt;8h • {stats.overtimeEmployees.length} &gt;40h)
              </span>
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 truncate">
              {stats.hasAnyWarning
                ? `${stats.shiftsExceeding8h.length} shift(s) >8h daily, ${stats.overtimeEmployees.length} employee(s) >40h weekly`
                : 'All shifts and schedules compliant'}
            </div>
          </div>

        </div>

        {/* Department-by-Department Breakdown Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Department Budget & Cost Breakdown</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-100 text-sky-800 rounded-md">
                5 Stations
              </span>
            </div>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Department Budgets</span>
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {budgetAnalytics.deptBudgetsList.map((item) => {
              const pctOfLabor = stats.totalLaborCost > 0 ? (item.scheduledCost / stats.totalLaborCost) * 100 : 0;
              return (
                <div key={item.department} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                  <div className="min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{item.department}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'over_budget' ? 'bg-rose-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.shiftsCount} Shifts Scheduled • {item.scheduledHours.toFixed(1)} Total Hours ({pctOfLabor.toFixed(1)}% of total labor)
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
                    {/* Scheduled vs Budget */}
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Scheduled / Budget</div>
                      <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        ${item.scheduledCost.toFixed(2)} <span className="text-slate-400 font-normal">/ ${item.weeklyBudget.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Real-time Budget Remaining */}
                    <div className="text-left sm:text-right min-w-[110px]">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Budget Remaining</div>
                      <div className={`font-mono font-bold text-xs sm:text-sm ${
                        item.remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {item.remainingBudget >= 0 ? '+' : '-'}${Math.abs(item.remainingBudget).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {item.percentUsed.toFixed(1)}% Used
                      </div>
                    </div>

                    {/* Progress Bar & Quick Adjust */}
                    <div className="w-24 sm:w-28 flex flex-col justify-center gap-1">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'over_budget' ? 'bg-rose-500' : item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentUsed)}%` }}
                        />
                      </div>
                      <button
                        onClick={() => setIsBudgetModalOpen(true)}
                        className="text-[10px] text-sky-600 hover:text-sky-800 text-right font-medium cursor-pointer"
                      >
                        Adjust &rarr;
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Add / Edit Shift Modal with Shift Template Integration */}
      {(isAddingShift || editingShift) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col">
            
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {isAddingShift ? t.addShift : t.editShift}
                </h3>
                {selectedTemplateId && (
                  <span className="px-2 py-0.5 text-[10px] bg-white/20 text-white rounded-md font-bold">
                    Template Loaded
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsAddingShift(false);
                  setEditingShift(null);
                }}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={isAddingShift ? handleSaveAddShift : handleSaveEditShift} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              {/* Template Quick Auto-Fill Selector */}
              <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-sky-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>⚡ Quick-Load Shift Template:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTemplatesModalOpen(true)}
                    className="text-[10px] text-sky-700 hover:underline font-semibold"
                  >
                    Browse All
                  </button>
                </div>

                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplatePrefill(e.target.value)}
                  className="w-full p-2 bg-white border border-sky-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose a Pattern (Opening, Mid, Closing, Rush) --</option>
                  <optgroup label="🌅 Opening Shifts">
                    {templates.filter(t => t.patternTag === 'Opening').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.startTime} - {t.endTime}, {t.role})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="☀️ Mid-Day & Lunch Shifts">
                    {templates.filter(t => t.patternTag === 'Mid').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.startTime} - {t.endTime}, {t.role})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🌙 Closing Shifts">
                    {templates.filter(t => t.patternTag === 'Closing').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.startTime} - {t.endTime}, {t.role})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚡ Peak Rush Shifts">
                    {templates.filter(t => t.patternTag === 'Rush').map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.startTime} - {t.endTime}, {t.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Employee Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    Assign Employee:
                  </label>
                  {employees.length > 100 && (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Showing active staff (Total: {employees.length.toLocaleString()})
                    </span>
                  )}
                </div>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  {employees.slice(0, 300).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role} ({emp.department}, ${emp.hourlyWage.toFixed(2)}/hr)
                    </option>
                  ))}
                  {employees.length > 300 && (
                    <option disabled value="">
                      ... and {(employees.length - 300).toLocaleString()} more staff members in database
                    </option>
                  )}
                </select>
              </div>

              {/* Date */}
              {isAddingShift && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Shift Date:
                  </label>
                  <select
                    value={newShiftDate}
                    onChange={(e) => setNewShiftDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  >
                    {weekDates.map((wd) => (
                      <option key={wd.dateStr} value={wd.dateStr}>
                        {wd.dayName} ({wd.dateStr})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Break Minutes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Unpaid Break Duration (Minutes):
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="15"
                  value={formBreakMinutes}
                  onChange={(e) => setFormBreakMinutes(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              {/* Station Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Station / Service Notes:
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Sauté lead, Bar closing duty, Main dining floor"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden text-sm"
                />
              </div>

              {/* Manager Notes (Visible to Employee) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                <label className="font-bold text-amber-950 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">
                    <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    Manager Notes (Visible to Employee):
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                    Employee Self-Service Sync
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={formManagerNotes}
                  onChange={(e) => setFormManagerNotes(e.target.value)}
                  placeholder="e.g. Lead pre-shift line check, oversee VIP Booth #4, coordinate floor sanitization..."
                  className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden resize-none placeholder:text-slate-400"
                />
                <p className="text-[10px] text-amber-800/80">
                  These instructions will appear highlighted directly in the employee's self-service schedule portal and agenda view.
                </p>
              </div>

              {/* SAVE AS TEMPLATE OPTION */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={saveAsTemplateChecked}
                    onChange={(e) => setSaveAsTemplateChecked(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 text-sky-600" />
                    Save this shift pattern as a reusable 'Shift Template'
                  </span>
                </label>

                {saveAsTemplateChecked && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-slate-200">
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1 text-[11px]">
                        Template Name:
                      </label>
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="e.g. Weekend Sauté Lead"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        required={saveAsTemplateChecked}
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1 text-[11px]">
                        Pattern Category:
                      </label>
                      <select
                        value={newTemplateTag}
                        onChange={(e) => setNewTemplateTag(e.target.value as ShiftPatternTag)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Opening">🌅 Opening</option>
                        <option value="Mid">☀️ Mid-Day / Lunch</option>
                        <option value="Closing">🌙 Closing</option>
                        <option value="Rush">⚡ Peak Rush</option>
                        <option value="Custom">⚙️ Custom</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Labor Cost Guard Live Budget Impact */}
              {(() => {
                const selectedEmp = employees.find(e => e.id === formEmployeeId) || employees[0];
                if (!selectedEmp) return null;
                const dept = selectedEmp.department;
                const deptBudget = liveBudgets[dept] || 0;
                const currentDeptCost = stats.deptBreakdown[dept]?.cost || 0;
                
                const startM = parseTimeToMinutes(formStartTime);
                const endM = parseTimeToMinutes(formEndTime);
                let diff = endM >= startM ? endM - startM : (24 * 60 - startM) + endM;
                const durHours = Math.max(0, (diff - (formBreakMinutes || 0)) / 60);
                const draftShiftCost = durHours * selectedEmp.hourlyWage;

                let projectedDeptCost = currentDeptCost + draftShiftCost;
                if (editingShift && editingShift.department === dept) {
                  const oldCost = getShiftHours(editingShift) * editingShift.hourlyWage;
                  projectedDeptCost = currentDeptCost - oldCost + draftShiftCost;
                }
                const isPushedOverBudget = deptBudget > 0 && projectedDeptCost > deptBudget;
                const overage = projectedDeptCost - deptBudget;
                const pctUsed = deptBudget > 0 ? (projectedDeptCost / deptBudget) * 100 : 100;

                return (
                  <div className={`p-3 rounded-xl border-2 transition-all ${
                    isPushedOverBudget 
                      ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-2xs' 
                      : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        {isPushedOverBudget ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span>Labor Cost Guard: {dept} Budget Check</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPushedOverBudget ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                      }`}>
                        {pctUsed.toFixed(1)}% Used
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-mono">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200">
                        <div className="text-[9px] text-slate-500 font-sans font-semibold uppercase">Shift Cost</div>
                        <div className="font-bold text-slate-900">${draftShiftCost.toFixed(2)}</div>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200">
                        <div className="text-[9px] text-slate-500 font-sans font-semibold uppercase">Weekly Budget</div>
                        <div className="font-bold text-slate-900">${deptBudget.toLocaleString()}</div>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${
                        isPushedOverBudget ? 'bg-rose-100/90 border-rose-300 text-rose-900' : 'bg-emerald-100/90 border-emerald-300 text-emerald-900'
                      }`}>
                        <div className="text-[9px] font-sans font-semibold uppercase">Projected Total</div>
                        <div className="font-bold">${projectedDeptCost.toFixed(2)}</div>
                      </div>
                    </div>

                    {isPushedOverBudget ? (
                      <div className="mt-2 text-[10px] text-rose-800 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Warning: Saving this shift will push {dept} over weekly budget by +${overage.toFixed(2)}.</span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Optimal: {dept} remains ${Math.abs(deptBudget - projectedDeptCost).toFixed(2)} under weekly cap.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Real-time Overtime Threshold Warning Preview in Modal */}
              {(() => {
                const selectedEmp = employees.find(e => e.id === formEmployeeId);
                const otherEmpShifts = shifts.filter(s => s.employeeId === formEmployeeId && (isAddingShift || s.id !== editingShift?.id));
                const priorHours = otherEmpShifts.reduce((acc, s) => acc + getShiftHours(s), 0);
                const startM = parseTimeToMinutes(formStartTime);
                const endM = parseTimeToMinutes(formEndTime);
                const durMinutes = Math.max(0, (endM >= startM ? endM - startM : (24 * 60 - startM) + endM) - (formBreakMinutes || 0));
                const currentDraftHours = durMinutes / 60;
                const projectedHours = priorHours + currentDraftHours;
                const isShiftOver8h = currentDraftHours > 8;
                const isWeeklyOver40h = projectedHours > 40;

                if (!isShiftOver8h && !isWeeklyOver40h) return null;

                return (
                  <div className="p-3 bg-amber-50/95 border-2 border-amber-300 rounded-xl text-amber-950 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 font-black text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                      <span>Manager Labor Alert: Compliance Warning</span>
                    </div>

                    {isShiftOver8h && (
                      <div className="bg-white/90 p-2.5 rounded-lg border border-amber-300 text-[11px] flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-amber-900 flex items-center gap-1.5">
                            <span>Single Shift Duration Exceeds 8.0 Hours</span>
                            <span className="px-1.5 py-0.2 bg-amber-200 text-amber-950 font-mono font-bold rounded text-[10px]">
                              {currentDraftHours.toFixed(1)}h (+{(currentDraftHours - 8).toFixed(1)}h daily OT)
                            </span>
                          </div>
                          <div className="text-slate-600 text-[10px] mt-0.5">
                            This single shift spans <strong>{currentDraftHours.toFixed(1)} net hours</strong> (after {formBreakMinutes}m break), triggering daily overtime policy thresholds.
                          </div>
                        </div>
                      </div>
                    )}

                    {isWeeklyOver40h && (
                      <div className="bg-white/90 p-2.5 rounded-lg border border-rose-300 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-bold text-rose-900 flex items-center gap-1.5">
                            <span>Weekly Schedule Exceeds 40.0 Hours Cap</span>
                            <span className="px-1.5 py-0.2 bg-rose-200 text-rose-950 font-mono font-bold rounded text-[10px]">
                              {projectedHours.toFixed(1)}h (+{(projectedHours - 40).toFixed(1)}h weekly OT)
                            </span>
                          </div>
                          <div className="text-slate-600 text-[10px] mt-0.5">
                            Scheduling this shift will bring <strong>{selectedEmp?.name || 'Employee'}</strong> to <strong>{projectedHours.toFixed(1)} hrs</strong> this week ({priorHours.toFixed(1)}h existing + {currentDraftHours.toFixed(1)}h new).
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingShift(false);
                    setEditingShift(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Shift
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* AI PAPER SCHEDULE SCANNER MODAL */}
      <AIPaperScheduleScannerModal
        isOpen={isPaperScannerOpen}
        onClose={() => setIsPaperScannerOpen(false)}
        employees={employees}
        weekDates={weekDates}
        currentLanguage={currentLanguage}
        onAddBatchShifts={handleBatchAddShifts}
      />

      {/* SHIFT TEMPLATES FULL MANAGEMENT MODAL */}
      <ShiftTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={templates}
        employees={employees}
        weekDates={weekDates}
        onSaveTemplate={onSaveTemplate}
        onDeleteTemplate={onDeleteTemplate}
        onApplyTemplateToShift={handleApplyTemplateToShiftWrapped}
      />

      {/* DEPARTMENT LABOR BUDGET MANAGEMENT MODAL */}
      <DepartmentBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        departmentBudgets={liveBudgets}
        onSaveBudgets={(newBudgets) => {
          if (onUpdateDepartmentBudgets) {
            onUpdateDepartmentBudgets(newBudgets);
          }
        }}
        shifts={shifts}
        weeklySalesForecast={weeklySalesForecast}
      />

    </div>
  );
};

