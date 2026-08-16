import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ShieldAlert,
  Sliders,
  Zap,
  DollarSign,
  MapPin,
  PhoneCall,
  MessageSquare,
  Award,
  Sun,
  FileText,
  Layers,
  RefreshCw,
  Flame,
  ArrowRight,
  ChevronRight,
  Check,
  X,
  UserCheck,
  Bot,
  PlayCircle,
  HelpCircle,
  BarChart2,
  Compass,
  Cpu,
  Share2
} from 'lucide-react';
import {
  Shift,
  Employee,
  Department,
  ShiftRescueEvent,
  NoShowRiskShift,
  ScheduleHealthPillars,
  DemandHourlyForecast,
  WhatIfScenarioConfig,
  ShiftBiddingListing,
  ManagerMorningBriefingData,
  EndOfDayReportData,
  CrossTrainingBottleneck,
  MultiLocationUnitSummary,
  ShiftForceAIAgent
} from '../types';
import {
  INITIAL_SHIFT_RESCUE_EVENTS,
  INITIAL_NO_SHOW_RISK_SHIFTS,
  INITIAL_SCHEDULE_HEALTH_PILLARS,
  INITIAL_DEMAND_HOURLY_FORECAST,
  INITIAL_WHAT_IF_CONFIG,
  INITIAL_SHIFT_BIDDING_LISTINGS,
  INITIAL_MORNING_BRIEFING,
  INITIAL_END_OF_DAY_REPORT,
  INITIAL_CROSS_TRAINING_BOTTLENECK,
  INITIAL_MULTI_LOCATION_SUMMARY,
  INITIAL_AI_AGENTS_SWARM
} from '../data/commandCenterData';

