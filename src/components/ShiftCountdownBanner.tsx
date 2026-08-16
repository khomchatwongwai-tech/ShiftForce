import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Mail,
  Bell,
  MapPin,
  Zap,
  ChefHat,
  Sparkles,
  CalendarCheck,
  MessageSquare,
  CheckCheck
} from 'lucide-react';
import { Employee, Shift, SupportedLanguage } from '../types';
import { translations } from '../utils/i18n';

interface ShiftCountdownBannerProps {
  currentEmployee: Employee;
  shifts: Shift[];
  currentLanguage: SupportedLanguage;
  onClockIn: (shift: Shift, lateMinutes: number, status: 'on_time' | 'late') => void;
  onTrigger1HrAlert: (shift: Shift, employee: Employee) => void;
  onTrigger24HrReminder?: (shift: Shift, employee: Employee, channel?: 'whatsapp' | 'sms') => void;
}

export const ShiftCountdownBanner: React.FC<ShiftCountdownBannerProps> = ({
  currentEmployee,
  shifts,
  currentLanguage,
  onClockIn,
  onTrigger1HrAlert,
  onTrigger24HrReminder,
}) => {
  const t = translations[currentLanguage];
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [nextShift, setNextShift] = useState<Shift | null>(null);
  const [clockedIn, setClockedIn] = useState<boolean>(false);
  const [showSimAlert, setShowSimAlert] = useState<boolean>(false);
  const [simAlertDetails, setSimAlertDetails] = useState<{ type: '24hr' | '1hr'; channel: string; text: string } | null>(null);

  // Find the next upcoming shift for this employee
  useEffect(() => {
    const empShifts = shifts.filter(s => s.employeeId === currentEmployee.id);
    if (empShifts.length > 0) {
      setNextShift(empShifts[0]);
    } else {
      setNextShift(null);
    }
  }, [currentEmployee, shifts]);

  // Live timer tick
  useEffect(() => {
    if (!nextShift) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const [startHour, startMin] = nextShift.startTime.split(':').map(Number);
      const shiftDate = new Date();
      shiftDate.setHours(startHour, startMin, 0, 0);

      let diffMs = shiftDate.getTime() - now.getTime();
      if (diffMs < 0) {
        diffMs = 54 * 60 * 1000 + 35 * 1000;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [nextShift]);

  if (!nextShift) return null;

  const isUnder1Hour = timeLeft ? (timeLeft.hours === 0 && timeLeft.minutes <= 60) : true;

  const handleSimulateClockIn = () => {
    if (!nextShift) return;
    const isLate = Math.random() > 0.6;
    const lateMins = isLate ? Math.floor(6 + Math.random() * 12) : 0;
    onClockIn(nextShift, lateMins, isLate ? 'late' : 'on_time');
    setClockedIn(true);
  };

  const handleTrigger24Hr = (channel: 'whatsapp' | 'sms') => {
    if (onTrigger24HrReminder && nextShift) {
      onTrigger24HrReminder(nextShift, currentEmployee, channel);
    }
    setSimAlertDetails({
      type: '24hr',
      channel: channel === 'whatsapp' ? 'WhatsApp Business' : 'SMS Gateway',
      text: `🍽️ ShiftForce 24-Hour Shift Reminder sent to ${currentEmployee.phone}: "Hi ${currentEmployee.name}, your shift tomorrow starts at ${nextShift.startTime} on ${nextShift.date}."`,
    });
    setShowSimAlert(true);
    setTimeout(() => setShowSimAlert(false), 5000);
  };

  const handleTrigger1Hr = () => {
    if (nextShift) {
      onTrigger1HrAlert(nextShift, currentEmployee);
    }
    setSimAlertDetails({
      type: '1hr',
      channel: 'Push + SMS',
      text: `⏰ 1-Hour Urgent Shift Countdown sent to ${currentEmployee.phone} & ${currentEmployee.email}: "Reminder: Your shift starts in 1 hour at ${nextShift.startTime}!"`,
    });
    setShowSimAlert(true);
    setTimeout(() => setShowSimAlert(false), 5000);
  };

  return (
    <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg shadow-sky-500/15 mb-6 relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

        {/* Left: Employee info & Shift Details */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <Clock className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded-md border border-white/20">
                {currentEmployee.department}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-sky-200 text-sky-900 rounded-md">
                {nextShift.role}
              </span>

              {/* 24-Hour Pre-Shift Active Badge */}
              <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-500 text-white rounded-full flex items-center gap-1 shadow-xs">
                <MessageSquare className="w-3 h-3 text-emerald-100" />
                <span>24h WhatsApp/SMS Armed</span>
              </span>

              {isUnder1Hour && (
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full animate-bounce flex items-center gap-1 shadow-sm">
                  <AlertCircle className="w-3 h-3" /> {t.hoursUntilShift}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-bold mt-1 tracking-tight">
              {currentEmployee.name} - Next Shift: {nextShift.date} ({nextShift.startTime} - {nextShift.endTime})
            </h2>

            <p className="text-xs text-sky-100 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>📍 Station: Floor Table Rotation A / Station 3</span>
              <span>•</span>
              <span>Rate: ${nextShift.hourlyWage.toFixed(2)}/hr</span>
              <span>•</span>
              <span className="text-emerald-200 font-medium">Auto-notified via WhatsApp 24h prior</span>
            </p>
          </div>
        </div>

        {/* Right: Live Countdown & Clock In Action */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">

          {/* Countdown Clock Display */}
          <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-sky-100">
              {t.nextShiftIn}
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
              {timeLeft ? (
                <>
                  <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
                  <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                </>
              ) : (
                '00:54:12'
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {!clockedIn ? (
              <button
                id="clock-in-btn"
                onClick={handleSimulateClockIn}
                className="bg-white hover:bg-sky-50 text-sky-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span>{t.clockIn}</span>
              </button>
            ) : (
              <div className="bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Clocked In (Active)</span>
              </div>
            )}

            {/* Test 24-Hour WhatsApp Notification Trigger */}
            <button
              id="test-24hr-alert-btn"
              onClick={() => handleTrigger24Hr('whatsapp')}
              title="Simulate 24-Hour WhatsApp Pre-Shift Alert"
              className="bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs px-2.5 py-2.5 rounded-xl border border-emerald-300/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Test 24h WhatsApp</span>
            </button>

            {/* Test 1-Hour Alert Trigger */}
            <button
              id="test-1hr-alert-btn"
              onClick={handleTrigger1Hr}
              title="Test 1-Hour Pre-Shift Multi-channel Dispatch"
              className="bg-sky-700/60 hover:bg-sky-700 text-white text-xs px-2.5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Test 1h Push</span>
            </button>
          </div>

        </div>

      </div>

      {/* Simulated Live Alert Banner */}
      {showSimAlert && simAlertDetails && (
        <div className="mt-3 pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-black/30 backdrop-blur-md p-3 rounded-xl animate-in fade-in slide-in-from-top-2 gap-2">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${simAlertDetails.type === '24hr' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-slate-900'}`}>
              {simAlertDetails.type === '24hr' ? <MessageSquare className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </span>
            <div>
              <span className="font-bold text-white uppercase text-[10px] tracking-wider bg-white/20 px-1.5 py-0.5 rounded mr-1.5">
                {simAlertDetails.channel}
              </span>
              <span className="text-sky-100 font-medium">
                {simAlertDetails.text}
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-400/30 text-emerald-200 px-2.5 py-1 rounded-md font-mono font-bold self-end sm:self-center shrink-0 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
            DISPATCHED (200 OK)
          </span>
        </div>
      )}
    </div>
  );
};
