import {
  EmployeeDailyReminder,
  EmployeeHabit,
  EmployeeHabitLog,
  EmployeeGoal,
  Shift,
  Employee
} from '../types';

export const INITIAL_EMPLOYEE_HABITS: EmployeeHabit[] = [
  {
    id: 'habit-1',
    employeeId: 'emp-1',
    title: 'Arrive 10m Early & Uniform Check',
    description: 'Punctual arrival, apron pressed, name badge on, sharp appearance.',
    category: 'punctuality',
    iconName: 'Clock',
    targetDaysPerWeek: 5,
    streakCount: 12,
    bestStreak: 24,
    createdAt: '2026-07-01',
    active: true,
  },
  {
    id: 'habit-2',
    employeeId: 'emp-1',
    title: 'Daily Specials & 86 List Review',
    description: 'Study Chef specials, dietary allergens, and 86 board before service starts.',
    category: 'learning_upsell',
    iconName: 'Sparkles',
    targetDaysPerWeek: 5,
    streakCount: 9,
    bestStreak: 18,
    createdAt: '2026-07-01',
    active: true,
  },
  {
    id: 'habit-3',
    employeeId: 'emp-1',
    title: 'Recommend 3 Wine / Dessert Upsells',
    description: 'Suggest reserve wine pairing and dessert digestif to table guests.',
    category: 'service_excellence',
    iconName: 'Award',
    targetDaysPerWeek: 5,
    streakCount: 6,
    bestStreak: 15,
    createdAt: '2026-07-10',
    active: true,
  },
  {
    id: 'habit-4',
    employeeId: 'emp-1',
    title: 'Drink 2L Water & Mid-Shift Hydration',
    description: 'Stay energized and hydrated during 6-8 hour high-tempo dinner shifts.',
    category: 'wellness_hydration',
    iconName: 'Heart',
    targetDaysPerWeek: 7,
    streakCount: 14,
    bestStreak: 21,
    createdAt: '2026-07-01',
    active: true,
  },
  {
    id: 'habit-5',
    employeeId: 'emp-1',
    title: 'End-of-Shift Station Sanitization & Restock',
    description: 'Wipe POS terminal, polish silver, restock ramekins, leave station spotless.',
    category: 'station_readiness',
    iconName: 'CheckCircle2',
    targetDaysPerWeek: 5,
    streakCount: 16,
    bestStreak: 20,
    createdAt: '2026-07-05',
    active: true,
  },
];

export function generateInitialHabitLogs(employeeId: string, habits: EmployeeHabit[]): EmployeeHabitLog[] {
  const logs: EmployeeHabitLog[] = [];
  const daysInAugust = 31;
  const currentDay = 14; // current day in August 2026

  for (let day = 1; day <= daysInAugust; day++) {
    const dayStr = String(day).padStart(2, '0');
    const date = `2026-08-${dayStr}`;

    habits.forEach((habit, hIdx) => {
      // Past days up to currentDay
      if (day <= currentDay) {
        // High realistic completion rate (~85%)
        const completed = (day * 3 + hIdx * 7) % 10 !== 0;
        logs.push({
          id: `log-${employeeId}-${habit.id}-${date}`,
          habitId: habit.id,
          employeeId,
          date,
          completed,
          completedAt: completed ? `${date}T22:30:00Z` : undefined,
          notes: completed ? 'Completed on shift' : undefined,
        });
      }
    });
  }

  return logs;
}

