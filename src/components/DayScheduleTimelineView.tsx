import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  AlertTriangle,
  Zap,
  Building,
  User
} from 'lucide-react';
import {
  Shift,
  Employee,
  Department,
  ShiftTemplate,
  ExternalCalendarEvent
} from '../types';

interface DayScheduleTimelineViewProps {
  shifts: Shift[];
  employees: Employee[];
  templates: ShiftTemplate[];
  selectedDepartment: Department | 'all';
  searchQuery: string;
  externalEvents: ExternalCalendarEvent[];
  onOpenAddShift: (dateStr?: string, template?: ShiftTemplate) => void;
  onOpenEditShift: (shift: Shift) => void;
}

export const DayScheduleTimelineView: React.FC<DayScheduleTimelineViewProps> = ({
  shifts,
  employees,
  templates,
  selectedDepartment,
  searchQuery,
  externalEvents,
  onOpenAddShift,
  onOpenEditShift,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => '2026-08-15'); // Initial date

  const currentDateObj = new Date(`${selectedDate}T00:00:00`);
  const formattedDate = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrevDay = () => {
    const d = new Date(currentDateObj);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(currentDateObj);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  // Hours array from 06:00 (6 AM) to 24:00 (Midnight) + 01:00, 02:00
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

  const formatHourLabel = (h: number) => {
    const adjusted = h >= 24 ? h - 24 : h;
    const suffix = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayH = adjusted === 0 ? 12 : adjusted > 12 ? adjusted - 12 : adjusted;
    return `${displayH} ${suffix}`;
  };

  // Filter shifts for this date
  const dayShifts = shifts.filter((s) => {
    if (s.date !== selectedDate) return false;
    if (selectedDepartment !== 'all' && s.department !== selectedDepartment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.employeeName.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter external events for this date
  const dayEvents = externalEvents.filter((e) => e.date === selectedDate);

  const departments: Department[] = [
    'Front of House',
    'Back of House',
    'Bar & Beverage',
    'Kitchen Prep & Dish',
    'Management',
  ];

  const getPositionPercent = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    let hourNum = h + (m || 0) / 60;
    if (hourNum < 6) hourNum += 24; // overnight hours 00:00 - 05:00
    const startHour = 6;
    const totalHours = 20; // 6 to 26 (2 AM next day)
    return Math.max(0, Math.min(100, ((hourNum - startHour) / totalHours) * 100));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Day Navigator */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-900 tracking-tight select-none">
              {formattedDate}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAddShift(selectedDate)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Shift for This Day</span>
          </button>
        </div>
      </div>

      {/* External Events Banner for this Day */}
      {dayEvents.length > 0 && (
        <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
            <span>🎉 Special Restaurant Events on this date ({dayEvents.length})</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dayEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-2.5 bg-white border border-purple-200 rounded-xl shadow-2xs flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-purple-950">{evt.title}</div>
                  <div className="text-[10px] text-purple-700 font-mono mt-0.5">
                    {evt.startTime} - {evt.endTime} • {evt.location}
                  </div>
                </div>
                {evt.revenueForecast && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-100 text-purple-900 rounded-lg">
                    ${evt.revenueForecast.toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department Swimlanes Timeline Grid */}
      <div className="bg-white rounded-3xl shadow-xs border border-sky-100 overflow-x-auto">
        <div className="min-w-[900px]">
          
          {/* Time axis header */}
          <div className="grid grid-cols-[180px_1fr] border-b border-slate-200 bg-sky-50/60 sticky top-0 z-10">
            <div className="p-3 text-xs font-black text-slate-700 uppercase tracking-wider border-r border-slate-200">
              Department / Station
            </div>
            <div className="grid grid-cols-20 text-center divide-x divide-slate-200/60 py-2.5">
              {hours.map((h) => (
                <div key={h} className="text-[10px] font-mono font-bold text-slate-600 px-0.5">
                  {formatHourLabel(h)}
                </div>
              ))}
            </div>
          </div>

          {/* Department Lanes */}
          <div className="divide-y divide-slate-100">
            {departments
              .filter((d) => selectedDepartment === 'all' || selectedDepartment === d)
              .map((dept) => {
                const deptShifts = dayShifts.filter((s) => s.department === dept);

                return (
                  <div key={dept} className="grid grid-cols-[180px_1fr] min-h-[90px] group hover:bg-slate-50/40 transition-colors">
                    {/* Department info sidebar */}
                    <div className="p-3 border-r border-slate-200 bg-slate-50/40 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black text-xs text-slate-900">{dept}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {deptShifts.length} scheduled
                        </span>
                      </div>
                      <button
                        onClick={() => onOpenAddShift(selectedDate)}
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer mt-1"
                      >
                        <Plus className="w-2.5 h-2.5" /> <span>Add</span>
                      </button>
                    </div>

                    {/* Timeline Canvas */}
                    <div className="relative p-2 flex flex-col justify-center min-h-[80px]">
                      {/* Background hour grid lines */}
                      <div className="absolute inset-0 grid grid-cols-20 pointer-events-none divide-x divide-slate-100" />

                      {/* Shifts positioned horizontally */}
                      <div className="space-y-1.5 relative z-10">
                        {deptShifts.map((shift) => {
                          const leftPct = getPositionPercent(shift.startTime);
                          const rightPct = getPositionPercent(shift.endTime);
                          const widthPct = Math.max(8, rightPct - leftPct);

                          return (
                            <div
                              key={shift.id}
                              onClick={() => onOpenEditShift(shift)}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: shift.color || '#0284c7',
                              }}
                              className="relative h-9 rounded-xl text-white px-2 py-1 shadow-xs cursor-pointer hover:brightness-110 transition-all flex items-center justify-between text-xs overflow-hidden"
                              title={`${shift.employeeName} (${shift.role}) ${shift.startTime}-${shift.endTime}`}
                            >
                              <div className="truncate font-bold text-[11px] leading-tight">
                                <span>{shift.employeeName}</span>
                                <span className="block text-[9px] opacity-80 font-normal">{shift.role}</span>
                              </div>
                              <span className="font-mono text-[9px] opacity-90 shrink-0 hidden sm:inline ml-1">
                                {shift.startTime}-{shift.endTime}
                              </span>
                            </div>
                          );
                        })}

                        {deptShifts.length === 0 && (
                          <div className="text-[11px] text-slate-400 italic py-2">
                            No shifts scheduled for {dept}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

        </div>
      </div>

    </div>
  );
};
