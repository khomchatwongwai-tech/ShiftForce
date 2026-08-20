import { authenticatedFetch } from './apiClient';
import {
  Employee,
  Shift,
  Department,
  RestaurantRole,
  ShiftTemplate,
  AvailabilityRequest,
  TimeOffRequest,
  DepartmentBudgetsMap,
  OpenSlot,
  SmartMatchCandidate,
  SmartAutoFillSlotRecommendation,
  SmartAutoFillPlan,
  DayOfWeek
} from '../types';

/**
 * Calculates net hours for a shift/slot (subtracting unpaid break)
 */
export function calculateSlotHours(startTime: string, endTime: string, breakMinutes: number = 30): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.max(0, (diff - breakMinutes) / 60);
}

/**
 * Maps date string (YYYY-MM-DD) to DayOfWeek
 */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }
  return 'Monday';
}

/**
 * Detects or constructs open slots in the current 7-day schedule.
 * Scans for:
 * 1. Explicit unassigned/draft open shifts (if employeeId is empty or 'unassigned')
 * 2. Key staffing gaps derived from active shift templates where roles are understaffed on specific days
 */
export function detectScheduleOpenSlots(
  weekDates: { dateStr: string; dayName: string }[],
  existingShifts: Shift[],
  templates: ShiftTemplate[],
  departmentFilter: Department | 'all' = 'all'
): OpenSlot[] {
  const openSlots: OpenSlot[] = [];

  // 1. Look for unassigned or open shifts
  existingShifts.forEach((s) => {
    if (!s.employeeId || s.employeeId === 'unassigned' || s.employeeName.toLowerCase().includes('open') || s.employeeName.toLowerCase().includes('unassigned')) {
      if (departmentFilter === 'all' || s.department === departmentFilter) {
        openSlots.push({
          id: `open-existing-${s.id}`,
          date: s.date,
          dayName: weekDates.find(w => w.dateStr === s.date)?.dayName || getDayOfWeekFromDate(s.date),
          startTime: s.startTime,
          endTime: s.endTime,
          breakMinutes: s.breakMinutes,
          role: s.role,
          department: s.department,
          notes: s.notes || 'Unassigned scheduled shift',
          source: 'unassigned_shift',
        });
      }
    }
  });

  // 2. If fewer than 4 open slots exist, detect essential template coverage needs per day
  // (e.g., weekend dinner rush server, morning prep cook, mid-day bar support, kitchen close)
  const coreTemplates = templates.filter(t => t.isFavorite || ['Opening', 'Mid', 'Rush', 'Closing'].includes(t.patternTag));

  weekDates.forEach((wd) => {
    const dayShifts = existingShifts.filter(s => s.date === wd.dateStr);
    const dayOfWeek = wd.dayName;
    const isWeekend = dayOfWeek === 'Friday' || dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

    coreTemplates.forEach((tmpl) => {
      if (departmentFilter !== 'all' && tmpl.department !== departmentFilter) {
        return;
      }

      // Check if this template's role/time is already sufficiently staffed on this day
      const matchingStaffedCount = dayShifts.filter(s =>
        s.role === tmpl.role &&
        s.department === tmpl.department &&
        Math.abs(parseInt(s.startTime) - parseInt(tmpl.startTime)) <= 2
      ).length;

      // Target coverage rules:
      // Weekend Dinner Rush Server/Line Cook needs at least 2
      // Standard days need at least 1 per core station
      const targetCount = isWeekend && (tmpl.patternTag === 'Rush' || tmpl.role === 'Server' || tmpl.role === 'Line Cook') ? 2 : 1;

      if (matchingStaffedCount < targetCount) {
        // Only add up to a reasonable set of open slots (e.g. 7 max across the week)
        const slotKey = `${wd.dateStr}_${tmpl.role}_${tmpl.startTime}`;
        const alreadyAdded = openSlots.some(os => os.date === wd.dateStr && os.role === tmpl.role && os.startTime === tmpl.startTime);

        if (!alreadyAdded && openSlots.length < 8) {
          openSlots.push({
            id: `open-gap-${slotKey}`,
            date: wd.dateStr,
            dayName: wd.dayName,
            startTime: tmpl.startTime,
            endTime: tmpl.endTime,
            breakMinutes: tmpl.breakMinutes,
            role: tmpl.role,
            department: tmpl.department,
            patternTag: tmpl.patternTag,
            notes: tmpl.notes || `${tmpl.patternTag} coverage requirement`,
            source: 'understaffed_gap',
          });
        }
      }
    });
  });

  return openSlots;
}