export const INITIAL_EMPLOYEE_REMINDERS: EmployeeDailyReminder[] = [
  {
    id: 'rem-1',
    employeeId: 'emp-1',
    date: '2026-08-14',
    time: '15:45',
    title: 'Pre-Shift Wine Tasting & Halibut Special Briefing',
    description: 'Executive Chef tasting in Private Dining Room with Sommelier notes.',
    category: 'pre_shift',
    priority: 'high',
    isCompleted: false,
    notifyApp: true,
    notifySms: true,
  },
  {
    id: 'rem-2',
    employeeId: 'emp-1',
    date: '2026-08-14',
    time: '23:30',
    title: 'Submit Section Tip Out & Shift Summary in Toast POS',
    description: 'Verify CC tips, busser 3% tipout, bar 2% tipout before punch-out.',
    category: 'station_task',
    priority: 'medium',
    isCompleted: false,
    notifyApp: true,
  },
  {
    id: 'rem-3',
    employeeId: 'emp-1',
    date: '2026-08-15',
    time: '16:00',
    title: 'Saturday VIP Table 42 Birthday Celebration Notes',
    description: 'Guest requested champagne toast upon seating and gluten-free dessert menu.',
    category: 'service_excellence' as any,
    priority: 'urgent',
    isCompleted: false,
    notifyApp: true,
    notifySms: true,
  },
  {
    id: 'rem-4',
    employeeId: 'emp-1',
    date: '2026-08-17',
    time: '10:00',
    title: 'Hospitality Leadership Workshop with Assistant GM',
    description: 'Module on conflict resolution and table recovery tactics.',
    category: 'training',
    priority: 'medium',
    isCompleted: false,
    notifyApp: true,
  },
  {
    id: 'rem-5',
    employeeId: 'emp-1',
    date: '2026-08-20',
    time: '14:00',
    title: 'California RBS Alcohol Handler Card 3-Year Renewal Check',
    description: 'Upload renewed certification certificate to ShiftForce profile.',
    category: 'compliance',
    priority: 'high',
    isCompleted: false,
    notifyApp: true,
  },
  {
    id: 'rem-6',
    employeeId: 'emp-1',
    date: '2026-08-22',
    time: '11:30',
    title: 'Personal Doctor Appointment (Morning off)',
    description: 'Confirmed shift starts at 16:30 evening dinner rush.',
    category: 'personal',
    priority: 'low',
    isCompleted: false,
    notifyApp: true,
  },
  {
    id: 'rem-7',
    employeeId: 'emp-1',
    date: '2026-08-28',
    time: '17:00',
    title: 'Monthly FOH Floor Service Awards & Kudos Tally',
    description: 'ShiftForce guest review top-mention bonus announcements.',
    category: 'team_huddle',
    priority: 'medium',
    isCompleted: false,
    notifyApp: true,
  },
];

