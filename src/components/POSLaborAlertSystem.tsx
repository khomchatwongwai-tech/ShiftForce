import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Flame,
  CheckCircle2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Sliders,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Send,
  SlidersHorizontal,
  X,
  Info,
  Layers,
  Activity
} from 'lucide-react';
import {
  Department,
  POSPlatformId,
  POSDepartmentMapping,
  Shift,
  Employee,
  DepartmentBudgetsMap,
  POSLaborAlert
} from '../types';
import { calculateDepartmentLiveEfficiency, INITIAL_POS_DEPARTMENT_MAPPINGS } from '../data/posMappingData';

interface POSLaborAlertSystemProps {
  shifts: Shift[];
  employees: Employee[];
  activePOSId?: POSPlatformId;
  posMappings?: Record<POSPlatformId, POSDepartmentMapping>;
  departmentBudgets?: DepartmentBudgetsMap;
  targetLaborRatio?: number;
  onOpenMappingModal?: () => void;
  onDispatchAlert?: (alert: POSLaborAlert) => void;
}

// Play a subtle modern UI chime via Web Audio API when a new threshold breach is detected
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Smooth dual-tone chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.36);
    osc2.stop(ctx.currentTime + 0.36);
  } catch (e) {
    // AudioContext may be restricted by browser autoplay policy
  }
}