/**
 * Computes weekly scheduled hours and department labor cost for each employee & department.
 */
export function computeWeeklyMetrics(shifts: Shift[], employees: Employee[], departmentBudgets: DepartmentBudgetsMap) {
  const employeeHours: Record<string, number> = {};
  const employeeCost: Record<string, number> = {};
  const departmentScheduledCost: Record<Department, number> = {
    'Front of House': 0,
    'Back of House': 0,
    'Bar & Beverage': 0,
    'Kitchen Prep & Dish': 0,
    'Management': 0,
  };

  employees.forEach(e => {
    employeeHours[e.id] = 0;
    employeeCost[e.id] = 0;
  });

  shifts.forEach(s => {
    const hrs = calculateSlotHours(s.startTime, s.endTime, s.breakMinutes);
    if (s.employeeId && employeeHours[s.employeeId] !== undefined) {
      employeeHours[s.employeeId] += hrs;
      const cost = hrs * (s.hourlyWage || 18);
      employeeCost[s.employeeId] += cost;
    }
    if (s.department && departmentScheduledCost[s.department] !== undefined) {
      const cost = hrs * (s.hourlyWage || 18);
      departmentScheduledCost[s.department] += cost;
    }
  });

  const departmentRemaining: Record<Department, number> = {
    'Front of House': (departmentBudgets['Front of House'] || 3800) - departmentScheduledCost['Front of House'],
    'Back of House': (departmentBudgets['Back of House'] || 4200) - departmentScheduledCost['Back of House'],
    'Bar & Beverage': (departmentBudgets['Bar & Beverage'] || 1800) - departmentScheduledCost['Bar & Beverage'],
    'Kitchen Prep & Dish': (departmentBudgets['Kitchen Prep & Dish'] || 1600) - departmentScheduledCost['Kitchen Prep & Dish'],
    'Management': (departmentBudgets['Management'] || 2200) - departmentScheduledCost['Management'],
  };

  return {
    employeeHours,
    employeeCost,
    departmentScheduledCost,
    departmentRemaining,
  };
}

/**
 * Evaluates candidate matching score based on:
 * 1. Stated Historical Availability (preferences, time off)
 * 2. Department & Role compatibility
 * 3. Labor Budget Constraints (wage impact vs department budget remaining)
 * 4. Overtime threshold avoidance (keeping total week <= 40 hours)
 */