export const INITIAL_EMPLOYEE_GOALS: EmployeeGoal[] = [
  {
    id: 'goal-1',
    employeeId: 'emp-1',
    title: 'Earn Lead Trainer & Shift Supervisor Certification',
    description: 'Complete cross-training modules across BOH ticket routing and bar expediting to qualify for Floor Supervisor promotion.',
    category: 'career_promotion',
    targetDate: '2026-08-31',
    progressPct: 75,
    status: 'on_track',
    metrics: {
      currentValue: 3,
      targetValue: 4,
      unit: 'modules completed',
    },
    milestones: [
      { id: 'm-1', title: 'Complete POS Cash & Drawer Reconciliation Module', completed: true, dueDate: '2026-08-05' },
      { id: 'm-2', title: 'Shadow General Manager on Friday Labor Forecasting', completed: true, dueDate: '2026-08-10' },
      { id: 'm-3', title: 'Lead 2 Pre-Shift Service Huddles with FOH Team', completed: true, dueDate: '2026-08-18' },
      { id: 'm-4', title: 'Pass Final Shift Leadership Scenario Assessment', completed: false, dueDate: '2026-08-28' },
    ],
    actionPlan: 'Review weekly scheduling rules, attend management huddle on Tuesdays, and practice labor variance tracking.',
  },
  {
    id: 'goal-2',
    employeeId: 'emp-1',
    title: 'Maintain 4.9+ Guest Feedback Rating & 15 Five-Star Mentions',
    description: 'Consistently deliver warm, attentive service on dinner rushes to maximize personal tip income and ShiftForce customer kudos.',
    category: 'hospitality_service',
    targetDate: '2026-08-31',
    progressPct: 86,
    status: 'on_track',
    metrics: {
      currentValue: 13,
      targetValue: 15,
      unit: '5-star reviews',
    },
    milestones: [
      { id: 'm-5', title: 'Achieve 5 reviews with named staff mentions', completed: true, dueDate: '2026-08-07' },
      { id: 'm-6', title: 'Reach 10 positive mentions on OpenTable/Google', completed: true, dueDate: '2026-08-18' },
      { id: 'm-7', title: 'Cross 15 5-star mentions for monthly bonus', completed: false, dueDate: '2026-08-31' },
    ],
    actionPlan: 'Greet tables within 90 seconds, remember repeat guests favorite drinks, and personally thank each party.',
  },
  {
    id: 'goal-3',
    employeeId: 'emp-1',
    title: 'Achieve $360/hr Peak Sales Per Labor Hour (SPLH)',
    description: 'Optimize table pacing, recommend premium wine pairings, and turnaround tables smoothly during 6:30 PM - 9:30 PM dinner rush.',
    category: 'speed_efficiency',
    targetDate: '2026-08-25',
    progressPct: 60,
    status: 'needs_focus',
    metrics: {
      currentValue: 335,
      targetValue: 360,
      unit: '$/hr SPLH',
    },
    milestones: [
      { id: 'm-8', title: 'Maintain $310/hr average over 3 consecutive shifts', completed: true, dueDate: '2026-08-08' },
      { id: 'm-9', title: 'Hit $340/hr target on Friday dinner service', completed: false, dueDate: '2026-08-15' },
      { id: 'm-10', title: 'Sustain $360/hr target during full weekend', completed: false, dueDate: '2026-08-25' },
    ],
    actionPlan: 'Focus on proactive beverage refills, pre-dessert menus, and streamlined payment processing.',
  },
  {
    id: 'goal-4',
    employeeId: 'emp-1',
    title: '30-Day Zero Tardiness & 100% Attendance Record',
    description: 'Maintain pristine punctuality record and clock in at least 5 minutes before scheduled start time on every shift.',
    category: 'certification',
    targetDate: '2026-08-31',
    progressPct: 90,
    status: 'on_track',
    metrics: {
      currentValue: 27,
      targetValue: 30,
      unit: 'days on-time',
    },
    milestones: [
      { id: 'm-11', title: '10-day perfect attendance milestone', completed: true, dueDate: '2026-08-10' },
      { id: 'm-12', title: '20-day perfect attendance milestone', completed: true, dueDate: '2026-08-20' },
      { id: 'm-13', title: 'Full 30-day zero tardiness record achieved', completed: false, dueDate: '2026-08-31' },
    ],
    actionPlan: 'Set 24h phone alarm reminders, prepare uniform night before, and check transit traffic.',
  },
];

// Helper to generate a full month of shifts for the employee across August 2026
export function generateMonthShiftsForEmployee(
  employee: Employee,
  year: number = 2026,
  month: number = 7 // 0-indexed: 7 = August
): Shift[] {
  const shifts: Shift[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const shiftTemplates = [
    { start: '16:00', end: '23:30', role: employee.role, dept: employee.department, notes: 'Dinner Rush • Station 4' },
    { start: '10:00', end: '16:00', role: employee.role, dept: employee.department, notes: 'Lunch Service • Station 2' },
    { start: '17:00', end: '00:30', role: employee.role, dept: employee.department, notes: 'Weekend Evening • Section A' },
    { start: '11:00', end: '19:30', role: employee.role, dept: employee.department, notes: 'Mid-Day Swing • Bar Tables' },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Standard hospitality schedule: 4-5 shifts per week (e.g. Wednesday through Sunday)
    const isShiftDay = [3, 4, 5, 6, 0].includes(dayOfWeek); // Wed, Thu, Fri, Sat, Sun

    if (isShiftDay) {
      const isWeekend = [5, 6, 0].includes(dayOfWeek);
      const template = isWeekend
        ? (day % 2 === 0 ? shiftTemplates[2] : shiftTemplates[0])
        : (day % 2 === 0 ? shiftTemplates[1] : shiftTemplates[0]);

      shifts.push({
        id: `shift-m-${employee.id}-${dateStr}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        role: employee.role,
        date: dateStr,
        startTime: template.start,
        endTime: template.end,
        breakMinutes: 30,
        hourlyWage: employee.hourlyWage,
        status: day <= 14 ? 'completed' : 'published',
        color: employee.color,
        notes: template.notes,
      });
    }
  }

  return shifts;
}
