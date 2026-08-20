import {
  ShiftSlotRequest,
  ShiftSlotContention,
  PriorityCandidateAnalysis,
  Employee,
  Shift,
  TardinessRecord,
  AvailabilityRequest,
  DayOfWeek,
  NotificationDispatch
} from '../types';

const DAY_NAMES: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Calculates shift duration in hours
 */
export function getShiftDurationHours(startTime: string, endTime: string, breakMinutes: number = 0): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin < 0) totalMin += 24 * 60; // overnight
  return Math.max(0, (totalMin - breakMinutes) / 60);
}

/**
 * Derives day of week from YYYY-MM-DD
 */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return DAY_NAMES[dt.getDay()];
}

/**
 * Priority Scoring & Availability History Analysis for a single candidate requesting a shift slot
 */
export function evaluateCandidatePriority(
  request: ShiftSlotRequest,
  employee: Employee,
  allShifts: Shift[],
  tardinessLog: TardinessRecord[],
  availabilityRequests: AvailabilityRequest[]
): PriorityCandidateAnalysis {
  const targetDay = getDayOfWeekFromDate(request.date);
  const requestDurationHours = getShiftDurationHours(request.startTime, request.endTime);

  // 1. Availability History Analysis
  const empAvailReq = availabilityRequests.find(a => a.employeeId === employee.id && a.status === 'approved')
    || availabilityRequests.find(a => a.employeeId === employee.id);

  let statedPref: PriorityCandidateAnalysis['availabilityHistory']['statedPreference'] = 'neutral';
  let prefMatch = false;
  let availDetails = '';

  if (empAvailReq && empAvailReq.weeklyPreferences && empAvailReq.weeklyPreferences[targetDay]) {
    const dayPref = empAvailReq.weeklyPreferences[targetDay];
    statedPref = dayPref.status || 'neutral';

    if (statedPref === 'preferred') {
      prefMatch = true;
      availDetails = `Stated 'Preferred' availability for ${targetDay}s in verified availability profile.`;
    } else if (statedPref === 'open') {
      prefMatch = true;
      availDetails = `Stated 'Open' availability for ${targetDay}s without restrictions.`;
    } else if (statedPref === 'evening_only') {
      const [sh] = request.startTime.split(':').map(Number);
      prefMatch = sh >= 15;
      availDetails = prefMatch
        ? `Stated 'Evening Only' for ${targetDay}s (matches ${request.startTime} shift).`
        : `Stated 'Evening Only', but shift starts at ${request.startTime}.`;
    } else if (statedPref === 'morning_only') {
      const [sh] = request.startTime.split(':').map(Number);
      prefMatch = sh < 15;
      availDetails = prefMatch
        ? `Stated 'Morning Only' for ${targetDay}s (matches ${request.startTime} shift).`
        : `Stated 'Morning Only', but shift starts at ${request.startTime}.`;
    } else if (statedPref === 'unavailable') {
      prefMatch = false;
      availDetails = `Marked '${targetDay}s' as Unavailable in availability profile (${dayPref.notes || 'No note'}).`;
    }
  } else {
    // Default baseline if no explicit custom request
    statedPref = 'open';
    prefMatch = true;
    availDetails = `Open standard schedule availability on ${targetDay}s.`;
  }

  // 2. Punctuality & Reliability History from Tardiness Log
  const empTardyRecords = tardinessLog.filter(t => t.employeeId === employee.id);
  const totalLogged = empTardyRecords.length;
  const onTimeRecords = empTardyRecords.filter(t => t.status === 'on_time');
  const lateRecords = empTardyRecords.filter(t => t.status === 'late');
  const excusedRecords = empTardyRecords.filter(t => t.status === 'excused');
  const noShows = empTardyRecords.filter(t => t.status === 'no_show');

  const onTimeRate = totalLogged > 0 ? Math.round((onTimeRecords.length / totalLogged) * 100) : 95;

  // 3. Workload & Overtime Prevention
  const currentWeekShifts = allShifts.filter(s => s.employeeId === employee.id);
  const currentScheduledHours = currentWeekShifts.reduce((sum, s) => {
    return sum + getShiftDurationHours(s.startTime, s.endTime, s.breakMinutes);
  }, 0);

  const projectedHours = currentScheduledHours + requestDurationHours;
  const overtimeRisk = projectedHours > 40;
  const overtimeExcess = Math.max(0, projectedHours - 40);

  // 4. Seniority / Tenure (Months)
  const hireYear = parseInt(employee.hireDate.split('-')[0] || '2023', 10);
  const hireMonth = parseInt(employee.hireDate.split('-')[1] || '1', 10);
  const now = new Date(2026, 7, 13); // Current app cycle
  const seniorityMonths = Math.max(1, (now.getFullYear() - hireYear) * 12 + (now.getMonth() + 1 - hireMonth));

  // 5. Composite Priority Score Calculation (0 - 100)
  let score = 50; // Base score
  const keyFactors: string[] = [];

  // Availability factor (Up to +35 pts, or -30 pts)
  if (statedPref === 'preferred') {
    score += 30;
    keyFactors.push(`+30 pts: Has '${targetDay}' marked as Preferred shift`);
  } else if (statedPref === 'open' || prefMatch) {
    score += 18;
    keyFactors.push(`+18 pts: Open availability for ${targetDay}`);
  } else if (statedPref === 'unavailable') {
    score -= 30;
    keyFactors.push(`-30 pts: Contradicts availability profile (${targetDay} unavailable)`);
  }

  // Attendance reliability factor (Up to +25 pts, or -20 pts)
  if (onTimeRate >= 95) {
    score += 20;
    keyFactors.push(`+20 pts: Pristine attendance record (${onTimeRate}% on-time)`);
  } else if (onTimeRate >= 85) {
    score += 10;
    keyFactors.push(`+10 pts: Good attendance (${onTimeRate}% on-time, ${lateRecords.length} late)`);
  } else {
    score -= 15;
    keyFactors.push(`-15 pts: Lower attendance rating (${onTimeRate}% on-time, ${lateRecords.length} tardies)`);
  }

  // Overtime avoidance & Hours fairness factor (Up to +15 pts, or -25 pts)
  if (overtimeRisk) {
    score -= 25;
    keyFactors.push(`-25 pts: OVERTIME RISK (+${overtimeExcess.toFixed(1)}h OT will reach ${projectedHours.toFixed(1)}h)`);
  } else if (currentScheduledHours < employee.maxHoursPerWeek - requestDurationHours) {
    score += 12;
    keyFactors.push(`+12 pts: Needs hours to reach target (${currentScheduledHours.toFixed(1)}h / ${employee.maxHoursPerWeek}h target)`);
  }

  // Seniority factor (Up to +10 pts)
  const seniorityBonus = Math.min(10, Math.floor(seniorityMonths / 3));
  if (seniorityBonus > 0) {
    score += seniorityBonus;
    keyFactors.push(`+${seniorityBonus} pts: Restaurant seniority (${seniorityMonths} months)`);
  }

  // Normalize final score between 10 and 99
  const finalScore = Math.max(10, Math.min(99, Math.round(score)));

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    requestId: request.id,
    priorityScore: finalScore,
    isRecommendedPriority: false, // will be assigned after comparison
    availabilityHistory: {
      statedPreference: statedPref,
      availabilityAdherenceRate: onTimeRate,
      historicalPreferenceMatch: prefMatch,
      details: availDetails,
    },
    attendanceReliability: {
      onTimeRate,
      totalShiftsLogged: totalLogged,
      lateCount: lateRecords.length,
      excusedCount: excusedRecords.length,
      noShowCount: noShows.length,
    },
    workloadFactors: {
      currentScheduledHours: Number(currentScheduledHours.toFixed(1)),
      projectedHoursIfAssigned: Number(projectedHours.toFixed(1)),
      overtimeRisk,
      overtimeHoursExcess: Number(overtimeExcess.toFixed(1)),
    },
    seniorityMonths,
    keyFactors,
  };
}

