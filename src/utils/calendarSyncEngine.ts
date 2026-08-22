import {
  Shift,
  Employee,
  ExternalCalendarEvent,
  CalendarConflict,
  CalendarConnection,
  CalendarPrivacyLevel
} from '../types';

export interface MonthGridDay {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayName: string; // 'Mon', 'Tue', etc.
  dayOfWeekIndex: number; // 0 = Mon, 6 = Sun or 0 = Sun, 6 = Sat
  fullDate: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isWeekend: boolean;
  weekIndex: number;
}

/**
 * Builds a full 5-6 week calendar matrix for a given month and year.
 * Standardized on Monday as first day of week (ISO 8601).
 */
export function generateMonthGrid(year: number, month: number): MonthGridDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Convert Sunday (0) to 6, Monday (1) to 0, ..., Saturday (6) to 5
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  const todayStr = new Date().toISOString().slice(0, 10);
  const days: MonthGridDay[] = [];

  // Previous month padding days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = prevMonthLastDate - i;
    const prevMonthDate = new Date(year, month - 1, prevDate);
    const dateStr = formatLocalDate(prevMonthDate);
    const dayOfWeek = (prevMonthDate.getDay() + 6) % 7;
    days.push({
      dateStr,
      dayNumber: prevDate,
      dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek],
      dayOfWeekIndex: dayOfWeek,
      fullDate: prevMonthDate,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isWeekend: dayOfWeek >= 5,
      weekIndex: 0,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = formatLocalDate(curDate);
    const dayOfWeek = (curDate.getDay() + 6) % 7;
    days.push({
      dateStr,
      dayNumber: d,
      dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek],
      dayOfWeekIndex: dayOfWeek,
      fullDate: curDate,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isWeekend: dayOfWeek >= 5,
      weekIndex: 0,
    });
  }

  // Next month padding days to complete full grid (multiple of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = formatLocalDate(nextDate);
    const dayOfWeek = (nextDate.getDay() + 6) % 7;
    days.push({
      dateStr,
      dayNumber: d,
      dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek],
      dayOfWeekIndex: dayOfWeek,
      fullDate: nextDate,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      isWeekend: dayOfWeek >= 5,
      weekIndex: 0,
    });
  }

  // Assign correct week index to each day
  days.forEach((day, idx) => {
    day.weekIndex = Math.floor(idx / 7);
  });

  return days;
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses "HH:MM" into minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);
  return h * 60 + m;
}

/**
 * Checks for conflicts between Workqora shifts and external calendar events.
 */