export function evaluateCandidateMatchForSlot(
  slot: OpenSlot,
  employee: Employee,
  shifts: Shift[],
  availabilityRequests: AvailabilityRequest[],
  timeOffRequests: TimeOffRequest[],
  currentEmployeeHours: number,
  departmentBudgetRemaining: number,
  totalDeptWeeklyBudget: number
): SmartMatchCandidate {
  const dayOfWeek = getDayOfWeekFromDate(slot.date);
  const shiftHours = calculateSlotHours(slot.startTime, slot.endTime, slot.breakMinutes);
  const projectedWeeklyHours = currentEmployeeHours + shiftHours;
  const causesOvertime = projectedWeeklyHours > 40;
  const overtimeHours = causesOvertime ? Math.max(0, projectedWeeklyHours - 40) : 0;
  const shiftCost = shiftHours * employee.hourlyWage;
  const departmentBudgetRemainingAfter = departmentBudgetRemaining - shiftCost;

  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 50; // base score

  // 1. Check Approved / Pending Time-Off
  const hasTimeOff = timeOffRequests.some(tor =>
    tor.employeeId === employee.id &&
    tor.status === 'approved' &&
    slot.date >= tor.startDate &&
    slot.date <= tor.endDate
  );

  if (hasTimeOff) {
    warnings.push('Approved Time-Off scheduled on this date');
    score -= 60;
  }

  // 2. Check if already scheduled on this same date
  const isAlreadyScheduledOnDate = shifts.some(s => s.employeeId === employee.id && s.date === slot.date);
  if (isAlreadyScheduledOnDate) {
    warnings.push(`Already has another shift scheduled on ${slot.date}`);
    score -= 35;
  }

  // 3. Evaluate Stated Weekly Availability History
  const empAvailReq = availabilityRequests.find(a => a.employeeId === employee.id && a.status === 'approved') ||
    availabilityRequests.find(a => a.employeeId === employee.id);

  let availStatus: SmartMatchCandidate['availabilityStatus'] = 'neutral';
  let availReason = 'Standard regular availability profile';

  if (empAvailReq && empAvailReq.weeklyPreferences && empAvailReq.weeklyPreferences[dayOfWeek]) {
    const pref = empAvailReq.weeklyPreferences[dayOfWeek];
    availStatus = ((pref.status as string) === 'open' ? 'available' : pref.status) as SmartMatchCandidate['availabilityStatus'];
    if (pref.status === 'preferred') {
      score += 25;
      reasons.push(`Stated "${dayOfWeek}" as Preferred Shift day`);
      availReason = `Verified Preferred day (${pref.notes || 'High preference'})`;
    } else if (pref.status === 'open' || pref.status === 'available' as any) {
      score += 15;
      reasons.push(`Open & fully available on ${dayOfWeek}s`);
      availReason = 'Open availability';
    } else if (pref.status === 'morning_only') {
      const [startH] = slot.startTime.split(':').map(Number);
      if (startH <= 11) {
        score += 20;
        reasons.push(`Matches morning shift preference (${slot.startTime})`);
        availReason = 'Morning preference match';
      } else {
        score -= 25;
        warnings.push(`Prefers morning shifts only; slot starts at ${slot.startTime}`);
        availReason = 'Time preference conflict (Evening)';
      }
    } else if (pref.status === 'evening_only') {
      const [startH] = slot.startTime.split(':').map(Number);
      if (startH >= 15) {
        score += 20;
        reasons.push(`Matches evening shift preference (${slot.startTime})`);
        availReason = 'Evening preference match';
      } else {
        score -= 25;
        warnings.push(`Prefers evening shifts only; slot starts at ${slot.startTime}`);
        availReason = 'Time preference conflict (Morning)';
      }
    } else if (pref.status === 'unavailable') {
      score -= 45;
      warnings.push(`Marked as Unavailable on ${dayOfWeek}s (${pref.notes || 'Fixed off day'})`);
      availReason = `Unavailable on ${dayOfWeek}s`;
    }
  } else {
    // Default neutral availability
    score += 10;
    reasons.push(`Active staff with regular ${dayOfWeek} availability`);
  }

  // 4. Department & Role Compatibility
  if (employee.role === slot.role && employee.department === slot.department) {
    score += 30;
    reasons.push(`Exact Role Match: ${employee.role} (${employee.department})`);
  } else if (employee.department === slot.department) {
    score += 15;
    reasons.push(`Same Department: ${employee.department} (Qualified for ${slot.role})`);
  } else {
    // Cross-department
    const crossEligible = (slot.department === 'Front of House' && employee.department === 'Bar & Beverage') ||
      (slot.department === 'Back of House' && employee.department === 'Kitchen Prep & Dish');
    if (crossEligible) {
      score += 5;
      reasons.push(`Cross-trained Station (${employee.department} → ${slot.department})`);
    } else {
      score -= 30;
      warnings.push(`Department mismatch (${employee.department} vs ${slot.department})`);
    }
  }

  // 5. Labor Budget & Hourly Wage Optimization
  let budgetFit: SmartMatchCandidate['budgetFit'] = 'acceptable';
  if (departmentBudgetRemainingAfter >= totalDeptWeeklyBudget * 0.15) {
    budgetFit = 'ideal';
    score += 15;
    reasons.push(`Budget optimal: $${employee.hourlyWage.toFixed(2)}/hr ($${departmentBudgetRemainingAfter.toFixed(0)} dept allowance remaining)`);
  } else if (departmentBudgetRemainingAfter >= 0) {
    budgetFit = 'acceptable';
    score += 5;
    reasons.push(`Fits within department budget ($${shiftCost.toFixed(0)} cost)`);
  } else if (departmentBudgetRemainingAfter >= -150) {
    budgetFit = 'tight';
    score -= 10;
    warnings.push(`Approaching department budget limit ($${Math.abs(departmentBudgetRemainingAfter).toFixed(0)} over)`);
  } else {
    budgetFit = 'exceeds';
    score -= 25;
    warnings.push(`Exceeds weekly department budget by $${Math.abs(departmentBudgetRemainingAfter).toFixed(0)}`);
  }

  // 6. Overtime Risk & Workload Balance
  if (causesOvertime) {
    score -= 30;
    warnings.push(`Triggers Overtime (+${overtimeHours.toFixed(1)}h OT, total ${projectedWeeklyHours.toFixed(1)}h/wk)`);
  } else if (projectedWeeklyHours >= 36) {
    score += 5;
    reasons.push(`Optimal full-time schedule (${projectedWeeklyHours.toFixed(1)}h / 40h)`);
  } else if (projectedWeeklyHours >= 20) {
    score += 10;
    reasons.push(`Balanced workload (${projectedWeeklyHours.toFixed(1)}h / 40h, Zero OT Risk)`);
  } else {
    score += 8;
    reasons.push(`Available hours available (${projectedWeeklyHours.toFixed(1)}h / 40h)`);
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(5, Math.min(99, Math.round(score)));

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    department: employee.department,
    hourlyWage: employee.hourlyWage,
    color: employee.color,
    matchScore: finalScore,
    availabilityStatus: availStatus,
    availabilityReason: availReason,
    currentWeeklyHours: Number(currentEmployeeHours.toFixed(1)),
    projectedWeeklyHours: Number(projectedWeeklyHours.toFixed(1)),
    shiftHours: Number(shiftHours.toFixed(1)),
    shiftCost: Number(shiftCost.toFixed(2)),
    causesOvertime,
    overtimeHours: Number(overtimeHours.toFixed(1)),
    departmentBudgetRemainingBefore: Number(departmentBudgetRemaining.toFixed(2)),
    departmentBudgetRemainingAfter: Number(departmentBudgetRemainingAfter.toFixed(2)),
    budgetFit,
    reasons,
    warnings,
  };
}

