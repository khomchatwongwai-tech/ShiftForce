import React, { useState, useMemo } from 'react';
import {
  Employee,
  Shift,
  EmployeeDailyReminder,
  EmployeeHabit,
  EmployeeHabitLog,
  EmployeeGoal,
  ReminderCategory,
  ReminderPriority,
  HabitCategory,
  GoalCategory,
  GoalStatus
} from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Flame,
  Target,
  Bell,
  Plus,
  Sparkles,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  ListChecks,
  Layers,
  ShieldCheck,
  Coffee,
  Zap,
  X,
  CalendarCheck2,
  Trash2,
  Check,
  Smartphone,
  FileText
} from 'lucide-react';
import {
  INITIAL_EMPLOYEE_HABITS,
  generateInitialHabitLogs,
  INITIAL_EMPLOYEE_REMINDERS,
  INITIAL_EMPLOYEE_GOALS,
  generateMonthShiftsForEmployee
} from '../data/employeeCalendarData';

interface EmployeePersonalDevelopmentCalendarProps {
  currentEmployee: Employee;
  shifts: Shift[];
}

export const EmployeePersonalDevelopmentCalendar: React.FC<EmployeePersonalDevelopmentCalendarProps> = ({
  currentEmployee,
  shifts,
}) => {
  // Calendar Navigation State (Default to August 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-14');

  // Sub-view Tab inside Personal Development & Month Calendar Hub
  const [calendarViewMode, setCalendarViewMode] = useState<'month_grid' | 'habit_matrix' | 'goal_planner' | 'daily_agenda'>('month_grid');

  // Personal Reminders State
  const [reminders, setReminders] = useState<EmployeeDailyReminder[]>(INITIAL_EMPLOYEE_REMINDERS);

  // Professional Habits State
  const [habits, setHabits] = useState<EmployeeHabit[]>(INITIAL_EMPLOYEE_HABITS);
  const [habitLogs, setHabitLogs] = useState<EmployeeHabitLog[]>(() =>
    generateInitialHabitLogs(currentEmployee.id, INITIAL_EMPLOYEE_HABITS)
  );

  // Career Goals State
  const [goals, setGoals] = useState<EmployeeGoal[]>(INITIAL_EMPLOYEE_GOALS);

  // Form Modals
  const [showAddReminderModal, setShowAddReminderModal] = useState<boolean>(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState<boolean>(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState<boolean>(false);

  // New Reminder Form State
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState(selectedDate);
  const [newReminderTime, setNewReminderTime] = useState('15:30');
  const [newReminderCategory, setNewReminderCategory] = useState<ReminderCategory>('pre_shift');
  const [newReminderPriority, setNewReminderPriority] = useState<ReminderPriority>('medium');
  const [newReminderDesc, setNewReminderDesc] = useState('');

  // New Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('career_promotion');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2026-08-31');
  const [newGoalMilestone1, setNewGoalMilestone1] = useState('');
  const [newGoalMilestone2, setNewGoalMilestone2] = useState('');

  // New Habit Form State
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>('service_excellence');
  const [newHabitTargetDays, setNewHabitTargetDays] = useState(5);

  // Feedback Banner
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Combine passed shifts with full-month generated shifts for the employee
  const fullMonthEmployeeShifts = useMemo(() => {
    const directShifts = shifts.filter(s => s.employeeId === currentEmployee.id);
    const synthShifts = generateMonthShiftsForEmployee(currentEmployee, currentYear, currentMonth);

    // Merge: prefer direct shifts if matching same date
    const shiftMap = new Map<string, Shift>();
    synthShifts.forEach(s => shiftMap.set(s.date, s));
    directShifts.forEach(s => shiftMap.set(s.date, s));

    return Array.from(shiftMap.values());
  }, [shifts, currentEmployee, currentYear, currentMonth]);

  // Days in selected Month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(currentYear, currentMonth, 1));

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Selected Day Items
  const selectedDayShifts = fullMonthEmployeeShifts.filter(s => s.date === selectedDate);
  const selectedDayReminders = reminders.filter(r => r.date === selectedDate);

  // Toggle Habit for a specific date
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    setHabitLogs(prev => {
      const existingIdx = prev.findIndex(l => l.habitId === habitId && l.date === dateStr);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const nextCompleted = !updated[existingIdx].completed;
        updated[existingIdx] = {
          ...updated[existingIdx],
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
        return updated;
      } else {
        const newLog: EmployeeHabitLog = {
          id: `log-${currentEmployee.id}-${habitId}-${dateStr}`,
          habitId,
          employeeId: currentEmployee.id,
          date: dateStr,
          completed: true,
          completedAt: new Date().toISOString(),
          notes: 'Completed in portal',
        };
        return [...prev, newLog];
      }
    });

    // Update streak counter
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const newStreak = h.streakCount + 1;
        return {
          ...h,
          streakCount: newStreak,
          bestStreak: Math.max(h.bestStreak, newStreak),
        };
      }
      return h;
    }));

    showToast(`Habit logged for ${dateStr}! Streak updated.`);
  };

  // Toggle Reminder completion
  const handleToggleReminder = (reminderId: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id === reminderId) {
        const nextState = !r.isCompleted;
        if (nextState) showToast('Reminder marked complete!');
        return { ...r, isCompleted: nextState };
      }
      return r;
    }));
  };

  // Delete Reminder
  const handleDeleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    showToast('Reminder removed.');
  };

  // Toggle Goal Milestone
  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const updatedMilestones = g.milestones.map(m => {
          if (m.id === milestoneId) return { ...m, completed: !m.completed };
          return m;
        });
        const completedCount = updatedMilestones.filter(m => m.completed).length;
        const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
        const newStatus: GoalStatus = newProgress === 100 ? 'completed' : newProgress >= 50 ? 'on_track' : 'in_progress';

        return {
          ...g,
          milestones: updatedMilestones,
          progressPct: newProgress,
          status: newStatus,
        };
      }
      return g;
    }));
    showToast('Goal milestone updated!');
  };

  // Create new reminder handler
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;

    const newReminder: EmployeeDailyReminder = {
      id: `rem-${Date.now()}`,
      employeeId: currentEmployee.id,
      date: newReminderDate,
      time: newReminderTime,
      title: newReminderTitle.trim(),
      description: newReminderDesc.trim() || undefined,
      category: newReminderCategory,
      priority: newReminderPriority,
      isCompleted: false,
      notifyApp: true,
      notifySms: true,
    };

    setReminders(prev => [newReminder, ...prev]);
    setShowAddReminderModal(false);
    setNewReminderTitle('');
    setNewReminderDesc('');
    showToast(`Reminder scheduled for ${newReminderDate}!`);
  };

  // Create new Goal handler
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const milestones = [];
    if (newGoalMilestone1.trim()) {
      milestones.push({ id: `m-${Date.now()}-1`, title: newGoalMilestone1.trim(), completed: false });
    }
    if (newGoalMilestone2.trim()) {
      milestones.push({ id: `m-${Date.now()}-2`, title: newGoalMilestone2.trim(), completed: false });
    }
    if (milestones.length === 0) {
      milestones.push({ id: `m-${Date.now()}-1`, title: 'Complete foundational checklist', completed: false });
    }

    const newGoal: EmployeeGoal = {
      id: `goal-${Date.now()}`,
      employeeId: currentEmployee.id,
      title: newGoalTitle.trim(),
      description: newGoalDesc.trim() || 'Professional growth goal for hospitality leadership.',
      category: newGoalCategory,
      targetDate: newGoalTargetDate,
      progressPct: 0,
      status: 'in_progress',
      milestones,
      actionPlan: 'Track milestones daily on the Workqora employee calendar.',
    };

    setGoals(prev => [newGoal, ...prev]);
    setShowAddGoalModal(false);
    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalMilestone1('');
    setNewGoalMilestone2('');
    showToast('New career goal added to development plan!');
  };

  // Create new Habit handler
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const newHabit: EmployeeHabit = {
      id: `habit-${Date.now()}`,
      employeeId: currentEmployee.id,
      title: newHabitTitle.trim(),
      description: newHabitDesc.trim() || undefined,
      category: newHabitCategory,
      iconName: 'Sparkles',
      targetDaysPerWeek: newHabitTargetDays,
      streakCount: 0,
      bestStreak: 0,
      createdAt: new Date().toISOString().split('T')[0],
      active: true,
    };

    setHabits(prev => [...prev, newHabit]);
    setShowAddHabitModal(false);
    setNewHabitTitle('');
    setNewHabitDesc('');
    showToast('Professional habit tracker added!');
  };

  // Calculate monthly stats for the employee
  const totalMonthShifts = fullMonthEmployeeShifts.filter(s => {
    const [y, m] = s.date.split('-').map(Number);
    return y === currentYear && m === (currentMonth + 1);
  });

  const totalMonthHours = totalMonthShifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return sum + (diff - s.breakMinutes) / 60;
  }, 0);

  const completedHabitsThisMonth = habitLogs.filter(l => l.completed && l.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length;
  const activeStreakLeaders = [...habits].sort((a, b) => b.streakCount - a.streakCount)[0];

  return (
    <div className="space-y-6">

      {/* Toast Banner */}
      {notificationToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{notificationToast}</span>
          </div>
          <button onClick={() => setNotificationToast(null)} className="text-emerald-200 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Quick Metrics Bar */}
      <div className="bg-linear-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                Personal Development & Master Calendar
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{monthName} {currentYear} Employee Portal</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Synchronized work shifts, pre-shift reminders, daily hospitality habit tracking, and career milestone planning in one unified view.
            </p>
          </div>

          {/* Action Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setNewReminderDate(selectedDate);
                setShowAddReminderModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Reminder</span>
            </button>

            <button
              onClick={() => setShowAddGoalModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Set Career Goal</span>
            </button>

            <button
              onClick={() => setShowAddHabitModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {/* 4-Pillar Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold">Month Shifts</span>
              <CalendarIcon className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-lg font-black text-white">{totalMonthShifts.length} Shifts</div>
            <div className="text-[11px] text-sky-300 font-medium">{totalMonthHours.toFixed(1)} scheduled hrs</div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold">Top Habit Streak</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-400">{activeStreakLeaders?.streakCount || 0} Days 🔥</div>
            <div className="text-[11px] text-slate-300 truncate">{activeStreakLeaders?.title || 'Habit Tracking'}</div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold">Active Goals</span>
              <Target className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-white">{goals.filter(g => g.status === 'on_track' || g.status === 'in_progress').length} In-Flight</div>
            <div className="text-[11px] text-emerald-300 font-medium">Avg progress: {Math.round(goals.reduce((a, b) => a + b.progressPct, 0) / (goals.length || 1))}%</div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold">Check-Ins Logged</span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-black text-white">{completedHabitsThisMonth} Done</div>
            <div className="text-[11px] text-purple-300 font-medium">92% completion rate</div>
          </div>
        </div>
      </div>

      {/* Main View Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs overflow-x-auto">
        <button
          onClick={() => setCalendarViewMode('month_grid')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
            calendarViewMode === 'month_grid'
              ? 'bg-white text-sky-800 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-sky-600" />
          <span>Whole Month Master Calendar</span>
        </button>

        <button
          onClick={() => setCalendarViewMode('habit_matrix')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
            calendarViewMode === 'habit_matrix'
              ? 'bg-white text-amber-800 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>Professional Habits & Streaks ({habits.length})</span>
        </button>

        <button
          onClick={() => setCalendarViewMode('goal_planner')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
            calendarViewMode === 'goal_planner'
              ? 'bg-white text-indigo-800 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Target className="w-4 h-4 text-indigo-600" />
          <span>Career Goals & Milestones ({goals.length})</span>
        </button>

        <button
          onClick={() => setCalendarViewMode('daily_agenda')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
            calendarViewMode === 'daily_agenda'
              ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListChecks className="w-4 h-4 text-emerald-600" />
          <span>Daily Agenda ({selectedDate})</span>
        </button>
      </div>

      {/* VIEW 1: WHOLE MONTH INTERACTIVE CALENDAR GRID */}
      {calendarViewMode === 'month_grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main 7x5 Calendar Grid (8 Columns) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            {/* Month Navigation Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-sky-600" />
                  <span>{monthName} {currentYear}</span>
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full border border-sky-100">
                  {totalMonthShifts.length} Shifts Scheduled
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentYear(2026);
                    setCurrentMonth(7);
                    setSelectedDate('2026-08-14');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Month Date Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading padding days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[85px] bg-slate-50/50 rounded-xl border border-dashed border-slate-100 p-1.5 opacity-40" />
              ))}

              {/* Real Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === '2026-08-14';

                // Items on this day
                const dayShifts = fullMonthEmployeeShifts.filter(s => s.date === dateStr);
                const dayReminders = reminders.filter(r => r.date === dateStr);
                const dayCompletedHabits = habitLogs.filter(l => l.date === dateStr && l.completed);

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[92px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-400/20 shadow-xs'
                        : isToday
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    {/* Date Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-500 text-white shadow-xs'
                          : isSelected
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-700'
                      }`}>
                        {dayNumber}
                      </span>

                      {/* Micro Icons Bar */}
                      <div className="flex items-center gap-1">
                        {dayReminders.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title={`${dayReminders.length} Reminders`} />
                        )}
                        {dayCompletedHabits.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title={`${dayCompletedHabits.length} Habits Logged`} />
                        )}
                      </div>
                    </div>

                    {/* Cell Content: Shift Badge */}
                    <div className="space-y-1 mt-1">
                      {dayShifts.map(s => (
                        <div
                          key={s.id}
                          className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate leading-tight shadow-2xs flex items-center justify-between"
                          title={`${s.startTime} - ${s.endTime} (${s.role})`}
                        >
                          <span>{s.startTime}</span>
                          <span className="text-[9px] opacity-80">{s.role.split(' ')[0]}</span>
                        </div>
                      ))}

                      {/* Reminders preview chip */}
                      {dayReminders.slice(0, 1).map(r => (
                        <div
                          key={r.id}
                          className={`text-[9px] font-bold px-1 py-0.5 rounded-sm truncate flex items-center gap-0.5 ${
                            r.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Bell className="w-2 h-2 shrink-0" />
                          <span className="truncate">{r.title}</span>
                        </div>
                      ))}

                      {/* Habit Indicator */}
                      {dayCompletedHabits.length > 0 && dayShifts.length === 0 && (
                        <div className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded-sm flex items-center gap-0.5">
                          <Check className="w-2 h-2 text-emerald-600" />
                          <span>{dayCompletedHabits.length} Habits</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status line */}
                    <div className="text-[9px] text-slate-400 font-medium flex items-center justify-between pt-0.5">
                      <span>{dayShifts.length > 0 ? `${dayShifts[0].breakMinutes}m brk` : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-indigo-600 inline-block" />
                  Work Shift
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Reminder / Briefing
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Habit Check-In
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Click any day to manage agenda & habits</span>
            </div>
          </div>

          {/* Selected Day Agenda & Quick Habit Check-In Sidebar (4 Columns) */}
          <div className="lg:col-span-4 space-y-4">

            {/* Selected Day Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">Day Overview</span>
                  <h3 className="text-base font-black text-slate-900">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setNewReminderDate(selectedDate);
                    setShowAddReminderModal(true);
                  }}
                  className="p-1.5 hover:bg-sky-50 text-sky-600 rounded-lg transition-all"
                  title="Add Reminder for this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Work Shift on this day */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Work Shift Schedule</span>
                </span>

                {selectedDayShifts.length > 0 ? (
                  selectedDayShifts.map(s => (
                    <div key={s.id} className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-indigo-950 font-mono">
                          {s.startTime} - {s.endTime}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded-full">
                          {s.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-indigo-800 space-y-0.5">
                        <p className="font-semibold">{s.role} • {s.department}</p>
                        <p className="text-[11px] text-indigo-600">{s.notes || 'Floor station assignment'}</p>
                      </div>
                      {s.managerNotes && (
                        <div className="p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-lg text-amber-950 text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-[10px] text-amber-900">
                            <FileText className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>Manager Instructions & Notes:</span>
                          </div>
                          <p className="text-slate-700 text-[11px] leading-relaxed pl-4 font-normal">
                            {s.managerNotes}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-indigo-200/60 text-[11px] text-indigo-700">
                        <span>Wage: ${s.hourlyWage.toFixed(2)}/hr</span>
                        <span>Break: {s.breakMinutes} min</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                    <span>No work shifts scheduled for this date (Off Day).</span>
                  </div>
                )}
              </div>

              {/* 2. Daily Reminders on this day */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-rose-500" />
                    <span>Daily Reminders ({selectedDayReminders.length})</span>
                  </span>
                  <button
                    onClick={() => {
                      setNewReminderDate(selectedDate);
                      setShowAddReminderModal(true);
                    }}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700"
                  >
                    + Add
                  </button>
                </div>

                {selectedDayReminders.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayReminders.map(r => (
                      <div
                        key={r.id}
                        className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                          r.isCompleted
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : r.priority === 'urgent'
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => handleToggleReminder(r.id)}
                            className="flex items-center gap-2 text-left cursor-pointer flex-1"
                          >
                            {r.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <span className={`font-bold block ${r.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {r.title}
                              </span>
                              {r.time && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  {r.time} • {r.category.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </button>

                          <button
                            onClick={() => handleDeleteReminder(r.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Delete reminder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {r.description && (
                          <p className="text-[11px] text-slate-600 pl-6">{r.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No reminders set for this day.</p>
                )}
              </div>

              {/* 3. Daily Habit Check-In for this day */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Habit Check-In for {selectedDate.slice(5)}</span>
                </span>

                <div className="space-y-1.5">
                  {habits.map(habit => {
                    const log = habitLogs.find(l => l.habitId === habit.id && l.date === selectedDate);
                    const isDone = !!log?.completed;

                    return (
                      <div
                        key={habit.id}
                        onClick={() => handleToggleHabit(habit.id, selectedDate)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isDone
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className="truncate">{habit.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-600 font-bold shrink-0">
                          {habit.streakCount}d streak
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: PROFESSIONAL HABIT TRACKING MATRIX */}
      {calendarViewMode === 'habit_matrix' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Hospitality Professional Habit Streaks</span>
              </h2>
              <p className="text-xs text-slate-500">
                Consistent daily excellence: punctuality, specials study, upsell pacing, and station readiness.
              </p>
            </div>

            <button
              onClick={() => setShowAddHabitModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Habit</span>
            </button>
          </div>

          {/* Habits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map(habit => {
              // Calculate completion rate for this habit across August
              const habitMonthLogs = habitLogs.filter(l => l.habitId === habit.id && l.completed);
              const completionRate = Math.min(100, Math.round((habitMonthLogs.length / 14) * 100));

              return (
                <div key={habit.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{habit.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {habit.category.replace('_', ' ')} • Target {habit.targetDaysPerWeek} days/wk
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-amber-600 font-mono flex items-center gap-0.5">
                        {habit.streakCount} <span className="text-xs text-slate-500 font-normal">days</span> 🔥
                      </span>
                      <span className="text-[10px] text-slate-400 block">Best: {habit.bestStreak}d</span>
                    </div>
                  </div>

                  {habit.description && (
                    <p className="text-xs text-slate-600">{habit.description}</p>
                  )}

                  {/* 14-Day Micro Dot Matrix */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Recent 14-Day Check-in History</span>
                      <span className="font-bold text-slate-700">{completionRate}% Completed</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto py-1">
                      {Array.from({ length: 14 }).map((_, idx) => {
                        const day = idx + 1;
                        const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
                        const log = habitLogs.find(l => l.habitId === habit.id && l.date === dateStr);
                        const isDone = !!log?.completed;

                        return (
                          <div
                            key={dateStr}
                            onClick={() => handleToggleHabit(habit.id, dateStr)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${
                              isDone
                                ? 'bg-amber-500 text-white shadow-2xs hover:bg-amber-600'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title={`Aug ${day}: ${isDone ? 'Completed' : 'Missed'} (Click to toggle)`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <button
                      onClick={() => handleToggleHabit(habit.id, selectedDate)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Check-In for {selectedDate}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Created {habit.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: CAREER & SKILLS GOAL PLANNER */}
      {calendarViewMode === 'goal_planner' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Professional Career Goals & Milestone Planner</span>
              </h2>
              <p className="text-xs text-slate-500">
                Set milestones for supervisor promotion, SPLH speed benchmarks, zero tardiness, and guest review awards.
              </p>
            </div>

            <button
              onClick={() => setShowAddGoalModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Career Goal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => (
              <div key={goal.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {goal.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{goal.title}</h3>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    goal.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : goal.status === 'on_track'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {goal.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600">{goal.description}</p>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Progress</span>
                    <span className="text-indigo-600">{goal.progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${goal.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-700 block">Milestones & Action Plan:</span>
                  {goal.milestones.map(m => (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(goal.id, m.id)}
                      className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-slate-100 transition-all"
                    >
                      {m.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className={`text-xs ${m.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">
                          Due {m.dueDate.slice(5)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>Target Date: {goal.targetDate}</span>
                  {goal.metrics && (
                    <span className="font-semibold text-slate-700">
                      {goal.metrics.currentValue} / {goal.metrics.targetValue} {goal.metrics.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: DAILY AGENDA & REMINDERS LIST */}
      {calendarViewMode === 'daily_agenda' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-600" />
                <span>All Scheduled Reminders & Pre-Shift Briefings</span>
              </h2>
              <p className="text-xs text-slate-500">
                Manage all station duties, sommelier tastings, tipout logs, and compliance renewal dates.
              </p>
            </div>

            <button
              onClick={() => {
                setNewReminderDate(selectedDate);
                setShowAddReminderModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Daily Reminder</span>
            </button>
          </div>

          <div className="space-y-3">
            {reminders.map(rem => (
              <div
                key={rem.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  rem.isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : rem.priority === 'urgent'
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleReminder(rem.id)}
                    className="mt-0.5 p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                  >
                    {rem.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${rem.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {rem.title}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        rem.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {rem.priority}
                      </span>
                    </div>

                    {rem.description && (
                      <p className="text-xs text-slate-600">{rem.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>📅 Date: {rem.date}</span>
                      {rem.time && <span>⏰ {rem.time}</span>}
                      <span>🏷️ Category: {rem.category.replace('_', ' ')}</span>
                      {rem.notifySms && <span className="text-sky-600 flex items-center gap-0.5"><Smartphone className="w-3 h-3" /> SMS Active</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    title="Delete Reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD REMINDER */}
      {showAddReminderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-600" />
                <span>Add Daily Work & Pre-Shift Reminder</span>
              </h3>
              <button onClick={() => setShowAddReminderModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP table tasting, tipout verification"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newReminderCategory}
                    onChange={(e) => setNewReminderCategory(e.target.value as ReminderCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  >
                    <option value="pre_shift">Pre-Shift Briefing</option>
                    <option value="station_task">Station / Closing Task</option>
                    <option value="training">Training Workshop</option>
                    <option value="compliance">Compliance & Certs</option>
                    <option value="team_huddle">Team Huddle</option>
                    <option value="personal">Personal Note</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newReminderPriority}
                    onChange={(e) => setNewReminderPriority(e.target.value as ReminderPriority)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Details</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or checklist items..."
                  value={newReminderDesc}
                  onChange={(e) => setNewReminderDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddReminderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD GOAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Set Professional Career Goal</span>
              </h3>
              <button onClick={() => setShowAddGoalModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Trainer Promotion, $380/hr SPLH"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  >
                    <option value="career_promotion">Career Promotion</option>
                    <option value="hospitality_service">Hospitality & Service</option>
                    <option value="speed_efficiency">Speed & SPLH Benchmark</option>
                    <option value="certification">Certification & Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={newGoalTargetDate}
                    onChange={(e) => setNewGoalTargetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description & Impact</label>
                <textarea
                  rows={2}
                  placeholder="Why this goal matters and what success looks like..."
                  value={newGoalDesc}
                  onChange={(e) => setNewGoalDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Initial Milestones</label>
                <input
                  type="text"
                  placeholder="Milestone 1: Complete module or pass test..."
                  value={newGoalMilestone1}
                  onChange={(e) => setNewGoalMilestone1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                />
                <input
                  type="text"
                  placeholder="Milestone 2: Shadow shift supervisor on Friday..."
                  value={newGoalMilestone2}
                  onChange={(e) => setNewGoalMilestone2(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Career Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD HABIT */}
      {showAddHabitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Track Professional Habit</span>
              </h3>
              <button onClick={() => setShowAddHabitModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Habit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10m Early Arrival, Check 86 list, Water refill"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newHabitCategory}
                    onChange={(e) => setNewHabitCategory(e.target.value as HabitCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  >
                    <option value="punctuality">Punctuality & Arrival</option>
                    <option value="service_excellence">Service & Upselling</option>
                    <option value="station_readiness">Station Sanitation</option>
                    <option value="wellness_hydration">Wellness & Hydration</option>
                    <option value="learning_upsell">Menu & Specials Mastery</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Weekly Target Days</label>
                  <select
                    value={newHabitTargetDays}
                    onChange={(e) => setNewHabitTargetDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  >
                    <option value={3}>3 days / week</option>
                    <option value={4}>4 days / week</option>
                    <option value={5}>5 days / week</option>
                    <option value={6}>6 days / week</option>
                    <option value={7}>7 days / week</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Habit Routine Summary</label>
                <textarea
                  rows={2}
                  placeholder="How you will perform this daily routine..."
                  value={newHabitDesc}
                  onChange={(e) => setNewHabitDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Start Habit Streak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};