/**
 * Master Validation Layer:
 * Scans all shift slot requests, detects contentions (when 2+ employees request the same slot),
 * and generates Priority Assignment recommendations based on availability history and attendance metrics.
 */
export function detectShiftSlotContentions(
  requests: ShiftSlotRequest[],
  employees: Employee[],
  allShifts: Shift[],
  tardinessLog: TardinessRecord[],
  availabilityRequests: AvailabilityRequest[]
): ShiftSlotContention[] {
  // Only evaluate pending requests
  const pendingRequests = requests.filter(r => r.status === 'pending');

  // Group requests by slot key: Date + Time + Role (or ShiftId)
  const groupedSlots: Record<string, ShiftSlotRequest[]> = {};

  pendingRequests.forEach(req => {
    const key = req.shiftId
      ? `shift_${req.shiftId}`
      : `${req.date}_${req.startTime}-${req.endTime}_${req.role}_${req.department}`;

    if (!groupedSlots[key]) {
      groupedSlots[key] = [];
    }
    groupedSlots[key].push(req);
  });

  const contentions: ShiftSlotContention[] = [];

  Object.entries(groupedSlots).forEach(([key, slotRequests]) => {
    // Contentions occur when 2 or more distinct employees request the exact same slot
    const uniqueEmployeeIds = Array.from(new Set(slotRequests.map(r => r.employeeId)));

    if (uniqueEmployeeIds.length >= 2) {
      const firstReq = slotRequests[0];

      // Analyze every candidate's priority metrics
      const candidateAnalyses: PriorityCandidateAnalysis[] = slotRequests.map(req => {
        const emp = employees.find(e => e.id === req.employeeId) || {
          id: req.employeeId,
          name: req.employeeName,
          email: '',
          phone: '',
          department: req.department,
          role: req.role,
          hourlyWage: 20,
          maxHoursPerWeek: 40,
          color: '#0284c7',
          status: 'active',
          hireDate: '2023-01-01',
        };

        return evaluateCandidatePriority(req, emp, allShifts, tardinessLog, availabilityRequests);
      });

      // Sort candidate analyses by priority score descending
      candidateAnalyses.sort((a, b) => b.priorityScore - a.priorityScore);

      // Top candidate is recommended priority
      if (candidateAnalyses.length > 0) {
        candidateAnalyses[0].isRecommendedPriority = true;
      }

      const topCandidate = candidateAnalyses[0];
      const runnerUp = candidateAnalyses[1];

      // Formulate clear, actionable justification
      const targetDay = getDayOfWeekFromDate(firstReq.date);
      let recommendationReason = `Priority assigned to ${topCandidate.employeeName} (${topCandidate.priorityScore}/100) over ${runnerUp.employeeName} (${runnerUp.priorityScore}/100). `;

      if (topCandidate.availabilityHistory.statedPreference === 'preferred' && runnerUp.availabilityHistory.statedPreference !== 'preferred') {
        recommendationReason += `${topCandidate.employeeName} has ${targetDay}s explicitly marked as 'Preferred' in verified availability profile. `;
      }

      if (runnerUp.workloadFactors.overtimeRisk && !topCandidate.workloadFactors.overtimeRisk) {
        recommendationReason += `Prevents overtime penalty: ${runnerUp.employeeName} would exceed 40h (+${runnerUp.workloadFactors.overtimeHoursExcess}h OT), while ${topCandidate.employeeName} stays in regular hours (${topCandidate.workloadFactors.projectedHoursIfAssigned}h total). `;
      } else if (topCandidate.attendanceReliability.onTimeRate > runnerUp.attendanceReliability.onTimeRate) {
        recommendationReason += `Superior historical punctuality rate (${topCandidate.attendanceReliability.onTimeRate}% on-time vs ${runnerUp.attendanceReliability.onTimeRate}%). `;
      }

      contentions.push({
        contentionKey: key,
        date: firstReq.date,
        startTime: firstReq.startTime,
        endTime: firstReq.endTime,
        role: firstReq.role,
        department: firstReq.department,
        shiftId: firstReq.shiftId,
        requests: slotRequests,
        contenderEmployeeIds: uniqueEmployeeIds,
        contenderEmployeeNames: slotRequests.map(r => r.employeeName),
        analysis: candidateAnalyses,
        recommendedCandidateId: topCandidate.employeeId,
        recommendedCandidateName: topCandidate.employeeName,
        recommendationReason,
        status: 'contested',
      });
    }
  });

  return contentions;
}

/**
 * Creates an automated Admin Alert Dispatch when a shift slot contention is detected
 */
export function generateContentionNotificationDispatch(
  contention: ShiftSlotContention
): NotificationDispatch {
  const targetDay = getDayOfWeekFromDate(contention.date);

  return {
    id: `disp-contention-${contention.contentionKey}-${Date.now()}`,
    recipientEmployeeId: 'admin',
    recipientName: 'General Manager / Admin',
    recipientPhone: '+1 (555) 000-0001',
    recipientEmail: 'admin@shiftsky.com',
    type: 'shift_slot_contention',
    title: `⚡ Shift Contention: ${contention.contenderEmployeeNames.join(' & ')} requested same slot`,
    message: `Validation Alert: Multiple staff requested ${targetDay}, ${contention.date} (${contention.startTime} - ${contention.endTime}) ${contention.role}.\n\n⭐ Recommended Priority: ${contention.recommendedCandidateName} based on availability history & attendance score.\n\nClick to review and resolve in 1 click.`,
    channels: ['app', 'sms'],
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: 'delivered',
    metadata: {
      shiftDate: contention.date,
      shiftStartTime: contention.startTime,
      role: contention.role,
      department: contention.department,
    },
  };
}