export function detectCalendarConflicts(
  shifts: Shift[],
  externalEvents: ExternalCalendarEvent[],
  employees: Employee[]
): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];

  shifts.forEach((shift) => {
    const shiftStartMin = parseTimeToMinutes(shift.startTime);
    let shiftEndMin = parseTimeToMinutes(shift.endTime);
    // Overnight shift handling
    if (shiftEndMin < shiftStartMin) {
      shiftEndMin += 24 * 60;
    }

    // Filter external events that occur on the same date or involve the employee / location
    const relevantEvents = externalEvents.filter((evt) => {
      if (evt.date !== shift.date) return false;
      // If event belongs to this employee specifically
      if (evt.employeeId && evt.employeeId === shift.employeeId) return true;
      // If event is a personal busy block for another employee, ignore
      if (evt.employeeId && evt.employeeId !== shift.employeeId) return false;
      // Location-level blocking events (e.g. restaurant buyout, maintenance shutoff)
      if (evt.eventType === 'restaurant_buyout' || evt.eventType === 'maintenance') return true;
      return false;
    });

    relevantEvents.forEach((evt) => {
      const evtStartMin = parseTimeToMinutes(evt.startTime);
      let evtEndMin = parseTimeToMinutes(evt.endTime);
      if (evtEndMin < evtStartMin) {
        evtEndMin += 24 * 60;
      }

      // Check overlap: shiftStart < evtEnd AND shiftEnd > evtStart
      const isOverlapping = (shiftStartMin < evtEndMin) && (shiftEndMin > evtStartMin);

      if (isOverlapping || evt.isAllDay) {
        const isPersonalBlock = evt.eventType === 'personal_busy' || evt.eventType === 'employee_ooo';
        const isBuyout = evt.eventType === 'restaurant_buyout';
        const isMaintenance = evt.eventType === 'maintenance';

        let severity: 'blocking' | 'warning' = 'warning';
        let details = '';

        if (isPersonalBlock) {
          severity = 'blocking';
          details = `${shift.employeeName} has a personal calendar block (${evt.startTime} - ${evt.endTime}) synced from ${evt.provider}.`;
        } else if (isMaintenance) {
          severity = 'warning';
          details = `Shift coincides with facilities maintenance (${evt.title}). Station availability may be impacted.`;
        } else if (isBuyout) {
          severity = 'warning';
          details = `Shift is during private buyout (${evt.title}). Extra staffing may be required.`;
        } else {
          details = `Time overlap with external event "${evt.title}".`;
        }

        conflicts.push({
          id: `conflict-${shift.id}-${evt.id}`,
          shiftId: shift.id,
          shiftTitle: `${shift.role} (${shift.startTime}-${shift.endTime})`,
          shiftDate: shift.date,
          shiftStartTime: shift.startTime,
          shiftEndTime: shift.endTime,
          employeeId: shift.employeeId,
          employeeName: shift.employeeName,
          externalEventId: evt.id,
          externalEventTitle: evt.title,
          provider: evt.provider,
          conflictType: isPersonalBlock ? 'ooo_block' : 'overlap',
          severity,
          details,
        });
      }
    });
  });

  return conflicts;
}

/**
 * Formats shifts into an RFC 5545 standard .ics / iCalendar feed string.
 */
export function generateIcsFeed(
  shifts: Shift[],
  feedTitle: string = 'Workqora Published Schedule',
  feedDescription: string = 'Workqora Restaurant Workforce Real-Time Schedule Feed',
  privacyLevel: CalendarPrivacyLevel = 'full_details'
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Workqora//Workforce Operations v2.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${feedTitle.replace(/,/g, '\\,')}`,
    `X-WR-CALDESC:${feedDescription.replace(/,/g, '\\,')}`,
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ];

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  shifts.forEach((s) => {
    // Format DTSTART and DTEND in YYYYMMDDTHHMMSS
    const [startH, startM] = (s.startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (s.endTime || '00:00').split(':').map(Number);

    const shiftDate = new Date(`${s.date}T00:00:00`);
    const startDate = new Date(shiftDate);
    startDate.setHours(startH, startM, 0, 0);

    const endDate = new Date(shiftDate);
    endDate.setHours(endH, endM, 0, 0);
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1); // Overnight shift
    }

    const dtStart = formatIcsDate(startDate);
    const dtEnd = formatIcsDate(endDate);

    const summary = privacyLevel === 'free_busy_only'
      ? 'Workqora Shift (Busy)'
      : `🍽️ Workqora: ${s.role} - ${s.employeeName} (${s.department})`;

    const description = privacyLevel === 'free_busy_only'
      ? 'Scheduled Workqora shift block.'
      : `Role: ${s.role}\\nDepartment: ${s.department}\\nHourly Wage: $${s.hourlyWage}/hr\\nNotes: ${s.notes || 'None'}\\nManager Notes: ${s.managerNotes || 'None'}\\nStatus: Published`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:workqora-shift-${s.id}@workqora.com`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push('LOCATION:Workqora Restaurant Main Dining & Kitchen');
    lines.push('STATUS:CONFIRMED');
    lines.push('ORGANIZER;CN="Workqora Scheduling System":mailto:no-reply@workqora.com');
    lines.push('CLASS:PUBLIC');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${h}${min}${s}Z`;
}

/**
 * Basic RFC 5545 ICS string parser for importing external calendar events.
 */
