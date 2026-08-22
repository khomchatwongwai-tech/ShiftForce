import React from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  Zap,
  Users,
  Building,
  CheckCircle2
} from 'lucide-react';
import {
  Shift,
  Employee,
  ExternalCalendarEvent,
  ShiftTemplate,
  Department
} from '../types';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  shifts: Shift[];
  externalEvents: ExternalCalendarEvent[];
  templates: ShiftTemplate[];
  employees: Employee[];
  onAddShiftForDate: (dateStr: string, template?: ShiftTemplate) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  shifts,
  externalEvents,
  templates,
  employees,
  onAddShiftForDate,
  onEditShift,
  onDeleteShift,
}) => {
  if (!isOpen) return null;

  const dayShifts = shifts.filter((s) => s.date === dateStr);
  const dayEvents = externalEvents.filter((e) => e.date === dateStr);

  const totalDayHours = dayShifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let h = eh - sh + (em - sm) / 60;
    if (h < 0) h += 24;
    return sum + Math.max(0, h - (s.breakMinutes || 0) / 60);
  }, 0);

  const totalDayCost = dayShifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let h = eh - sh + (em - sm) / 60;
    if (h < 0) h += 24;
    const dur = Math.max(0, h - (s.breakMinutes || 0) / 60);
    return sum + dur * s.hourlyWage;
  }, 0);

  const formattedDate = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-black text-base">{formattedDate}</h3>
              <div className="flex items-center gap-3 text-xs text-sky-200/80 mt-0.5 font-mono">
                <span>{dayShifts.length} Shifts</span>
                <span>•</span>
                <span>{totalDayHours.toFixed(1)} Hours</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">${totalDayCost.toFixed(2)} Labor</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddShiftForDate(dateStr)}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Shift</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* External Restaurant Events on this day */}
          {dayEvents.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <span>External Calendar Events ({dayEvents.length})</span>
              </div>
              <div className="space-y-2">
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-2xl border flex items-center justify-between"
                    style={{ backgroundColor: `${evt.color || '#0284c7'}10`, borderColor: `${evt.color || '#0284c7'}40` }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white"
                          style={{ backgroundColor: evt.color || '#0284c7' }}
                        >
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{evt.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {evt.startTime} - {evt.endTime} • {evt.location || 'Restaurant'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Apply Shift Patterns Shelf */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Quick Apply Pattern to this day:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {templates.slice(0, 4).map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => onAddShiftForDate(dateStr, tmpl)}
                  className="p-2 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="font-bold text-[11px] text-slate-800 truncate group-hover:text-sky-700">
                    {tmpl.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {tmpl.startTime}-{tmpl.endTime}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Roster of Shifts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Scheduled Shifts ({dayShifts.length})</span>
            </div>

            {dayShifts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <p className="text-xs text-slate-500">No shifts scheduled on this date.</p>
                <button
                  onClick={() => onAddShiftForDate(dateStr)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Shift for {formattedDate}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs group transition-all"
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
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-600 font-medium">
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onEditShift(shift)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
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
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Day View
          </button>
        </div>

      </div>
    </div>
  );
};
