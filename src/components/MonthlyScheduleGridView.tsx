import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Building,
  User,
  Zap,
  Info,
  CalendarDays
} from 'lucide-react';
import {
  Shift,
  Employee,
  Department,
  ShiftTemplate,
  CalendarDensity,
  ExternalCalendarEvent,
  CalendarConnection,
  CalendarConflict
} from '../types';
import { generateMonthGrid, MonthGridDay } from '../utils/calendarSyncEngine';

interface MonthlyScheduleGridViewProps {
  shifts: Shift[];
  employees: Employee[];
  templates: ShiftTemplate[];
  selectedDepartment: Department | 'all';
  searchQuery: string;
  externalEvents: ExternalCalendarEvent[];
  connections: CalendarConnection[];
  conflicts: CalendarConflict[];
  onOpenAddShift: (dateStr?: string, template?: ShiftTemplate) => void;
  onOpenEditShift: (shift: Shift) => void;
  onOpenCalendarSyncHub: () => void;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
  onSelectDay: (dateStr: string) => void;
}

export const MonthlyScheduleGridView: React.FC<MonthlyScheduleGridViewProps> = ({
  shifts,
  employees,
  templates,
  selectedDepartment,
  searchQuery,
  externalEvents,
  connections,
  conflicts,
  onOpenAddShift,
  onOpenEditShift,
  onOpenCalendarSyncHub,
  onTriggerSync,
  isSyncing,
  onSelectDay,
}) => {
  // Calendar Month State (Defaults to August 2026 for sample data)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // August 2026
  const [density, setDensity] = useState<CalendarDensity>('comfortable');

  // Layer Toggles
  const [showExternalEvents, setShowExternalEvents] = useState(true);
  const [showBusyBlocks, setShowBusyBlocks] = useState(true);
  const [showPaydaysHolidays, setShowPaydaysHolidays] = useState(true);
  const [showOvertimePills, setShowOvertimePills] = useState(true);
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Generate Month Grid Matrix
  const monthDays = useMemo(() => {
    return generateMonthGrid(year, month);
  }, [year, month]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Helper to calculate shift duration in hours
  const getShiftHours = (s: Shift) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return Math.max(0, (diff - (s.breakMinutes || 0)) / 60);
  };

  // Filter shifts based on department and search query
  const filteredShifts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shifts.filter((s) => {
      const matchesDept = selectedDepartment === 'all' || s.department === selectedDepartment;
      const matchesSearch =
        q === '' ||
        (s.employeeName || '').toLowerCase().includes(q) ||
        (s.role || '').toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [shifts, selectedDepartment, searchQuery]);

  // Group shifts by date string
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    filteredShifts.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [filteredShifts]);

  // Group external events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, ExternalCalendarEvent[]> = {};
    externalEvents.forEach((evt) => {
      // Filter out busy blocks if toggle is off
      if (!showBusyBlocks && evt.eventType === 'personal_busy') return;
      // Filter out holidays/paydays if toggle is off
      if (!showPaydaysHolidays && (evt.eventType === 'holiday' || evt.eventType === 'payday')) return;
      // Filter out catering/buyouts if toggle is off
      if (!showExternalEvents && (evt.eventType === 'restaurant_buyout' || evt.eventType === 'catering_event' || evt.eventType === 'vip_reservation')) return;

      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [externalEvents, showBusyBlocks, showPaydaysHolidays, showExternalEvents]);

  // Monthly aggregated labor analytics
  const monthlyStats = useMemo(() => {
    let totalHours = 0;
    let totalLaborCost = 0;
    let shiftCount = 0;

    // Filter shifts belonging to current month
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    filteredShifts.forEach((s) => {
      if (s.date >= startStr && s.date <= endStr) {
        const hrs = getShiftHours(s);
        totalHours += hrs;
        totalLaborCost += hrs * s.hourlyWage;
        shiftCount += 1;
      }
    });

    const monthlyBudget = 165000;
    const monthlyForecastRevenue = 520000;
    const laborPercentage = monthlyForecastRevenue > 0 ? (totalLaborCost / monthlyForecastRevenue) * 100 : 0;

    return {
      totalHours,
      totalLaborCost,
      shiftCount,
      monthlyBudget,
      monthlyForecastRevenue,
      laborPercentage,
      remainingBudget: monthlyBudget - totalLaborCost,
    };
  }, [filteredShifts, year, month]);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Month Navigation & Synchronization Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Month Navigator & Quick Today */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-900 tracking-tight select-none">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-700 hover:text-slate-950 hover:bg-white rounded-lg transition-all cursor-pointer"
              title="Next Month"
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

          {/* Conflict Alert Pill if any */}
          {conflicts.length > 0 && (
            <button
              onClick={onOpenCalendarSyncHub}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{conflicts.length} Calendar Conflicts</span>
            </button>
          )}
        </div>

        {/* Right: Density Toggle, Layers, Sync Hub Button */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          
          {/* Density Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-0.5 text-xs font-semibold">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                density === 'compact' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                density === 'comfortable' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Comfortable
            </button>
            <button
              onClick={() => setDensity('detailed')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                density === 'detailed' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Detailed
            </button>
          </div>

          {/* Calendar Layers Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
              className={`px-3 py-2 text-xs font-bold border rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isLayerMenuOpen ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>Calendar Layers</span>
            </button>

            {isLayerMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 space-y-2 text-xs animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  <span>Overlay Filters</span>
                  <button onClick={() => setIsLayerMenuOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>Restaurant Buyouts &amp; VIPs</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showExternalEvents}
                    onChange={(e) => setShowExternalEvents(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                    <span>Staff Personal Busy Blocks</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showBusyBlocks}
                    onChange={(e) => setShowBusyBlocks(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span>Paydays &amp; National Holidays</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showPaydaysHolidays}
                    onChange={(e) => setShowPaydaysHolidays(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer">
                  <span className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Overtime &amp; Budget Warnings</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showOvertimePills}
                    onChange={(e) => setShowOvertimePills(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Sync Trigger & Hub Button */}
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Perform bi-directional sync with Google Workspace & Microsoft 365"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Feeds'}</span>
          </button>

          <button
            onClick={onOpenCalendarSyncHub}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-900 to-indigo-950 text-white hover:from-sky-800 hover:to-indigo-900 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Calendar Hub</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </button>

        </div>

      </div>

      {/* Monthly Labor Intelligence & Revenue Projection Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-4 text-white shadow-md border border-slate-800">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              Monthly Scheduled Cost
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              ${monthlyStats.totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-sky-200/80 font-mono">
              {monthlyStats.shiftCount} Shifts • {monthlyStats.totalHours.toFixed(1)} Hours
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              Monthly Labor Budget
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-white">
              ${monthlyStats.monthlyBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold">
              ${monthlyStats.remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Remaining
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              Forecasted Revenue
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              ${monthlyStats.monthlyForecastRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-sky-200/80 font-mono">
              Labor Target: {monthlyStats.laborPercentage.toFixed(1)}% of sales
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
              Synced External Events
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-purple-300">
              {externalEvents.length} Active
            </div>
            <div className="text-[10px] text-sky-200/80 truncate">
              {connections.length} External Calendar Integrations
            </div>
          </div>

        </div>
      </div>

      {/* Full 7-Column Month Calendar Grid */}
      <div className="bg-white rounded-3xl shadow-xs border border-sky-100 overflow-hidden">
        
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-sky-50/50 text-center divide-x divide-slate-200">
          {daysOfWeek.map((dayName, idx) => (
            <div key={dayName} className="py-2.5 px-2">
              <span className={`text-xs font-black uppercase tracking-wider ${idx >= 5 ? 'text-indigo-700' : 'text-slate-700'}`}>
                {dayName}
              </span>
            </div>
          ))}
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/40">
          {monthDays.map((day) => {
            const dayShifts = shiftsByDate[day.dateStr] || [];
            const dayEvents = eventsByDate[day.dateStr] || [];
            
            const totalDayHours = dayShifts.reduce((sum, s) => sum + getShiftHours(s), 0);
            const totalDayCost = dayShifts.reduce((sum, s) => sum + getShiftHours(s) * s.hourlyWage, 0);

            const hasOvertimeShift = dayShifts.some((s) => getShiftHours(s) > 8);

            return (
              <div
                key={day.dateStr}
                onClick={() => onSelectDay(day.dateStr)}
                className={`p-1.5 sm:p-2 flex flex-col justify-between transition-all group cursor-pointer ${
                  density === 'compact'
                    ? 'min-h-[100px]'
                    : density === 'comfortable'
                    ? 'min-h-[140px]'
                    : 'min-h-[180px]'
                } ${
                  !day.isCurrentMonth
                    ? 'bg-slate-50/60 opacity-40 hover:opacity-80'
                    : day.isToday
                    ? 'bg-sky-50/50 ring-2 ring-sky-500/50 z-10'
                    : 'bg-white hover:bg-sky-50/20'
                }`}
              >
                {/* Cell Header: Date Number + Daily Aggregates + Add Button */}
                <div className="flex items-center justify-between mb-1 gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        day.isToday
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800 group-hover:text-sky-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayShifts.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        {totalDayHours.toFixed(0)}h (${totalDayCost.toFixed(0)})
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddShift(day.dateStr);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100/80 rounded-md transition-all cursor-pointer"
                    title={`Add shift for ${day.dateStr}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Body: External Events Badges & Shift Pills */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  
                  {/* External Events (Buyout, VIP, Maintenance, Payday, Holiday) */}
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      title={`${evt.title} (${evt.startTime}-${evt.endTime})`}
                      className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white truncate shadow-2xs flex items-center gap-1"
                      style={{ backgroundColor: evt.color || '#9333ea' }}
                    >
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}

                  {/* Scheduled Workqora Shifts */}
                  {dayShifts.slice(0, density === 'compact' ? 2 : density === 'comfortable' ? 4 : 8).map((shift) => {
                    const hrs = getShiftHours(shift);
                    const isOt = hrs > 8;

                    return (
                      <div
                        key={shift.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditShift(shift);
                        }}
                        style={{ borderLeftColor: shift.color || '#0284c7' }}
                        className={`px-1.5 py-0.5 rounded-md border border-l-3 bg-white hover:bg-sky-50/80 text-[10px] text-slate-800 shadow-2xs truncate flex items-center justify-between gap-1 transition-colors ${
                          isOt && showOvertimePills ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200'
                        }`}
                        title={`${shift.employeeName} (${shift.role}) ${shift.startTime}-${shift.endTime} • ${hrs.toFixed(1)}h`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          {isOt && showOvertimePills && (
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          )}
                          <span className="font-bold truncate">{shift.employeeName}</span>
                          <span className="text-slate-400 truncate text-[9px]">({shift.role})</span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-500 shrink-0 font-medium">
                          {shift.startTime.slice(0, 5)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Overflow indicator if more shifts exist than display limit */}
                  {dayShifts.length > (density === 'compact' ? 2 : density === 'comfortable' ? 4 : 8) && (
                    <div className="text-[9px] font-bold text-sky-700 hover:text-sky-900 text-center font-mono">
                      +{dayShifts.length - (density === 'compact' ? 2 : density === 'comfortable' ? 4 : 8)} more shifts
                    </div>
                  )}

                </div>

                {/* Cell Footer for detailed mode */}
                {density === 'detailed' && dayShifts.length > 0 && (
                  <div className="pt-1 mt-1 border-t border-slate-100 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{dayShifts.length} staff</span>
                    <span>${totalDayCost.toFixed(0)}</span>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