export const POSLaborAlertSystem: React.FC<POSLaborAlertSystemProps> = ({
  shifts,
  employees,
  activePOSId = 'toast',
  posMappings,
  departmentBudgets,
  targetLaborRatio = 30.0,
  onOpenMappingModal,
  onDispatchAlert
}) => {
  // Live POS simulation state (allows managers to test threshold breaches in real time)
  const [salesMultiplier, setSalesMultiplier] = useState<number>(1.0);
  const [laborSurgeDelta, setLaborSurgeDelta] = useState<number>(0); // extra hours / wage surge
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [showAlertHistory, setShowAlertHistory] = useState<boolean>(false);
  const [dispatchedAlertIds, setDispatchedAlertIds] = useState<Record<string, boolean>>({});
  const [dispatchSuccessToast, setDispatchSuccessToast] = useState<string | null>(null);

  // Default POS Mapping
  const safeMappings = posMappings || INITIAL_POS_DEPARTMENT_MAPPINGS;
  const activeMapping = (safeMappings && safeMappings[activePOSId]) || INITIAL_POS_DEPARTMENT_MAPPINGS[activePOSId] || INITIAL_POS_DEPARTMENT_MAPPINGS['toast'];

  // Baseline live POS sales & labor figures
  const baseLiveSales = 8420;
  const baseLiveLaborCost = 1540;

  const currentSales = Math.round(baseLiveSales * salesMultiplier);
  const currentLaborCost = Math.round((baseLiveLaborCost + laborSurgeDelta * 45) * (salesMultiplier > 1 ? 1 + (salesMultiplier - 1) * 0.15 : 1));

  // Compute live department metrics
  const departmentMetrics = useMemo(() => {
    return calculateDepartmentLiveEfficiency(
      activeMapping,
      currentSales,
      currentLaborCost,
      shifts,
      employees
    );
  }, [activeMapping, currentSales, currentLaborCost, shifts, employees]);

  // Generate real-time POS Labor Alerts
  const { activeAlerts, criticalCount, warningCount, totalVarianceDollars, overallLiveLaborPct } = useMemo(() => {
    const alerts: POSLaborAlert[] = [];
    let totalVar = 0;
    const totalSales = departmentMetrics.reduce((sum, d) => sum + d.liveMappedSales, 0);
    const totalLabor = departmentMetrics.reduce((sum, d) => sum + d.liveLaborCost, 0);
    const overallPct = totalSales > 0 ? Number(((totalLabor / totalSales) * 100).toFixed(1)) : 0;

    departmentMetrics.forEach(d => {
      // Check target threshold from mapping or custom budget
      const targetPct = d.targetLaborPct;
      const livePct = d.liveLaborPct;
      const variance = Number((livePct - targetPct).toFixed(1));
      const dollarVar = livePct > targetPct 
        ? Math.round((livePct - targetPct) / 100 * d.liveMappedSales)
        : 0;

      if (variance > 0.1) {
        const isCritical = variance >= 3.0;
        const alertObj: POSLaborAlert = {
          id: `alert-${d.department.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
          department: d.department,
          severity: isCritical ? 'critical' : 'warning',
          liveLaborPct: livePct,
          budgetThresholdPct: targetPct,
          variancePct: variance,
          dollarVariance: dollarVar,
          liveSales: d.liveMappedSales,
          liveLaborCost: d.liveLaborCost,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          posPlatformId: (activePOSId || 'toast') as POSPlatformId,
          message: `${d.department} labor is operating at ${livePct}% (budget threshold: ${targetPct}%). Running +$${dollarVar} over expected live cost.`,
          recommendedAction: isCritical 
            ? `Immediate Action: Early clock-out for 1 ${d.department === 'Front of House' ? 'Server/Runner' : 'Line/Prep Cook'} or reassign to busy station to cut ~$35-$50/hr.`
            : `Monitor: Rebalance prep pacing and pause call-in shifts until live sales velocity catches up.`
        };

        alerts.push(alertObj);
        totalVar += dollarVar;
      }
    });

    const crit = alerts.filter(a => a.severity === 'critical').length;
    const warn = alerts.filter(a => a.severity === 'warning').length;

    return {
      activeAlerts: alerts,
      criticalCount: crit,
      warningCount: warn,
      totalVarianceDollars: totalVar,
      overallLiveLaborPct: overallPct
    };
  }, [departmentMetrics, activePOSId]);

  // Trigger audio chime on new critical breach if sound is enabled
  useEffect(() => {
    if (criticalCount > 0 && soundEnabled) {
      playAlertChime();
    }
  }, [criticalCount, soundEnabled]);

  // Handle acknowledge
  const handleAcknowledge = (dept: Department) => {
    setAcknowledgedAlertIds(prev => ({
      ...prev,
      [dept]: !prev[dept]
    }));
  };

  // Handle Dispatch to Managers
  const handleDispatch = (alert: POSLaborAlert) => {
    setDispatchedAlertIds(prev => ({ ...prev, [alert.department]: true }));
    if (onDispatchAlert) {
      onDispatchAlert(alert);
    }
    setDispatchSuccessToast(`🚨 Alert dispatched to floor managers: "${alert.department} Labor Breach (+${alert.variancePct}%)"`);
    setTimeout(() => {
      setDispatchSuccessToast(null);
    }, 4000);
  };

  const hasBreach = activeAlerts.length > 0;

  return (
    <div id="analytics-pos-realtime-alert-system" className="space-y-3">
      
      {/* Toast Notification */}
      {dispatchSuccessToast && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center justify-between gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{dispatchSuccessToast}</span>
          </div>
          <button
            onClick={() => setDispatchSuccessToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Real-time Alert System Container */}
      <div className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
        criticalCount > 0 
          ? 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-white border-rose-300 ring-2 ring-rose-400/20' 
          : warningCount > 0
          ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border-amber-300 ring-2 ring-amber-400/20'
          : 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border-emerald-200'
      }`}>
        
        {/* Main Alert Bar Header */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left Icon & Heading */}
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
              criticalCount > 0
                ? 'bg-gradient-to-br from-rose-600 to-red-700 shadow-rose-500/20 animate-pulse'
                : warningCount > 0
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20'
            }`}>
              {criticalCount > 0 ? (
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border flex items-center gap-1 ${
                  criticalCount > 0
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : warningCount > 0
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  <Activity className="w-3 h-3 animate-spin" />
                  {criticalCount > 0 ? 'Live POS Budget Alert Triggered' : warningCount > 0 ? 'Elevated Labor Ratio Alert' : 'Live POS Labor Stream Optimal'}
                </span>

                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Streaming from {activeMapping.posPlatformName}
                </span>
              </div>

              <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1 flex items-center gap-2">
                {hasBreach ? (
                  <span>
                    {criticalCount > 0 
                      ? `⚠️ ${criticalCount} Department${criticalCount > 1 ? 's' : ''} Exceeding Defined Labor Budget Threshold` 
                      : `⚡ ${warningCount} Department${warningCount > 1 ? 's' : ''} Approaching Labor Budget Ceiling`}
                  </span>
                ) : (
                  <span>All 5 Restaurant Departments Within Target Labor Cost Thresholds</span>
                )}
              </h3>

              <p className="text-xs text-slate-600 mt-0.5">
                {hasBreach ? (
                  <span>
                    Current live POS labor variance is totaling <strong className="text-rose-700 font-mono">+${totalVarianceDollars}</strong> over target budget pace. Overall labor ratio is running at <strong>{overallLiveLaborPct}%</strong>.
                  </span>
                ) : (
                  <span>
                    Real-time POS revenue centers and timeclock punches are synchronized. Overall labor cost ratio is maintaining a healthy <strong>{overallLiveLaborPct}%</strong> (target: {targetLaborRatio}%).
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Controls: Audio, Simulation Presets, Threshold Settings */}
          <div className="flex items-center gap-2 flex-wrap self-stretch lg:self-center justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200/60">
            
            {/* Audio Ping Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAlertChime();
              }}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-white text-slate-800 border-slate-200 shadow-xs hover:bg-slate-50' 
                  : 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200'
              }`}
              title={soundEnabled ? 'Chime sound enabled on threshold breach' : 'Chime muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[11px] hidden sm:inline">{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            {/* Quick POS Simulation Controls (Allows user to test alert triggers live) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs">
              <span className="text-[10px] text-slate-500 font-bold px-1.5 hidden xl:inline">Simulate Feed:</span>
              <button
                onClick={() => {
                  setSalesMultiplier(0.75); // Slow sales drop -> Labor % spikes
                  setLaborSurgeDelta(2);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  salesMultiplier === 0.75 ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                }`}
                title="Simulate slow shift with sales drop (-25%) causing high labor ratio"
              >
                🔥 Slow Shift Spike
              </button>
              <button
                onClick={() => {
                  setSalesMultiplier(1.0);
                  setLaborSurgeDelta(0);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  salesMultiplier === 1.0 && laborSurgeDelta === 0 ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Normal real-time baseline feed"
              >
                Standard Feed
              </button>
              <button
                onClick={() => {
                  setSalesMultiplier(1.4); // Rush surge -> Labor % drops
                  setLaborSurgeDelta(0);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  salesMultiplier === 1.4 ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
                title="Simulate busy dinner rush (+40% Sales)"
              >
                🚀 Rush Surge
              </button>
            </div>

            {/* Expand / Collapse Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 shadow-xs transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <span>{showDetails ? 'Hide Department Alerts' : `View Alerts (${activeAlerts.length})`}</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

          </div>

        </div>

        {/* Expanded Department Breakdown Alert Cards */}
        {showDetails && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-200/50 space-y-3">
            
            <div className="flex items-center justify-between pt-3 text-xs text-slate-600">
              <span className="font-bold flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                Live POS Department Threshold Monitoring Status:
              </span>
              <span className="text-[11px] text-slate-500">
                5 Departments Audited against POS Job Codes &amp; Revenue Centers
              </span>
            </div>

            {/* 5 Department Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {departmentMetrics.map(dept => {
                const alert = activeAlerts.find(a => a.department === dept.department);
                const isAcknowledged = acknowledgedAlertIds[dept.department];
                const isDispatched = dispatchedAlertIds[dept.department];
                const isCritical = alert?.severity === 'critical';
                const isWarning = alert?.severity === 'warning';

                return (
                  <div
                    key={dept.department}
                    className={`rounded-xl p-3.5 border transition-all space-y-2.5 ${
                      isCritical
                        ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-400/20'
                        : isWarning
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    {/* Card Header: Dept Name & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isCritical ? 'bg-rose-600 animate-ping' :
                          isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-bold text-xs text-slate-900">{dept.department}</span>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md border ${
                        isCritical ? 'bg-rose-600 text-white border-rose-700 shadow-xs' :
                        isWarning ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                      }`}>
                        {isCritical ? '🚨 Over Budget' : isWarning ? '⚠️ High Ratio' : '✓ Optimal'}
                      </span>
                    </div>

                    {/* Metric Key Strip */}
                    <div className="grid grid-cols-3 gap-1.5 p-2 bg-white/90 rounded-lg border border-slate-200/60 text-center font-mono">
                      <div>
                        <div className="text-[9px] font-sans text-slate-500 uppercase font-semibold">Live Labor %</div>
                        <div className={`text-xs font-black ${isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {dept.liveLaborPct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-sans text-slate-500 uppercase font-semibold">Target Limit</div>
                        <div className="text-xs font-bold text-slate-800">
                          {dept.targetLaborPct}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-sans text-slate-500 uppercase font-semibold">Live SPLH</div>
                        <div className="text-xs font-bold text-sky-700">
                          ${dept.liveSplh}/hr
                        </div>
                      </div>
                    </div>

                    {/* Live Financial Metrics */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                      <span>POS Sales: <strong>${dept.liveMappedSales.toLocaleString()}</strong></span>
                      <span>Labor: <strong>${dept.liveLaborCost.toLocaleString()}</strong> ({dept.totalHoursToday}h)</span>
                    </div>

                    {/* Warning Recommendation Box if in breach */}
                    {alert && (
                      <div className={`p-2 rounded-lg text-[11px] space-y-1.5 ${
                        isCritical ? 'bg-rose-100/90 text-rose-950 border border-rose-200' : 'bg-amber-100/90 text-amber-950 border border-amber-200'
                      }`}>
                        <div className="font-semibold flex items-start gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                          <span>{alert.message}</span>
                        </div>
                        <div className="text-[10px] text-slate-700 border-t border-black/10 pt-1">
                          <strong>Action: </strong>{alert.recommendedAction}
                        </div>

                        {/* Interactive Quick Resolution Buttons */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          <button
                            onClick={() => handleAcknowledge(dept.department)}
                            className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                              isAcknowledged 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 shadow-xs'
                            }`}
                          >
                            {isAcknowledged ? '✓ Acknowledged' : 'Acknowledge'}
                          </button>

                          <button
                            onClick={() => handleDispatch(alert)}
                            disabled={isDispatched}
                            className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center gap-1 ${
                              isDispatched
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                            }`}
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>{isDispatched ? 'Dispatched' : 'Alert Floor Manager'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {!alert && (
                      <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[10px] text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Labor ratio is operating efficiently within the {dept.targetLaborPct}% threshold.</span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Bottom Footer Notice & Department Mapping Modal Link */}
            <div className="pt-2 border-t border-slate-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-[11px]">
                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                Budget thresholds can be calibrated dynamically per POS Revenue Center and Job Code in Mapping Settings.
              </span>

              {onOpenMappingModal && (
                <button
                  onClick={onOpenMappingModal}
                  className="text-sky-700 hover:text-sky-900 font-bold text-xs flex items-center gap-1 self-start sm:self-auto cursor-pointer underline"
                >
                  <span>Configure POS Budget Thresholds &amp; Job Codes &rarr;</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
