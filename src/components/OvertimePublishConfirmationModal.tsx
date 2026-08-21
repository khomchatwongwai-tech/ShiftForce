import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  CheckCircle2, 
  X, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { Shift, Employee, SupportedLanguage } from '../types';

export interface OvertimeItemSummary {
  shift?: Shift;
  id?: string;
  employeeName: string;
  department: string;
  role: string;
  date: string;
  timeRange?: string;
  shiftTime?: string;
  hours?: number;
  shiftHours?: number;
  isDailyOver8h?: boolean;
  dailyExcessHours?: number;
  isWeeklyOver40h?: boolean;
  weeklyTotalHours?: number;
  weeklyExcessHours?: number;
  type?: 'daily_exceeded_8h' | 'weekly_exceeded_40h';
  excessHours?: number;
  wage?: number;
}

interface OvertimePublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  overtimeItems: OvertimeItemSummary[];
  onConfirm?: (justificationNote: string) => void;
  onConfirmPublishWithJustification?: (justificationNote: string) => void;
  currentLanguage?: SupportedLanguage;
  managerName?: string;
}

const COMMON_JUSTIFICATION_TEMPLATES = [
  'Holiday banquet & private event surge coverage',
  'Emergency staff illness coverage & unexpected call-out replacement',
  'High-volume weekend rush & extended operating dinner turnover',
  'New station cross-training under senior staff supervision',
  'Unplanned delivery shipment intake & large kitchen prep requirement',
];

export const OvertimePublishConfirmationModal: React.FC<OvertimePublishConfirmationModalProps> = ({
  isOpen,
  onClose,
  overtimeItems,
  onConfirm,
  onConfirmPublishWithJustification,
  currentLanguage = 'en',
  managerName = 'General Manager',
}) => {
  const [justificationNote, setJustificationNote] = useState('');
  const [managerSignature, setManagerSignature] = useState(managerName);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalShiftsTriggering = overtimeItems.length;
  const uniqueEmployees = Array.from(new Set(overtimeItems.map(item => item.employeeName)));
  const totalOvertimeHoursProjected = overtimeItems.reduce((sum, item) => {
    const excess = item.excessHours || (item.isDailyOver8h ? (item.dailyExcessHours || 0) : (item.weeklyExcessHours || 0));
    return sum + excess;
  }, 0);

  const handleSelectTemplate = (template: string, idx: number) => {
    setSelectedTemplateIndex(idx);
    setJustificationNote(template);
    setErrorMsg('');
  };

  const handleConfirm = () => {
    const trimmed = justificationNote.trim();
    if (!trimmed) {
      setErrorMsg('A manager justification note is required before publishing a schedule with overtime triggers.');
      return;
    }
    if (trimmed.length < 5) {
      setErrorMsg('Please provide a detailed justification note (at least 5 characters).');
      return;
    }

    const fullNote = `${trimmed} [Approved by ${managerSignature} on ${new Date().toLocaleDateString()}]`;
    if (onConfirm) {
      onConfirm(fullNote);
    } else if (onConfirmPublishWithJustification) {
      onConfirmPublishWithJustification(fullNote);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-amber-400 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Overtime Approval &amp; Justification Required</h3>
                <span className="px-2 py-0.5 bg-amber-950/40 text-amber-200 border border-amber-300/40 rounded-full text-[10px] font-mono font-black uppercase">
                  Labor Compliance Gate
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                This schedule contains shifts that trigger daily (&gt;8h) or weekly (&gt;40h) overtime thresholds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Overtime Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Affected Shifts</div>
              <div className="text-xl font-black text-amber-950 mt-0.5">{totalShiftsTriggering} Shifts</div>
              <div className="text-[10px] text-amber-700 font-medium">Require Compliance Justification</div>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Affected Staff</div>
              <div className="text-xl font-black text-rose-950 mt-0.5">{uniqueEmployees.length} Staff</div>
              <div className="text-[10px] text-rose-700 font-medium">{uniqueEmployees.join(', ')}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Projected OT Hours</div>
              <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">+{totalOvertimeHoursProjected.toFixed(1)} hrs</div>
              <div className="text-[10px] text-slate-500">Premium 1.5x Rate Tier</div>
            </div>
          </div>

          {/* Triggering Shifts Breakdown List */}
          <div className="border border-amber-200 rounded-xl bg-amber-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Overtime Shift Details to be Logged:</span>
              </span>
              <span className="text-[11px] text-amber-800 font-mono font-semibold">
                {overtimeItems.length} Record{overtimeItems.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {overtimeItems.map((item, idx) => {
                const isDaily = item.type === 'daily_exceeded_8h' || item.isDailyOver8h;
                const isWeekly = item.type === 'weekly_exceeded_40h' || item.isWeeklyOver40h;
                const timeLabel = item.timeRange || item.shiftTime || '';
                const hrsVal = item.hours || item.shiftHours || 0;
                const excessVal = item.excessHours || (isDaily ? item.dailyExcessHours : item.weeklyExcessHours) || 0;

                return (
                  <div 
                    key={item.id || (item.shift ? `${item.shift.id}-${idx}` : `ot-${idx}`)}
                    className="bg-white p-2.5 rounded-lg border border-amber-200/90 shadow-2xs flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.employeeName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {item.department} • {item.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.date} {timeLabel ? `(${timeLabel})` : ''} — {hrsVal.toFixed(1)} net hrs
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      {isDaily && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 rounded font-mono font-bold text-[10px]">
                          &gt;8h Shift (+{excessVal.toFixed(1)}h OT)
                        </span>
                      )}
                      {isWeekly && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-950 border border-rose-300 rounded font-mono font-bold text-[10px]">
                          &gt;40h Wk ({hrsVal.toFixed(1)}h | +{excessVal.toFixed(1)}h OT)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Justification Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="overtime-justification-input" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>Manager Overtime Justification Note <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] text-slate-500 italic">Saved permanently with shift record</span>
            </div>

            {/* Quick Template Chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Reason Templates:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_JUSTIFICATION_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl, idx)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all text-left cursor-pointer ${
                      selectedTemplateIndex === idx
                        ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Input */}
            <div className="relative">
              <textarea
                id="overtime-justification-input"
                rows={3}
                value={justificationNote}
                onChange={(e) => {
                  setJustificationNote(e.target.value);
                  setSelectedTemplateIndex(null);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Describe business reason for scheduling overtime (e.g. unexpected staff illness, holiday private event rush, kitchen volume spike)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-400 focus:outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Approver Signature / Authority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Authorizing Manager Name / Title:
                </label>
                <input
                  type="text"
                  value={managerSignature}
                  onChange={(e) => setManagerSignature(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden bg-white"
                  placeholder="e.g. General Manager, Shift Lead"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-sky-950 text-[11px]">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  This justification will be stamped into every overtime shift record and audit log.
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Cancel &amp; Review Shifts
          </button>

          <button
            type="button"
            id="confirm-overtime-publish-btn"
            onClick={handleConfirm}
            className="bg-gradient-to-r from-amber-600 via-amber-700 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Overtime &amp; Proceed to Broadcast</span>
          </button>
        </div>

      </div>
    </div>
  );
};