/**
 * Generates a full Smart Auto-Fill plan suggesting the best employee matches for all open slots.
 */
export async function generateSmartAutoFillPlan(
  openSlots: OpenSlot[],
  employees: Employee[],
  shifts: Shift[],
  availabilityRequests: AvailabilityRequest[],
  timeOffRequests: TimeOffRequest[],
  departmentBudgets: DepartmentBudgetsMap,
  useServerAI: boolean = true
): Promise<SmartAutoFillPlan> {
  const activeEmployees = employees.filter(e => e.status === 'active');
  const metrics = computeWeeklyMetrics(shifts, activeEmployees, departmentBudgets);

  // Track dynamic simulated hours & budget per iteration to ensure fair distribution across multiple slots
  const simEmployeeHours = { ...metrics.employeeHours };
  const simDeptRemaining = { ...metrics.departmentRemaining };

  const recommendations: SmartAutoFillSlotRecommendation[] = [];

  // Process open slots sorted by date and start time
  const sortedSlots = [...openSlots].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  for (const slot of sortedSlots) {
    const candidateEvaluations: SmartMatchCandidate[] = [];

    for (const emp of activeEmployees) {
      const evaluation = evaluateCandidateMatchForSlot(
        slot,
        emp,
        shifts,
        availabilityRequests,
        timeOffRequests,
        simEmployeeHours[emp.id] || 0,
        simDeptRemaining[slot.department] || 0,
        departmentBudgets[slot.department] || 3800
      );
      candidateEvaluations.push(evaluation);
    }

    // Sort by match score descending
    candidateEvaluations.sort((a, b) => b.matchScore - a.matchScore);

    const topCandidates = candidateEvaluations.slice(0, 4);
    const bestCandidate = topCandidates[0] || null;

    // Simulate assignment update for downstream slot evaluation
    if (bestCandidate && bestCandidate.matchScore >= 40) {
      simEmployeeHours[bestCandidate.employeeId] = (simEmployeeHours[bestCandidate.employeeId] || 0) + bestCandidate.shiftHours;
      simDeptRemaining[slot.department] = (simDeptRemaining[slot.department] || 0) - bestCandidate.shiftCost;
    }

    recommendations.push({
      slotId: slot.id,
      date: slot.date,
      dayName: slot.dayName,
      startTime: slot.startTime,
      endTime: slot.endTime,
      breakMinutes: slot.breakMinutes,
      role: slot.role,
      department: slot.department,
      patternTag: slot.patternTag,
      notes: slot.notes,
      source: slot.source,
      topCandidates,
      selectedCandidateId: bestCandidate?.employeeId || null,
      isIncluded: true,
    });
  }

  // If server AI is enabled, we can enhance the plan with Gemini insights
  let aiRationale = 'Heuristic optimization balanced role expertise, weekly availability preferences, labor budgets, and overtime prevention.';

  if (useServerAI) {
    try {
      const response = await authenticatedFetch('/api/ai/smart-autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openSlots: sortedSlots,
          recommendations: recommendations.map(r => ({
            slotId: r.slotId,
            date: r.date,
            role: r.role,
            department: r.department,
            startTime: r.startTime,
            endTime: r.endTime,
            topMatch: r.topCandidates[0]?.employeeName,
            matchScore: r.topCandidates[0]?.matchScore,
          })),
          departmentBudgets,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.rationale) {
          aiRationale = data.rationale;
        }
      }
    } catch {
      // Fallback silently to heuristic rationale
    }
  }

  // Calculate summary metrics
  let totalEstimatedCost = 0;
  let totalEstimatedHours = 0;
  let overtimePreventedCount = 0;
  let assignedCount = 0;

  const budgetImpactByDepartment: Record<Department, { costAdded: number; newRemaining: number; isOverBudget: boolean }> = {
    'Front of House': { costAdded: 0, newRemaining: metrics.departmentRemaining['Front of House'], isOverBudget: false },
    'Back of House': { costAdded: 0, newRemaining: metrics.departmentRemaining['Back of House'], isOverBudget: false },
    'Bar & Beverage': { costAdded: 0, newRemaining: metrics.departmentRemaining['Bar & Beverage'], isOverBudget: false },
    'Kitchen Prep & Dish': { costAdded: 0, newRemaining: metrics.departmentRemaining['Kitchen Prep & Dish'], isOverBudget: false },
    'Management': { costAdded: 0, newRemaining: metrics.departmentRemaining['Management'], isOverBudget: false },
  };

  recommendations.forEach(r => {
    if (r.isIncluded && r.selectedCandidateId) {
      const candidate = r.topCandidates.find(c => c.employeeId === r.selectedCandidateId);
      if (candidate) {
        assignedCount++;
        totalEstimatedCost += candidate.shiftCost;
        totalEstimatedHours += candidate.shiftHours;
        if (!candidate.causesOvertime) {
          overtimePreventedCount++;
        }
        if (budgetImpactByDepartment[r.department]) {
          budgetImpactByDepartment[r.department].costAdded += candidate.shiftCost;
          budgetImpactByDepartment[r.department].newRemaining -= candidate.shiftCost;
          budgetImpactByDepartment[r.department].isOverBudget = budgetImpactByDepartment[r.department].newRemaining < 0;
        }
      }
    }
  });

  return {
    recommendations,
    summary: {
      totalSlots: openSlots.length,
      includedSlotsCount: recommendations.filter(r => r.isIncluded).length,
      assignedSlotsCount: assignedCount,
      totalEstimatedCost: Number(totalEstimatedCost.toFixed(2)),
      totalEstimatedHours: Number(totalEstimatedHours.toFixed(1)),
      budgetImpactByDepartment,
      overtimePreventedCount,
    },
    aiRationale,
  };
}