interface AICommandCenterViewProps {
  shifts: Shift[];
  employees: Employee[];
  onOpenAutoFill?: () => void;
  onOpenTemplateModal?: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const AICommandCenterView: React.FC<AICommandCenterViewProps> = ({
  shifts,
  employees,
  onOpenAutoFill,
  onOpenTemplateModal,
  onNavigateTab
}) => {
  // Command Center State
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState('');
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [promptResult, setPromptResult] = useState<{
    query: string;
    actionType: 'schedule_build' | 'call_out_rescue' | 'overtime_audit' | 'what_if' | 'general_answer';
    responseHeadline: string;
    details: string[];
    actionRequired?: {
      label: string;
      onExecute: () => void;
    };
  } | null>(null);

  // Rescue Events State
  const [rescueEvents, setRescueEvents] = useState<ShiftRescueEvent[]>(INITIAL_SHIFT_RESCUE_EVENTS);
  const [activeRescueEventId, setActiveRescueEventId] = useState<string>(rescueEvents[0]?.id || '');
  const [broadcastSuccessNotice, setBroadcastSuccessNotice] = useState<string | null>(null);

  // No-Show Risk Shifts
  const [noShowRisks, setNoShowRisks] = useState<NoShowRiskShift[]>(INITIAL_NO_SHOW_RISK_SHIFTS);
  const [checkInSentId, setCheckInSentId] = useState<string | null>(null);

  // Schedule Health Pillars
  const [healthPillars, setHealthPillars] = useState<ScheduleHealthPillars>(INITIAL_SCHEDULE_HEALTH_PILLARS);
  const [resolvedIssues, setResolvedIssues] = useState<string[]>([]);

  // What-If Simulator
  const [whatIfConfig, setWhatIfConfig] = useState<WhatIfScenarioConfig>(INITIAL_WHAT_IF_CONFIG);
  const [isSimulating, setIsSimulating] = useState(false);

  // Demand Forecast & Live Staffing
  const [demandForecast] = useState<DemandHourlyForecast[]>(INITIAL_DEMAND_HOURLY_FORECAST);

  // Shift Bidding Marketplace
  const [biddingListings, setBiddingListings] = useState<ShiftBiddingListing[]>(INITIAL_SHIFT_BIDDING_LISTINGS);
  const [awardedBids, setAwardedBids] = useState<Record<string, string>>({});

  // Morning Briefing & End of Day Report
  const [morningBriefing, setMorningBriefing] = useState<ManagerMorningBriefingData>(INITIAL_MORNING_BRIEFING);
  const [endOfDayReport] = useState<EndOfDayReportData>(INITIAL_END_OF_DAY_REPORT);
  const [activeBriefingTab, setActiveBriefingTab] = useState<'morning' | 'end_of_day'>('morning');
  const [briefingCopied, setBriefingCopied] = useState(false);

  // Cross-Training Bottlenecks
  const [crossTrainingBottlenecks] = useState<CrossTrainingBottleneck[]>(INITIAL_CROSS_TRAINING_BOTTLENECK);
  const [initiatedTrainingIds, setInitiatedTrainingIds] = useState<string[]>([]);

  // Multi-Location Sharing
  const [multiLocationUnits] = useState<MultiLocationUnitSummary[]>(INITIAL_MULTI_LOCATION_SUMMARY);

  // AI Agent Swarm
  const [agentsSwarm] = useState<ShiftForceAIAgent[]>(INITIAL_AI_AGENTS_SWARM);
  const [selectedAgent, setSelectedAgent] = useState<ShiftForceAIAgent>(INITIAL_AI_AGENTS_SWARM[0]);

  // Active Centerpiece View Tabs
  const [activeSection, setActiveSection] = useState<
    'command_copilot' | 'shift_rescue' | 'schedule_health' | 'what_if_demand' | 'open_bidding' | 'briefings' | 'cross_training'
  >('command_copilot');

  // Handle Natural Language Prompt submission
  const handleExecuteCommand = (overrideText?: string) => {
    const textToRun = overrideText || naturalLanguagePrompt;
    if (!textToRun.trim()) return;

    setIsProcessingPrompt(true);
    setPromptResult(null);

    setTimeout(() => {
      setIsProcessingPrompt(false);
      const lower = textToRun.toLowerCase();

      if (lower.includes('build next week') || lower.includes('keep labor below') || lower.includes('two days off')) {
        setPromptResult({
          query: textToRun,
          actionType: 'schedule_build',
          responseHeadline: 'Next Week Schedule Draft Synthesized • 100% Constraints Satisfied',
          details: [
            'Labor cost constrained to 18.4% ($36,420 total, well below the 19.0% threshold).',
            'Fairness Rule: Every single team member guaranteed minimum 2 consecutive days off.',
            'Overtime Prevention: 0 overtime hours allocated across 24 team members.',
            'Jessica Martinez Tuesday PTO request approved and covered by Elena Rostova.',
            'Dinner Seniority Rule: Every dinner shift has at least 2 Level-3+ certified leads on duty.'
          ],
          actionRequired: {
            label: 'Review & Publish Draft Schedule',
            onExecute: () => {
              if (onOpenAutoFill) onOpenAutoFill();
            }
          }
        });
      } else if (lower.includes('call') || lower.includes('called out') || lower.includes('mike') || lower.includes('mateo')) {
        setPromptResult({
          query: textToRun,
          actionType: 'call_out_rescue',
          responseHeadline: 'Shift Rescue Triggered: Mateo Morales (Line Cook, 16:30 Dinner Rush)',
          details: [
            '3 qualified replacements identified and ranked by proximity, availability, and overtime impact.',
            '#1 Top Match: Kenji Takahashi (Sous Chef) — Available tonight, 0 overtime impact (36h max), lives 2.1 miles away.',
            'Estimated additional labor delta: +$84.50. BOH coverage maintained at 100%.'
          ],
          actionRequired: {
            label: 'Send Instant 1-Tap Shift Offer to Kenji Takahashi',
            onExecute: () => {
              handleSendRescueOffer('rescue-001', 'emp-9', 'Kenji Takahashi');
            }
          }
        });
        setActiveSection('shift_rescue');
      } else if (lower.includes('overtime') || lower.includes('why is overtime high')) {
        setPromptResult({
          query: textToRun,
          actionType: 'overtime_audit',
          responseHeadline: 'AI Overtime Root-Cause Diagnostic',
          details: [
            'Primary Driver: Marcus Vance is scheduled for 39.5 hours due to consecutive Saturday prep shifts.',
            'Secondary Driver: Friday night dish station close ran 45 minutes past estimated finish time last week.',
            'Recommended Adjustment: Trim Marcus Vance Sunday prep by 1.5h to lock weekly hours safely at 38.0h.'
          ],
          actionRequired: {
            label: 'Apply 1.5h Overtime Trim Fix',
            onExecute: () => {
              setHealthPillars(prev => ({
                ...prev,
                overtimeScore: 98,
                overallScore: 97,
                detectedIssues: prev.detectedIssues.filter(i => i.type !== 'overtime')
              }));
              alert('Applied Overtime Trim Fix: Schedule hours re-anchored under 38.0h.');
            }
          }
        });
      } else if (lower.includes('scan') || lower.includes('paper') || lower.includes('picture') || lower.includes('photo') || lower.includes('sheet') || lower.includes('ocr')) {
        setPromptResult({
          query: textToRun,
          actionType: 'schedule_build',
          responseHeadline: 'AI Paper Schedule & Photo Vision OCR Ready',
          details: [
            'Gemini 3.7 Flash Multimodal Vision engine ready to analyze paper sheets, clipboard schedules, or whiteboard rosters.',
            'Direct camera snapshot & file upload supported with automatic employee matching and meal break calculation.',
            'Instant 1-click batch import into the active calendar with real-time labor cost computation.'
          ],
          actionRequired: {
            label: 'Open Schedule & Launch AI Paper Scanner',
            onExecute: () => {
              if (onNavigateTab) onNavigateTab('schedule');
            }
          }
        });
      } else if (lower.includes('sales increase 20%') || lower.includes('what happens if')) {
        setPromptResult({
          query: textToRun,
          actionType: 'what_if',
          responseHeadline: 'What-If Simulation: +20% Saturday Sales Surge ($32,880 Projected)',
          details: [
            'Projected guest covers increase from 420 to 504 covers across lunch and dinner.',
            'Staffing Requirement: +2 Servers, +2 Line Cooks, +1 Bartender, +1 Dishwasher needed.',
            'Labor Efficiency: Projected labor remains at a healthy 18.4% ($1,140 added payroll offset by $5,480 additional sales).'
          ],
          actionRequired: {
            label: 'Open What-If Interactive Simulator',
            onExecute: () => {
              setActiveSection('what_if_demand');
            }
          }
        });
        setActiveSection('what_if_demand');
      } else {
        setPromptResult({
          query: textToRun,
          actionType: 'general_answer',
          responseHeadline: 'ShiftForce Copilot Intelligent Action Plan',
          details: [
            'Analyzed current week roster of 24 active employees and $27,850 projected daily revenue.',
            'Coverage health stands at 93/100 with zero unassigned mandatory shifts.',
            '1 candidate identified for high-priority shift rescue (Mateo Morales Line Cook call-out).'
          ]
        });
      }
    }, 450);
  };

  // 1-Tap Shift Rescue Offer Dispatch
  const handleSendRescueOffer = (rescueId: string, candidateId: string, candidateName: string) => {
    setRescueEvents(prev => prev.map(ev => {
      if (ev.id === rescueId) {
        return {
          ...ev,
          status: 'broadcast_sent',
          selectedCandidateId: candidateId,
          offerBroadcastSentAt: 'Just now',
          offerExpiresInSeconds: 300
        };
      }
      return ev;
    }));

    setBroadcastSuccessNotice(`🚀 1-Tap Shift Offer dispatched to ${candidateName} via SMS, Mobile Push, & WhatsApp! Standby replacement auto-queued.`);
    setTimeout(() => setBroadcastSuccessNotice(null), 6000);
  };

  // Send Pre-Shift Check-In for No-Show Risk Mitigation
  const handleDispatchRiskCheckIn = (shiftId: string, employeeName: string) => {
    setNoShowRisks(prev => prev.map(risk => {
      if (risk.shiftId === shiftId) {
        return { ...risk, dispatchedCheckIn: true };
      }
      return risk;
    }));
    setCheckInSentId(shiftId);
    setTimeout(() => setCheckInSentId(null), 4000);
  };

  // Resolve Health Issue with 1-click
  const handleResolveIssue = (issueTitle: string) => {
    setResolvedIssues(prev => [...prev, issueTitle]);
    setHealthPillars(prev => ({
      ...prev,
      overallScore: Math.min(100, prev.overallScore + 2),
      detectedIssues: prev.detectedIssues.filter(i => i.title !== issueTitle)
    }));
  };

  // Recalculate What-If Simulation
  const handleRecalculateWhatIf = (delta: number, weather: WhatIfScenarioConfig['weatherCondition']) => {
    setIsSimulating(true);
    setTimeout(() => {
      const baseSales = 27400;
      const newSales = baseSales * (1 + delta / 100);
      const extraStaffCost = (delta / 10) * 570;
      const baseLabor = 5150;
      const totalLabor = baseLabor + extraStaffCost;
      const newLaborPct = Number(((totalLabor / newSales) * 100).toFixed(1));

      setWhatIfConfig({
        salesDeltaPercent: delta,
        weatherCondition: weather,
        specialEventMultiplier: 1 + delta / 100,
        targetLaborCostPct: 18.8,
        recalculatedLaborCostPct: newLaborPct,
        recalculatedWeeklyBudget: Math.round(38400 * (1 + delta / 200)),
        additionalStaffNeededByDept: {
          'Front of House': Math.max(0, Math.round(delta / 10)),
          'Back of House': Math.max(0, Math.round(delta / 10)),
          'Bar & Beverage': Math.max(0, Math.round(delta / 20)),
          'Kitchen Prep & Dish': Math.max(0, Math.round(delta / 20)),
          'Management': 0
        },
        simulationNotes: `At ${delta > 0 ? '+' : ''}${delta}% sales ($${newSales.toLocaleString()}), dynamic labor re-indexes to ${newLaborPct}%. Adding recommended staff maintains table turnover times under 40 minutes.`
      });
      setIsSimulating(false);
    }, 300);
  };

  // Award open shift bid
  const handleAwardBid = (listingId: string, employeeId: string, employeeName: string) => {
    setAwardedBids(prev => ({ ...prev, [listingId]: employeeName }));
    setBiddingListings(prev => prev.map(item => {
      if (item.id === listingId) {
        return { ...item, status: 'awarded' };
      }
      return item;
    }));
  };

  // Active rescue event
  const currentRescue = useMemo(() => {
    return rescueEvents.find(e => e.id === activeRescueEventId) || rescueEvents[0];
  }, [rescueEvents, activeRescueEventId]);

  return (
    <div className="space-y-6 pb-12" id="shift-sky-ai-command-center">
      {/* Top Header & Autonomous Swarm Pill */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden" id="command-center-header">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
              <span>ShiftForce Autonomous Operations Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              AI Command Center
              <span className="text-xs bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                8 Swarm Agents Online
              </span>
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Type natural language instructions to build schedules, trigger instant call-out rescues, audit overtime risks, and simulate demand in real time.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Schedule Health</span>
              <span className="text-xl font-bold text-emerald-400 flex items-center gap-1">
                {healthPillars.overallScore}/100
                <span className="text-xs font-normal text-emerald-300">Grade A</span>
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Active Call-Outs</span>
              <span className="text-xl font-bold text-amber-400 flex items-center gap-1">
                {rescueEvents.filter(e => e.status === 'active_rescue').length} Urgent
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Projected Labor</span>
              <span className="text-xl font-bold text-indigo-300 flex items-center gap-1">
                18.7%
                <span className="text-xs font-normal text-slate-400">(Tgt 19.0%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* AI Agents Live Swarm Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Specialized Swarm Agents Active
            </span>
            <span className="text-xs text-indigo-300 hover:text-indigo-200 cursor-pointer font-medium" onClick={() => setActiveSection('command_copilot')}>
              Active Agent: <strong className="text-white">{selectedAgent.name}</strong> ({selectedAgent.title})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {agentsSwarm.map(agent => {
              const isSelected = selectedAgent.id === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-2.5 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold truncate">{agent.name.split('-')[0]}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : agent.status === 'analyzing' ? 'bg-amber-400 animate-pulse' : 'bg-indigo-400'}`} />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{agent.specialization.split('&')[0]}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Broadcast Notification Alert */}
      {broadcastSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{broadcastSuccessNotice}</span>
          </div>
          <button onClick={() => setBroadcastSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs for Command Center Features */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'command_copilot', label: 'AI Manager Copilot', icon: Bot, badge: 'Centerpiece' },
          { id: 'shift_rescue', label: 'AI Shift Rescue', icon: Zap, badge: `${rescueEvents.filter(e => e.status === 'active_rescue').length} Call-Outs` },
          { id: 'schedule_health', label: 'Health Score & Fairness', icon: Award, badge: `${healthPillars.overallScore}%` },
          { id: 'what_if_demand', label: 'What-If & Demand Curve', icon: Sliders, badge: 'Interactive' },
          { id: 'open_bidding', label: 'Shift Bidding Marketplace', icon: Users, badge: `${biddingListings.filter(b => b.status === 'open').length} Open` },
          { id: 'briefings', label: 'Morning & EOD Reports', icon: FileText, badge: 'Daily' },
          { id: 'cross_training', label: 'Cross-Training & Multi-Unit', icon: Share2, badge: '2 Pools' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------- SECTION 1: AI MANAGER COPILOT (CENTERPIECE) ---------------- */}
      {activeSection === 'command_copilot' && (
        <div className="space-y-6" id="section-copilot">
          {/* Main Natural Language Command Console */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Natural Language Operational Prompt</h2>
                <p className="text-xs text-slate-500">Give complex multi-constraint instructions or operational triggers in plain English.</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={naturalLanguagePrompt}
                onChange={(e) => setNaturalLanguagePrompt(e.target.value)}
                rows={3}
                placeholder='e.g., "Build next week&apos;s schedule. Keep labor below 19%, give everyone at least two days off, avoid overtime, approve Jessica&apos;s Tuesday request, and make sure every dinner shift has two experienced employees."'
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleExecuteCommand();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Quick Prompt Shortcuts:</span>
                  <button
                    onClick={() => {
                      const txt = "Build next week's schedule. Keep labor below 19%, give everyone at least two days off, avoid overtime, approve Jessica's Tuesday request, and make sure every dinner shift has two experienced employees.";
                      setNaturalLanguagePrompt(txt);
                      handleExecuteCommand(txt);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                  >
                    ✨ Build Multi-Constraint Schedule
                  </button>
                  <button
                    onClick={() => {
                      const txt = "Mateo Morales called out for dinner shift";
                      setNaturalLanguagePrompt(txt);
                      handleExecuteCommand(txt);
                    }}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs transition-colors border border-amber-200"
                  >
                    🚨 Mateo Called Out
                  </button>
                  <button
                    onClick={() => {
                      const txt = "Why is overtime high this week?";
                      setNaturalLanguagePrompt(txt);
                      handleExecuteCommand(txt);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                  >
                    🔍 Overtime Root-Cause
                  </button>
                  <button
                    onClick={() => {
                      const txt = "What happens if sales increase 20% Saturday?";
                      setNaturalLanguagePrompt(txt);
                      handleExecuteCommand(txt);
                    }}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs transition-colors border border-indigo-100"
                  >
                    📊 What-If +20% Saturday
                  </button>
                </div>

                <button
                  onClick={() => handleExecuteCommand()}
                  disabled={isProcessingPrompt || !naturalLanguagePrompt.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all flex-shrink-0"
                >
                  {isProcessingPrompt ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Run Instruction</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prompt Result Box */}
            {promptResult && (
              <div className="mt-5 p-5 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-xl animate-fadeIn">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Executed via {selectedAgent.name}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{promptResult.responseHeadline}</h3>
                    <ul className="space-y-1.5 text-sm text-slate-700">
                      {promptResult.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {promptResult.actionRequired && (
                    <button
                      onClick={promptResult.actionRequired.onExecute}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <span>{promptResult.actionRequired.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dual Dashboard Highlights: Shift Rescue Quick Launcher & Live Staffing Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Instant Call-Out Rescue Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">AI Shift Rescue: Active Call-Out</h3>
                      <p className="text-xs text-slate-500">Autonomous candidate ranking by availability, skills, & cost</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full animate-pulse">
                    URGENT
                  </span>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4">
                  <div className="flex items-center justify-between text-xs text-amber-900 mb-1 font-semibold">
                    <span>{currentRescue.calledOutEmployeeName} ({currentRescue.calledOutRole})</span>
                    <span>{currentRescue.shiftTime}</span>
                  </div>
                  <p className="text-xs text-amber-800">{currentRescue.reason}</p>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Top Ranked Replacement Candidates:
                  </span>
                  {currentRescue.rankedCandidates.slice(0, 2).map((cand, idx) => (
                    <div key={cand.employeeId} className="p-3 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 rounded-xl transition-all flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{cand.name}</span>
                          <span className="text-xs text-slate-500">({cand.role})</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {cand.matchScore}% Match
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{cand.fitSummary}</p>
                      </div>

                      <button
                        onClick={() => handleSendRescueOffer(currentRescue.id, cand.employeeId, cand.name)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Offer</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">No overtime triggered on recommended candidate.</span>
                <button
                  onClick={() => setActiveSection('shift_rescue')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>View Full Rescue Center</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. No-Show Risk Predictive Warnings */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">No-Show & Call-Out Risk Radar</h3>
                      <p className="text-xs text-slate-500">Early warning system using non-punitive pattern mitigation</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                    2 Shifts Flagged
                  </span>
                </div>

                <div className="space-y-3">
                  {noShowRisks.map(risk => (
                    <div key={risk.shiftId} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{risk.employeeName}</span>
                          <span className="text-xs text-slate-500">• {risk.role}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            risk.riskLevel === 'elevated' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {risk.riskScore}% Risk Probability
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{risk.date} ({risk.startTime})</span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="font-semibold text-slate-700">Root Risk Drivers:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                          {risk.primaryRiskDrivers.map((driver, dIdx) => (
                            <li key={dIdx} className="truncate">{driver}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">Preventative: 12-hour SMS check-in</span>
                        <button
                          onClick={() => handleDispatchRiskCheckIn(risk.shiftId, risk.employeeName)}
                          disabled={risk.dispatchedCheckIn}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            risk.dispatchedCheckIn
                              ? 'bg-emerald-100 text-emerald-800 cursor-default'
                              : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                          }`}
                        >
                          {risk.dispatchedCheckIn ? '✓ Check-In Dispatched' : 'Dispatch 12h Pre-Shift SMS'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Guardrail: ShiftForce never takes automated punitive actions against workers.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: AI SHIFT RESCUE FULL CENTER ---------------- */}
      {activeSection === 'shift_rescue' && (
        <div className="space-y-6" id="section-shift-rescue">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  AI Shift Rescue & Call-Out Recovery
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-factor replacement ranking considering live availability, overtime exposure, skill certifications, distance, and recent hours.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {rescueEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setActiveRescueEventId(event.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeRescueEventId === event.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {event.calledOutEmployeeName} ({event.calledOutRole})
                  </button>
                ))}
              </div>
            </div>

            {/* Current Selected Rescue Event */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                      CALL-OUT LOGGED
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {currentRescue.calledOutEmployeeName} • {currentRescue.calledOutRole} ({currentRescue.calledOutDepartment})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>Shift Window:</strong> {currentRescue.shiftDate} ({currentRescue.shiftTime})
                  </p>
                  <p className="text-xs text-red-700">
                    <strong>Reason:</strong> {currentRescue.reason}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Rescue Status</span>
                    <span className={`text-sm font-bold ${currentRescue.status === 'broadcast_sent' ? 'text-indigo-600' : 'text-amber-600'}`}>
                      {currentRescue.status === 'broadcast_sent' ? 'Broadcast Dispatched 🚀' : 'Candidate Matching Complete'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ranked Candidates Table */}
              <div className="mt-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  AI-Ranked Replacement Candidates (Ordered by Match Algorithm):
                </span>

                <div className="grid grid-cols-1 gap-3">
                  {currentRescue.rankedCandidates.map((cand, idx) => {
                    return (
                      <div
                        key={cand.employeeId}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-base font-bold text-slate-900">{cand.name}</span>
                            <span className="text-xs text-slate-500">({cand.role})</span>
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                              {cand.matchScore}% Match Score
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                              ${cand.hourlyWage.toFixed(2)}/hr
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-medium">{cand.fitSummary}</p>

                          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {cand.distanceMiles} miles away ({cand.estimatedTravelMins} min travel)
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Current: {cand.currentWeeklyHours}h → Proj: {cand.projectedWeeklyHours}h (0 OT)
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                              Cost Delta: +${cand.estimatedCostDelta.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleSendRescueOffer(currentRescue.id, cand.employeeId, cand.name)}
                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>1-Tap Send Offer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 3: AI SCHEDULE HEALTH & FAIRNESS ---------------- */}
      {activeSection === 'schedule_health' && (
        <div className="space-y-6" id="section-schedule-health">
          {/* Health Score Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  AI Schedule Health & Fairness Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-pillar schedule score (0–100) evaluating coverage, overtime risk, shift fairness, employee preferences, and labor targets.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-xs text-emerald-700 block font-medium">Overall Health</span>
                  <span className="text-2xl font-bold text-emerald-800">{healthPillars.overallScore}/100</span>
                </div>
              </div>
            </div>

            {/* 6 Health Pillars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: 'Coverage', score: healthPillars.coverageScore, color: 'emerald' },
                { label: 'Overtime Guard', score: healthPillars.overtimeScore, color: 'indigo' },
                { label: 'Fairness Index', score: healthPillars.fairnessScore, color: 'blue' },
                { label: 'Preferences', score: healthPillars.employeePreferenceScore, color: 'purple' },
                { label: 'Skill Coverage', score: healthPillars.skillCoverageScore, color: 'teal' },
                { label: 'Labor Cost %', score: healthPillars.laborCostScore, color: 'emerald' },
              ].map((pil, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">{pil.label}</span>
                  <span className="text-xl font-bold text-slate-900">{pil.score}%</span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pil.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Fairness Distribution Breakdown */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl mb-6">
              <h3 className="text-sm font-bold text-indigo-950 mb-2">Fairness Engine Distribution Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block">Weekend Shifts:</span>
                  <span className="font-bold text-slate-900">{healthPillars.fairnessDistribution.weekendShiftsVariance}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block">Closing Shifts Parity:</span>
                  <span className="font-bold text-slate-900">{healthPillars.fairnessDistribution.closingShiftsVariance}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block">Holiday Equity:</span>
                  <span className="font-bold text-slate-900">{healthPillars.fairnessDistribution.holidayParityRating}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block">Hours Parity Index:</span>
                  <span className="font-bold text-slate-900">{healthPillars.fairnessDistribution.hoursEquityIndex}</span>
                </div>
              </div>
            </div>

            {/* Detected Issues & 1-Click Fixes */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Detected Optimization Opportunities ({healthPillars.detectedIssues.length})
              </h3>

              {healthPillars.detectedIssues.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center text-sm font-medium border border-emerald-200">
                  ✓ All schedule health issues resolved! Schedule is 100% optimal.
                </div>
              ) : (
                <div className="space-y-3">
                  {healthPillars.detectedIssues.map((issue, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            issue.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {issue.type.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                        </div>
                        <p className="text-xs text-slate-600">{issue.description}</p>
                        {issue.suggestedFix && (
                          <p className="text-xs text-indigo-700 font-medium">
                            💡 <strong>Suggested Fix:</strong> {issue.suggestedFix}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleResolveIssue(issue.title)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap flex-shrink-0"
                      >
                        Apply AI Fix
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 4: WHAT-IF SIMULATOR & DEMAND FORECAST ---------------- */}
      {activeSection === 'what_if_demand' && (
        <div className="space-y-6" id="section-what-if">
          {/* What-If Simulator Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  What-If Workforce Simulator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate revenue swings, weather changes, or stadium events to recalculate required staffing and labor percentages in real time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRecalculateWhatIf(20, 'major_sports_event')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100"
                >
                  +20% Stadium Rush
                </button>
                <button
                  onClick={() => handleRecalculateWhatIf(-15, 'rainy')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  -15% Rainy Slowdown
                </button>
              </div>
            </div>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Projected Revenue Variance ({whatIfConfig.salesDeltaPercent > 0 ? '+' : ''}{whatIfConfig.salesDeltaPercent}%)
                </label>
                <input
                  type="range"
                  min="-30"
                  max="50"
                  step="5"
                  value={whatIfConfig.salesDeltaPercent}
                  onChange={(e) => handleRecalculateWhatIf(Number(e.target.value), whatIfConfig.weatherCondition)}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>-30% Slowdown</span>
                  <span>Baseline (0%)</span>
                  <span>+50% Major Surge</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  External Factor / Weather Condition
                </label>
                <select
                  value={whatIfConfig.weatherCondition}
                  onChange={(e) => handleRecalculateWhatIf(whatIfConfig.salesDeltaPercent, e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="normal">☀️ Normal Weather & Standard Traffic</option>
                  <option value="major_sports_event">🏟️ Major Stadium Event / Playoff Game (+25%)</option>
                  <option value="holiday_rush">🎉 Holiday Weekend Rush (+30%)</option>
                  <option value="extreme_heat">🔥 Extreme Heat (Patio Closed -10%)</option>
                  <option value="rainy">🌧️ Severe Rain & Storm Slowdown (-15%)</option>
                </select>
              </div>
            </div>

            {/* Simulation Results Card */}
            <div className="p-5 bg-indigo-900 text-white rounded-xl shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-indigo-800">
                <div>
                  <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block">Recalculated Labor Efficiency</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-bold text-emerald-400">{whatIfConfig.recalculatedLaborCostPct}%</span>
                    <span className="text-xs text-indigo-200">(Target: {whatIfConfig.targetLaborCostPct}%)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider block">Recalculated Weekly Budget</span>
                  <span className="text-2xl font-bold text-white">${whatIfConfig.recalculatedWeeklyBudget.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                {Object.entries(whatIfConfig.additionalStaffNeededByDept).map(([dept, count]) => {
                  const staffCount = Number(count) || 0;
                  return (
                    <div key={dept} className="bg-indigo-950/60 p-2.5 rounded-lg border border-indigo-700/50">
                      <span className="text-indigo-300 block truncate">{dept}</span>
                      <span className="text-sm font-bold text-white">
                        {staffCount > 0 ? `+${staffCount} Staff Needed` : 'Standard Staffing'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-indigo-200 leading-relaxed font-sans">{whatIfConfig.simulationNotes}</p>
            </div>
          </div>

          {/* Hourly Demand Curve & Live Staffing Heatmap */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hourly Demand Forecast & Live Staffing Heatmap</h3>
                <p className="text-xs text-slate-500">Hourly sales, reservations covers, and recommended vs clocked-in staff</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Optimal
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Understaffed
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Overstaffed
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">Hour Window</th>
                    <th className="py-2.5 px-3">Projected Sales</th>
                    <th className="py-2.5 px-3">Reservation Covers</th>
                    <th className="py-2.5 px-3">Weather Impact</th>
                    <th className="py-2.5 px-3">Rec. Staff</th>
                    <th className="py-2.5 px-3">Scheduled</th>
                    <th className="py-2.5 px-3">Clocked-In</th>
                    <th className="py-2.5 px-3">Variance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demandForecast.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900">{row.hour}</td>
                      <td className="py-2 px-3 text-slate-700 font-semibold">${row.projectedSales.toLocaleString()}</td>
                      <td className="py-2 px-3 text-slate-600">{row.reservationsCovers} guests</td>
                      <td className="py-2 px-3 text-slate-500">{row.weatherImpact}</td>
                      <td className="py-2 px-3 font-bold text-indigo-700">{row.recommendedStaffCount}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{row.scheduledStaffCount}</td>
                      <td className="py-2 px-3 font-medium text-slate-800">{row.clockedInStaffCount || '—'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.varianceStatus === 'optimal'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.varianceStatus === 'understaffed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.varianceStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 5: SHIFT BIDDING MARKETPLACE ---------------- */}
      {activeSection === 'open_bidding' && (
        <div className="space-y-6" id="section-bidding">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Smart Open-Shift & Shift Bidding Marketplace
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Managers post open shifts with optional rush incentives; eligible staff volunteer while ShiftForce auto-validates qualifications & overtime.
                </p>
              </div>

              <span className="text-xs px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-bold">
                {biddingListings.filter(b => b.status === 'open').length} Shifts Available for Bidding
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {biddingListings.map(listing => {
                const awardedTo = awardedBids[listing.id];
                return (
                  <div key={listing.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{listing.role}</span>
                          <span className="text-xs text-slate-500">({listing.department})</span>
                        </div>
                        {listing.incentiveBonus && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                            +${listing.incentiveBonus} Rush Bonus
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between text-slate-700 font-semibold">
                          <span>Date: {listing.date}</span>
                          <span>Time: {listing.startTime} - {listing.endTime}</span>
                        </div>
                        <p className="text-slate-500">{listing.stationNotes}</p>
                      </div>

                      {/* Active Bids */}
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-2">
                          Volunteered Staff ({listing.bids.length}):
                        </span>

                        {listing.bids.map(bid => (
                          <div key={bid.employeeId} className="p-2.5 bg-white border border-slate-200 rounded-lg mb-2 flex items-center justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{bid.employeeName}</span>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                                  Seniority Rank #{bid.seniorityRank}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                {bid.causesOvertime ? '⚠️ Overtime Warning' : '✓ 0 Overtime Impact'}
                              </span>
                            </div>

                            {awardedTo === bid.employeeName ? (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                                ✓ Shift Awarded
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAwardBid(listing.id, bid.employeeId, bid.employeeName)}
                                disabled={listing.status === 'awarded'}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs shadow-sm"
                              >
                                Award Shift
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                      <span>Posted by {listing.postedBy}</span>
                      <span className="font-semibold text-indigo-600">${listing.hourlyRate.toFixed(2)}/hr base</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 6: MORNING & EOD BRIEFINGS ---------------- */}
      {activeSection === 'briefings' && (
        <div className="space-y-6" id="section-briefings">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Manager Morning Briefing & End-of-Day Report
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI-synthesized operational handoffs between opening, mid, and closing managers with 1-click text and speech export.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBriefingTab('morning')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeBriefingTab === 'morning' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  ☀️ Manager Morning Briefing
                </button>
                <button
                  onClick={() => setActiveBriefingTab('end_of_day')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeBriefingTab === 'end_of_day' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  🌙 End-of-Day AI Report
                </button>
              </div>
            </div>

            {activeBriefingTab === 'morning' ? (
              <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">{morningBriefing.date}</span>
                  <span className="text-xs text-amber-700 font-medium">Supervisor on Duty: {morningBriefing.supervisorOnDuty}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block">Scheduled Staff</span>
                    <span className="text-lg font-bold text-slate-900">{morningBriefing.totalScheduledEmployees} employees</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block">Late/No-Show Risks</span>
                    <span className="text-lg font-bold text-amber-700">{morningBriefing.lateRiskCount} flagged</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block">Projected Sales</span>
                    <span className="text-lg font-bold text-slate-900">${morningBriefing.projectedSales.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block">Projected Labor %</span>
                    <span className="text-lg font-bold text-emerald-700">{morningBriefing.projectedLaborCostPct}%</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-amber-200 rounded-lg text-xs space-y-2">
                  <span className="font-bold text-amber-900 uppercase tracking-wider block">Today's Priority Action Items:</span>
                  <ul className="space-y-1.5 text-slate-700">
                    {morningBriefing.urgentActionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-indigo-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">{endOfDayReport.date}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {endOfDayReport.attendanceRatePct}% Attendance Rate
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 block">Actual Sales</span>
                    <span className="text-lg font-bold text-slate-900">${endOfDayReport.totalActualSales.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 block">Actual Labor Cost</span>
                    <span className="text-lg font-bold text-slate-900">${endOfDayReport.totalActualLaborCost.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 block">Labor Efficiency</span>
                    <span className="text-lg font-bold text-emerald-700">{endOfDayReport.laborEfficiencyPct}%</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <span className="text-slate-500 block">Overtime Logged</span>
                    <span className="text-lg font-bold text-slate-900">{endOfDayReport.overtimeHoursLogged}h</span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-indigo-100 rounded-lg text-xs space-y-2">
                  <span className="font-bold text-indigo-900 uppercase tracking-wider block">Manager Shift Handoff Notes:</span>
                  <p className="text-slate-700 leading-relaxed">{endOfDayReport.managerHandoffSummary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 7: CROSS-TRAINING & MULTI-LOCATION SHARING ---------------- */}
      {activeSection === 'cross_training' && (
        <div className="space-y-6" id="section-cross-training">
          {/* 1. Cross-Training Bottlenecks */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Skill Bottleneck & Cross-Training Recommendations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI identifies positions where lack of certified backup staff creates scheduling vulnerabilities.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {crossTrainingBottlenecks.map((bot, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{bot.criticalSkill}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                      {bot.currentCertifiedCount}/{bot.requiredMinimum} Certified
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Recommended Candidates to Cross-Train:</span>
                    {bot.recommendedCandidatesToCrossTrain.map(cand => (
                      <div key={cand.employeeId} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{cand.name}</span>
                          <span className="text-slate-500 block">Current: {cand.currentRole} • {cand.estimatedTrainingHours}h module</span>
                        </div>
                        <button
                          onClick={() => {
                            setInitiatedTrainingIds(prev => [...prev, cand.employeeId]);
                            alert(`Cross-training module assigned to ${cand.name}! LMS curriculum auto-dispatched.`);
                          }}
                          disabled={initiatedTrainingIds.includes(cand.employeeId)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-100 disabled:text-emerald-800 text-white font-bold rounded-lg text-xs"
                        >
                          {initiatedTrainingIds.includes(cand.employeeId) ? '✓ Module Assigned' : 'Assign LMS'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Multi-Location Employee Sharing Pool */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Multi-Location Employee Sharing Pool</h3>
                <p className="text-xs text-slate-500">Cross-store coverage across company branches in the regional district</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {multiLocationUnits.map(unit => (
                <div key={unit.locationId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                  <span className="text-xs font-bold text-indigo-700 block truncate">{unit.name}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{unit.address}</span>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-xs">
                    <span className="text-slate-600">Health: <strong>{unit.healthScore}%</strong></span>
                    <span className="text-emerald-700 font-bold">{unit.sharedEmployeesAvailable} Shared Staff Available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
