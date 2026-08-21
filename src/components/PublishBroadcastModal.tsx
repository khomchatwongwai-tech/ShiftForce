import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState, useEffect } from 'react';
import {
  Send,
  Smartphone,
  Mail,
  Bell,
  CheckCircle2,
  Users,
  X,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Employee, Shift, SupportedLanguage, NotificationDispatch } from '../types';

interface PublishBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  shifts: Shift[];
  weekDates: { dateStr: string; dayName: string }[];
  currentLanguage: SupportedLanguage;
  onBroadcastComplete: (dispatches: NotificationDispatch[]) => void;
}

export const PublishBroadcastModal: React.FC<PublishBroadcastModalProps> = ({
  isOpen,
  onClose,
  employees,
  shifts,
  weekDates,
  currentLanguage,
  onBroadcastComplete,
}) => {
  const t = translations[currentLanguage];
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<{ app: boolean; sms: boolean; email: boolean }>({
    app: true,
    sms: true,
    email: true,
  });

  const activeEmployees = employees.filter(e => e.status === 'active');

  // Preview generated 7-day personalized message for the first 3 employees
  const generatePersonalizedMessage = (emp: Employee) => {
    const empShifts = shifts.filter(s => s.employeeId === emp.id);
    const shiftSummary = empShifts
      .map(s => `• ${s.date} (${s.startTime}-${s.endTime}) - ${s.role}`)
      .join('\n');

    const totalHours = empShifts.reduce((acc, s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      return acc + (diff - s.breakMinutes) / 60;
    }, 0);

    return {
      title: `📅 ${emp.name}'s 7-Day Restaurant Schedule Published`,
      body: `Hello ${emp.name},\nYour restaurant shift schedule for ${weekDates[0]?.dateStr} to ${weekDates[6]?.dateStr} is confirmed:\n\n${shiftSummary || 'No shifts scheduled this week.'}\n\nTotal Scheduled: ${totalHours.toFixed(1)} hrs. Please report any swaps 24h prior.`,
      totalHours,
      shiftCount: empShifts.length,
    };
  };

  const handleStartBroadcast = () => {
    setIsBroadcasting(true);
    setProgress(0);

    const dispatches: NotificationDispatch[] = [];
    const enabledChannels: ('app' | 'sms' | 'email')[] = [];
    if (selectedChannels.app) enabledChannels.push('app');
    if (selectedChannels.sms) enabledChannels.push('sms');
    if (selectedChannels.email) enabledChannels.push('email');

    // Simulate batch sending
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBroadcasting(false);
          setBroadcastDone(true);

          // Build dispatch records for all active employees
          activeEmployees.forEach(emp => {
            const msg = generatePersonalizedMessage(emp);
            dispatches.push({
              id: `dispatch-${Date.now()}-${emp.id}`,
              recipientEmployeeId: emp.id,
              recipientName: emp.name,
              recipientPhone: emp.phone,
              recipientEmail: emp.email,
              type: 'schedule_publish_7day',
              title: msg.title,
              message: msg.body,
              channels: enabledChannels,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              status: 'delivered',
            });
          });

          onBroadcastComplete(dispatches);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t.publishAndNotifyAll}</h3>
              <p className="text-xs text-sky-100">{t.publish7DayBroadcast}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">

          {/* Target Audience Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-center">
              <div className="text-xs text-sky-600 font-semibold uppercase">Total Staff</div>
              <div className="text-xl font-bold text-slate-900">{activeEmployees.length} Staff</div>
              <div className="text-[10px] text-slate-500">1 to 1000 Capacity</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <div className="text-xs text-blue-600 font-semibold uppercase">7-Day Period</div>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {weekDates[0]?.dayName.slice(0, 3)} - {weekDates[6]?.dayName.slice(0, 3)}
              </div>
              <div className="text-[10px] text-slate-500">{shifts.length} Total Shifts</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <div className="text-xs text-emerald-600 font-semibold uppercase">Dispatch Mode</div>
              <div className="text-sm font-bold text-slate-900 mt-1">Multi-Channel</div>
              <div className="text-[10px] text-slate-500">Simultaneous SMS / Email / App</div>
            </div>
          </div>

          {/* Channel Selectors */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Simultaneous Delivery Channels:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedChannels.app ? 'bg-white border-sky-500 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedChannels.app}
                  onChange={(e) => setSelectedChannels({ ...selectedChannels, app: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">In-App Push</div>
                    <div className="text-[10px] text-slate-500">Live app portal alert</div>
                  </div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedChannels.sms ? 'bg-white border-sky-500 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedChannels.sms}
                  onChange={(e) => setSelectedChannels({ ...selectedChannels, sms: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">SMS Text</div>
                    <div className="text-[10px] text-slate-500">To mobile number</div>
                  </div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                selectedChannels.email ? 'bg-white border-sky-500 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedChannels.email}
                  onChange={(e) => setSelectedChannels({ ...selectedChannels, email: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Email Roster</div>
                    <div className="text-[10px] text-slate-500">Personalized PDF & table</div>
                  </div>
                </div>
              </label>

            </div>
          </div>

          {/* Sample Preview of Personalized Message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700">
                Personalized Preview Sample (Individual per staff member):
              </span>
              <span className="text-[11px] text-sky-600 font-mono">
                Sample: {activeEmployees[0]?.name}
              </span>
            </div>
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs whitespace-pre-wrap max-h-36 overflow-y-auto border border-slate-800">
              {activeEmployees[0] ? generatePersonalizedMessage(activeEmployees[0]).body : ''}
            </div>
          </div>

          {/* Progress Bar (during broadcast) */}
          {isBroadcasting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching to {activeEmployees.length} phones & emails...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Broadcast Success Confirmation */}
          {broadcastDone && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  7-Day Schedule Successfully Published &amp; Broadcasted!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  All {activeEmployees.length} staff members received their personalized 7-day shift roster across SMS ({selectedChannels.sms ? 'Yes' : 'Off'}), Email ({selectedChannels.email ? 'Yes' : 'Off'}), and In-App push notifications.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            {broadcastDone ? 'Close' : 'Cancel'}
          </button>

          {!broadcastDone ? (
            <button
              id="confirm-publish-broadcast-btn"
              onClick={handleStartBroadcast}
              disabled={isBroadcasting}
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Publish &amp; Send to All {activeEmployees.length} Staff</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
};