export function parseIcsEvents(
  icsString: string,
  provider: 'google' | 'microsoft' | 'apple_caldav' | 'ics_webcal' = 'ics_webcal',
  organizationId: string = 'org-workqora-primary',
  locationId: string = 'loc-dtla-main'
): ExternalCalendarEvent[] {
  const events: ExternalCalendarEvent[] = [];
  const eventBlocks = icsString.split(/BEGIN:VEVENT/i);

  eventBlocks.slice(1).forEach((block, idx) => {
    const summaryMatch = block.match(/SUMMARY(?:;[^:]+)?:([^\r\n]+)/i);
    const descMatch = block.match(/DESCRIPTION(?:;[^:]+)?:([^\r\n]+)/i);
    const locMatch = block.match(/LOCATION(?:;[^:]+)?:([^\r\n]+)/i);
    const dtStartMatch = block.match(/DTSTART(?:;[^:]+)?:([0-9T]+)/i);
    const dtEndMatch = block.match(/DTEND(?:;[^:]+)?:([0-9T]+)/i);
    const uidMatch = block.match(/UID(?:;[^:]+)?:([^\r\n]+)/i);

    const title = summaryMatch ? summaryMatch[1].replace(/\\,/g, ',').replace(/\\n/g, ' ').trim() : 'External Event';
    const description = descMatch ? descMatch[1].replace(/\\,/g, ',').replace(/\\n/g, ' ').trim() : '';
    const location = locMatch ? locMatch[1].replace(/\\,/g, ',').trim() : '';
    const externalEventId = uidMatch ? uidMatch[1].trim() : `ext-parsed-${Date.now()}-${idx}`;

    let date = new Date().toISOString().slice(0, 10);
    let startTime = '09:00';
    let endTime = '17:00';
    let isAllDay = false;

    if (dtStartMatch) {
      const val = dtStartMatch[1];
      if (val.length === 8) {
        // All-day event YYYYMMDD
        date = `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
        isAllDay = true;
        startTime = '00:00';
        endTime = '23:59';
      } else if (val.includes('T')) {
        const [dPart, tPart] = val.split('T');
        date = `${dPart.slice(0, 4)}-${dPart.slice(4, 6)}-${dPart.slice(6, 8)}`;
        startTime = `${tPart.slice(0, 2)}:${tPart.slice(2, 4)}`;
      }
    }

    if (dtEndMatch && !isAllDay) {
      const val = dtEndMatch[1];
      if (val.includes('T')) {
        const [, tPart] = val.split('T');
        endTime = `${tPart.slice(0, 2)}:${tPart.slice(2, 4)}`;
      }
    }

    // Determine event classification
    const lower = (title + ' ' + description).toLowerCase();
    let eventType: ExternalCalendarEvent['eventType'] = 'custom';
    let color = '#0284c7';

    if (lower.includes('buyout') || lower.includes('private dining') || lower.includes('party')) {
      eventType = 'restaurant_buyout';
      color = '#9333ea';
    } else if (lower.includes('cater') || lower.includes('luncheon') || lower.includes('delivery')) {
      eventType = 'catering_event';
      color = '#0284c7';
    } else if (lower.includes('vip') || lower.includes('tasting') || lower.includes('wine dinner')) {
      eventType = 'vip_reservation';
      color = '#e11d48';
    } else if (lower.includes('clean') || lower.includes('maintenance') || lower.includes('repair') || lower.includes('hood')) {
      eventType = 'maintenance';
      color = '#d97706';
    } else if (lower.includes('holiday') || lower.includes('labor day') || lower.includes('christmas') || lower.includes('thanksgiving')) {
      eventType = 'holiday';
      color = '#2563eb';
    } else if (lower.includes('busy') || lower.includes('ooo') || lower.includes('doctor') || lower.includes('personal')) {
      eventType = 'personal_busy';
      color = '#64748b';
    }

    events.push({
      id: `ext-imported-${Date.now()}-${idx}`,
      organizationId,
      locationId,
      provider,
      externalEventId,
      title,
      description,
      location,
      date,
      startTime,
      endTime,
      isAllDay,
      isBusy: true,
      privacyLevel: 'full_details',
      eventType,
      color,
      createdAt: new Date().toISOString(),
    });
  });

  return events;
}
