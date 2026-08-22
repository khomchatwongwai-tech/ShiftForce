import React, { useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Search,
  Filter,
  User,
  Building,
  CheckCircle2
} from 'lucide-react';
import {
  Shift,
  Employee,
  Department,
  ShiftTemplate,
  ExternalCalendarEvent
} from '../types';

interface AgendaScheduleListViewProps {
  shifts: Shift[];
  employees: Employee[];
  templates: ShiftTemplate[];
  selectedDepartment: Department | 'all';
  searchQuery: string;
  externalEvents: ExternalCalendarEvent[];
  onOpenAddShift: (dateStr?: string, template?: ShiftTemplate) => void;
  onOpenEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const AgendaScheduleListView: React.FC<AgendaScheduleListViewProps> = ({
  shifts,
  employees,
  templates,
  selectedDepartment,
  searchQuery,
  externalEvents,
  onOpenAddShift,
  onOpenEditShift,
  onDeleteShift,
}) => {
  // Filter shifts
  const filteredShifts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shifts.filter((s) => {
      const matchesDept = selectedDepartment === 'all' || s.department === selectedDepartment;
      const matchesSearch =
        q === '' ||
        s.employeeName.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.date.includes(q);
      return matchesDept && matchesSearch;
    });
  }, [shifts, selectedDepartment, searchQuery]);

  // Group shifts and external events by date in chronological order
  const dateGroups = useMemo(() => {
    const allDates = new Set<string>();
    filteredShifts.forEach((s) => allDates.add(s.date));
    externalEvents.forEach((e) => allDates.add(e.date));

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((dateStr) => {
      const dayShifts = filteredShifts.filter((s) => s.date === dateStr);
      const dayEvents = externalEvents.filter((e) => e.date === dateStr);

      const totalDayHours = dayShifts.reduce((acc, s) => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        let h = eh - sh + (em - sm) / 60;
        if (h < 0) h += 24;
        return acc + Math.max(0, h - (s.breakMinutes || 0) / 60);
      }, 0);

      const totalDayCost = dayShifts.reduce((acc, s) => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        let h = eh - sh + (em - sm) / 60;
        if (h < 0) h += 24;
        const dur = Math.max(0, h - (s.breakMinutes || 0) / 60);
        return acc + dur * s.hourlyWage;
      }, 0);

      return {
        dateStr,
        shifts: dayShifts,
        events: dayEvents,
        totalDayHours,
        totalDayCost,
      };
    });
  }, [filteredShifts, externalEvents]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Agenda Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-xs border border-sky-100">
        <div>
          <h3 className="font-black text-sm text-slate-900">Chronological Shift Agenda</h3>
          <p className="text-xs text-slate-500">
            Showing all upcoming restaurant roster schedules and synced calendar events.
          </p>
        </div>
        <button
          onClick={() => onOpenAddShift()}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Shift</span>
        </button>
      </div>

      {/* Date Groups */}
      <div className="space-y-4">
        {dateGroups.map(({ dateStr, shifts: dayShifts, events: dayEvents, totalDayHours, totalDayCost }) => {
          const dateObj = new Date(`${dateStr}T00:00:00`);
          const formattedHeader = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          const isToday = new Date().toISOString().slice(0, 10) === dateStr;

          return (
            <div
              key={dateStr}
              className={`bg-white rounded-3xl shadow-xs border overflow-hidden transition-all ${
                isToday ? 'border-sky-300 ring-2 ring-sky-500/20' : 'border-slate-200'
              }`}
            >
              {/* Day Header */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                    isToday ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {dateObj.getDate()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                      <span>{formattedHeader}</span>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px] font-black uppercase">
                          Today
                        </span>
                      )}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                  <span>{dayShifts.length} Shifts</span>
                  <span>•</span>
                  <span>{totalDayHours.toFixed(1)}h</span>
                  <span>•</span>
                  <span className="font-bold text-emerald-700">${totalDayCost.toFixed(2)}</span>
                  <button
                    onClick={() => onOpenAddShift(dateStr)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                    title="Add shift on this day"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Events & Shifts List */}
              <div className="p-3 sm:p-4 space-y-2">
                
                {/* External Events */}
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl border flex items-center justify-between"
                    style={{ backgroundColor: `${evt.color || '#9333ea'}10`, borderColor: `${evt.color || '#9333ea'}40` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white"
                        style={{ backgroundColor: evt.color || '#9333ea' }}
                      >
                        {evt.eventType.replace(/_/g, ' ')}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                        <span className="text-[11px] text-slate-500 font-mono ml-2">
                          ({evt.startTime} - {evt.endTime})
                        </span>
                      </div>
                    </div>

                    {evt.revenueForecast && (
                      <span className="text-xs font-mono font-bold text-purple-900">
                        ${evt.revenueForecast.toLocaleString()} ({evt.attendeesCount || 0} Pax)
                      </span>
                    )}
                  </div>
                ))}

                {/* Shift Roster Rows */}
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/70 flex items-center justify-between gap-3 shadow-2xs group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: shift.color || '#0284c7' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {shift.employeeName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">
                            {shift.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({shift.department})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>{shift.startTime} - {shift.endTime}</span>
                          <span>•</span>
                          <span>${shift.hourlyWage}/hr</span>
                          {shift.notes && <span className="italic text-slate-400">"{shift.notes}"</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenEditShift(shift)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Shift"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteShift(shift.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Shift"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {dayShifts.length === 0 && dayEvents.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400 italic">
                    No scheduled activity.
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
