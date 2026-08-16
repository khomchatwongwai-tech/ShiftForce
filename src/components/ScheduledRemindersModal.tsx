import React, { useState } from 'react';
import {
  X,
  Clock,
  MessageSquare,
  Smartphone,
  Send,
  CheckCircle2,
  Play,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Sparkles,
  Bell,
  Mail,
  Eye,
  Calendar,
  Zap,
  CheckCheck
} from 'lucide-react';
import {
  Employee,
  Shift,
  SupportedLanguage,
  NotificationDispatch,
  ReminderSchedulerConfig,
  ScheduledReminderTask
} from '../types';
import { translations } from '../utils/i18n';

interface ScheduledRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  employees: Employee[];
  currentLanguage: SupportedLanguage;
  config: ReminderSchedulerConfig;
  onUpdateConfig: (newConfig: Partial<ReminderSchedulerConfig>) => void;
  onTriggerManualScan: () => void;
  onTriggerSingleShiftReminder: (shift: Shift, employee: Employee, channel: 'whatsapp' | 'sms') => void;
  dispatches: NotificationDispatch[];
  isScanning?: boolean;
}

export const ScheduledRemindersModal: React.FC<ScheduledRemindersModalProps> = ({
  isOpen,
  onClose,
  shifts,
  employees,
  currentLanguage,
  config,
  onUpdateConfig,
  onTriggerManualScan,
  onTriggerSingleShiftReminder,
  dispatches,
  isScanning = false,
}) => {
  const t = translations[currentLanguage];
  const [activeTab, setActiveTab] = useState<'queue' | 'templates' | 'logs'>('queue');
  const [selectedPreviewShift, setSelectedPreviewShift] = useState<Shift>(shifts[0] || {} as Shift);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  // Filter 24h reminder dispatches
  const reminderDispatches = dispatches.filter(d => d.type === 'shift_24hr_reminder' || d.type === 'shift_1hr_countdown');

  // Preview employee
  const previewEmp = employees.find(e => e.id === selectedPreviewShift?.employeeId) || employees[0];

  const whatsappMessagePreview = `🍽️ *ShiftForce 24-Hour Shift Reminder*
Hi *${previewEmp?.name || 'Elena'}*, your upcoming shift as *${selectedPreviewShift?.role || 'Head Server'}* (${selectedPreviewShift?.department || 'Front of House'}) starts tomorrow at *${selectedPreviewShift?.startTime || '16:00'}* on *${selectedPreviewShift?.date || 'Tomorrow'}*.

📍 *Station*: ${selectedPreviewShift?.notes || 'Floor & Dining Room'}
⏳ *Swap / Coverage*: Need an adjustment? Submit via ShiftForce employee portal at least 12h prior.

Reply *CONFIRM* to acknowledge receipt.`;

  const smsMessagePreview = `ShiftForce Alert: Hi ${previewEmp?.name || 'Elena'}, you are scheduled tomorrow ${selectedPreviewShift?.date || 'Tomorrow'} at ${selectedPreviewShift?.startTime || '16:00'} (${selectedPreviewShift?.role || 'Head Server'}). Tap app to confirm or request swap.`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 my-8">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">24-Hour Automated Shift Reminders</h3>
                <span className="bg-emerald-400/30 text-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-300/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  Scheduled Trigger Active
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Automated multi-channel daemon dispatches WhatsApp &amp; SMS alerts 24h &amp; 1h prior to shift start
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Trigger Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'queue'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              Active Shift Queue ({shifts.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'templates'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              WhatsApp &amp; SMS Template Preview
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <span>Automated Dispatches Log</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {reminderDispatches.length}
              </span>
            </button>
          </div>

          {/* Quick Manual Trigger Button */}
          <button
            id="run-scheduled-trigger-btn"
            onClick={onTriggerManualScan}
            disabled={isScanning}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Shifts...' : 'Run 24h & 1h Trigger Check Now'}</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {/* Top Quick Settings Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">24-Hour Pre-Shift Task Trigger</span>
                <span className="px-2 py-0.5 bg-emerald-200/60 text-emerald-900 text-[10px] font-bold rounded-md">
                  Auto-Daemon
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Automatically scans restaurant shifts and dispatches WhatsApp &amp; SMS alerts exactly 24 hours prior.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.enable24HrReminder}
                  onChange={(e) => onUpdateConfig({ enable24HrReminder: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>24h Reminder Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={config.enable1HrAlert}
                  onChange={(e) => onUpdateConfig({ enable1HrAlert: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>1h Urgent Alert Active</span>
              </label>
            </div>
          </div>

          {/* TAB 1: Upcoming Shift Queue */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Upcoming Shifts Scheduled for Automated Notification</h4>
                  <p className="text-xs text-slate-500">Each employee receives a WhatsApp message &amp; SMS 24 hours before shift start.</p>
                </div>
                <input
                  type="text"
                  placeholder="Search staff, role, or date..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-200 rounded-xl w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Staff Member</th>
                        <th className="px-4 py-3">Role &amp; Dept</th>
                        <th className="px-4 py-3">Shift Date &amp; Time</th>
                        <th className="px-4 py-3">24h WhatsApp Status</th>
                        <th className="px-4 py-3">1h Alert Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shifts
                        .filter(s => {
                          if (!searchFilter) return true;
                          const q = searchFilter.toLowerCase();
                          return s.employeeName.toLowerCase().includes(q) || s.role.toLowerCase().includes(q) || s.date.toLowerCase().includes(q);
                        })
                        .slice(0, 15)
                        .map((shift) => {
                          const emp = employees.find(e => e.id === shift.employeeId) || employees[0];
                          const has24hDispatched = dispatches.some(d => d.type === 'shift_24hr_reminder' && d.metadata?.shiftId === shift.id);
                          const has1hDispatched = dispatches.some(d => d.type === 'shift_1hr_countdown' && d.metadata?.shiftId === shift.id);

                          return (
                            <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: emp.color || '#0284c7' }}
                                  >
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                    <div className="text-[10px] text-slate-500">{emp.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-slate-800">{shift.role}</span>
                                <div className="text-[10px] text-slate-500">{shift.department}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">{shift.date}</div>
                                <div className="text-[11px] text-emerald-700 font-mono font-medium">
                                  {shift.startTime} - {shift.endTime}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {has24hDispatched ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                                    WhatsApp &amp; SMS Sent
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    Armed (24h Window)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {has1hDispatched ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                    <CheckCircle2 className="w-3 h-3 text-sky-600" />
                                    1h Alert Sent
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Pending 1h mark
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => onTriggerSingleShiftReminder(shift, emp, 'whatsapp')}
                                    title="Send 24h WhatsApp Reminder to Employee"
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="hidden sm:inline">Send 24h WhatsApp</span>
                                  </button>
                                  <button
                                    onClick={() => onTriggerSingleShiftReminder(shift, emp, 'sms')}
                                    title="Send 24h SMS Reminder"
                                    className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                  >
                                    <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                                    <span className="hidden sm:inline">SMS</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WhatsApp & SMS Live Template Preview */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* WhatsApp Mobile Mockup */}
              <div className="bg-[#0b141a] rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-slate-700 flex flex-col justify-between">
                <div>
                  {/* WhatsApp Chat Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                        SS
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          <span>ShiftForce Restaurant Dispatch</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">WhatsApp Business Verified</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Automated Bot</span>
                  </div>

                  {/* WhatsApp Chat Bubble */}
                  <div className="my-5 space-y-3">
                    <div className="text-center">
                      <span className="bg-[#182229] text-[10px] text-slate-400 px-3 py-1 rounded-lg">
                        Today • Automated Shift Trigger (24 Hours Prior)
                      </span>
                    </div>

                    <div className="bg-[#005c4b] text-slate-100 p-3.5 rounded-2xl rounded-tl-xs shadow-md space-y-2 text-xs leading-relaxed max-w-[90%]">
                      <div className="font-bold text-emerald-200 flex items-center gap-1.5 text-xs pb-1 border-b border-emerald-600/50">
                        <span>🍽️ ShiftForce 24-Hour Shift Reminder</span>
                      </div>
                      <p>
                        Hi <strong>{previewEmp?.name || 'Elena'}</strong>, your next shift as <strong>{selectedPreviewShift?.role || 'Head Server'}</strong> ({selectedPreviewShift?.department || 'Front of House'}) starts tomorrow at <strong>{selectedPreviewShift?.startTime || '16:00'}</strong> on <strong>{selectedPreviewShift?.date || 'Tomorrow'}</strong>.
                      </p>
                      <div className="bg-[#02493c] p-2 rounded-xl text-[11px] space-y-1">
                        <div>📍 <strong>Station:</strong> {selectedPreviewShift?.notes || 'Main Dining Room Table Pacing'}</div>
                        <div>⏱️ <strong>Duration:</strong> {selectedPreviewShift?.startTime || '16:00'} - {selectedPreviewShift?.endTime || '23:30'}</div>
                      </div>
                      <p className="text-[11px] text-slate-200">
                        ⏳ Need a swap or time adjustment? Submit via ShiftForce staff portal at least 12h prior.
                      </p>
                      <div className="text-right text-[10px] text-emerald-200/80 flex items-center justify-end gap-1 pt-1">
                        <span>15:00</span>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-[#182229] p-2.5 rounded-xl text-center">
                  ✅ Fully automated 24-hour pre-shift notification template
                </div>
              </div>

              {/* SMS Text Message Mockup */}
              <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  {/* SMS Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white text-xs">
                        SMS
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-100">+1 (555) 234-8901</div>
                        <div className="text-[10px] text-slate-400">ShiftForce Automated SMS Gateway</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-800">
                      SMS Carrier
                    </span>
                  </div>

                  {/* SMS Message Bubble */}
                  <div className="my-5 space-y-3">
                    <div className="text-center">
                      <span className="bg-slate-800 text-[10px] text-slate-400 px-3 py-1 rounded-lg">
                        Tomorrow at 16:00 (24h Alert)
                      </span>
                    </div>

                    <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tl-xs shadow-md space-y-2 text-xs leading-relaxed max-w-[90%]">
                      <p>{smsMessagePreview}</p>
                      <div className="text-right text-[10px] text-blue-200 pt-1">
                        Delivered
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-800/80 p-2.5 rounded-xl text-center">
                  📱 SMS fallback enables delivery even when staff are offline
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Automated Dispatches Log */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automated Reminder Dispatch History</h4>
                  <p className="text-xs text-slate-500">Live feed of all 24-hour and 1-hour notifications sent to restaurant staff.</p>
                </div>
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl font-semibold">
                  {reminderDispatches.length} Alerts Dispatched
                </span>
              </div>

              {reminderDispatches.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-700">No Reminders Dispatched Yet</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Click "Run 24h &amp; 1h Trigger Check Now" above to trigger automated notifications for all scheduled shifts.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
                  {reminderDispatches.map((dispatch) => (
                    <div key={dispatch.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            dispatch.type === 'shift_24hr_reminder'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {dispatch.type === 'shift_24hr_reminder' ? '24-Hour WhatsApp / SMS' : '1-Hour Countdown'}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">{dispatch.recipientName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">({dispatch.recipientPhone})</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                          {dispatch.message}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span>Sent at: {dispatch.timestamp}</span>
                          {dispatch.metadata?.whatsappMessageSid && (
                            <span className="font-mono text-emerald-600">SID: {dispatch.metadata.whatsappMessageSid}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {dispatch.channels.map((ch) => (
                            <span key={ch} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded uppercase">
                              {ch}
                            </span>
                          ))}
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Delivered
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Automatic Fair Workweek &amp; WhatsApp Business Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
