import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Zap,
  Activity,
  Layers,
  Clock,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Calendar,
  Star,
  BarChart3,
  Coffee,
  Building2,
  ChevronRight,
  HelpCircle,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import {
  Employee,
  Shift,
  ProactiveIntelligenceInsight,
  LaborOptimizationStrategy,
  WorkforceCriticalAlertItem,
  ModuleHealthScorecard
} from '../types';
import {
  INITIAL_PROACTIVE_INSIGHTS,
  INITIAL_LABOR_OPTIMIZATION_STRATEGIES,
  INITIAL_CRITICAL_WORKFORCE_ALERTS,
  INITIAL_MODULE_HEALTH_SCORECARDS
} from '../data/commandCenterData';

interface WorkqoraIntelligenceAgentViewProps {
  shifts: Shift[];
  employees: Employee[];
  onNavigateTab?: (tab: any) => void;
}

export const WorkqoraIntelligenceAgentView: React.FC<WorkqoraIntelligenceAgentViewProps> = ({
  shifts,
  employees,
  onNavigateTab
}) => {
  const { currentLanguage, t } = useLanguage();

  // Navigation Section State
  const [activeSection, setActiveSection] = useState<'insights' | 'optimization' | 'alerts' | 'health'>('insights');

  // Category Filter for Insights
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Proactive Insights State
  const [insights, setInsights] = useState<ProactiveIntelligenceInsight[]>(INITIAL_PROACTIVE_INSIGHTS);
  const [executedInsights, setExecutedInsights] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Labor Strategies State
  const [strategies, setStrategies] = useState<LaborOptimizationStrategy[]>(INITIAL_LABOR_OPTIMIZATION_STRATEGIES);
  const [appliedStrategies, setAppliedStrategies] = useState<string[]>(['strat-04']);

  // Critical Alerts State
  const [alerts, setAlerts] = useState<WorkforceCriticalAlertItem[]>(INITIAL_CRITICAL_WORKFORCE_ALERTS);
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);

  // Health Scorecards
  const [scorecards] = useState<ModuleHealthScorecard[]>(INITIAL_MODULE_HEALTH_SCORECARDS);

  // Natural Language Query State
  const [nlpQuery, setNlpQuery] = useState<string>('');
  const [nlpResponse, setNlpResponse] = useState<{ query: string; answer: string; relatedModule: string } | null>(null);
  const [isProcessingNlp, setIsProcessingNlp] = useState<boolean>(false);

  // Computed Metrics from live data
  const totalOptimizedSavings = useMemo(() => {
    const fromInsights = executedInsights.reduce((sum, id) => {
      const ins = insights.find(i => i.id === id);
      return sum + (ins?.estimatedFinancialImpact || 0);
    }, 0);
    const fromStrategies = appliedStrategies.reduce((sum, id) => {
      const strat = strategies.find(s => s.id === id);
      return sum + (strat?.monthlySavings || 0);
    }, 0);
    return 4820 + fromInsights + fromStrategies;
  }, [executedInsights, appliedStrategies, insights, strategies]);

  const activeAlertsCount = useMemo(() => {
    return alerts.filter(a => !resolvedAlerts.includes(a.id)).length;
  }, [alerts, resolvedAlerts]);

  // Execute Insight Action
  const handleDeployInsightAction = (insight: ProactiveIntelligenceInsight) => {
    if (executedInsights.includes(insight.id)) return;
    setExecutedInsights(prev => [...prev, insight.id]);
    setActionNotice(`⚡ AI Directive Executed: ${insight.actionLabel}. Cross-module schedules & staff assignments updated successfully!`);
    setTimeout(() => setActionNotice(null), 6000);
  };

  // Toggle Strategy Application
  const handleToggleStrategy = (stratId: string) => {
    if (appliedStrategies.includes(stratId)) {
      setAppliedStrategies(prev => prev.filter(id => id !== stratId));
      setActionNotice(`Strategy reverted. Standard scheduling baselines restored.`);
    } else {
      setAppliedStrategies(prev => [...prev, stratId]);
      const strat = strategies.find(s => s.id === stratId);
      setActionNotice(`✅ Optimization Applied: "${strat?.strategyName}". Projected savings +$${strat?.monthlySavings.toLocaleString()}/mo.`);
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Resolve Alert Action
  const handleResolveAlert = (alert: WorkforceCriticalAlertItem) => {
    if (resolvedAlerts.includes(alert.id)) return;
    setResolvedAlerts(prev => [...prev, alert.id]);
    setActionNotice(`🛡️ Sentinel Mitigation Deployed: ${alert.actionButtonLabel}. Risk status cleared.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Run Cross-Module NLP Query
  const handleRunNlpQuery = (queryText?: string) => {
    const textToRun = queryText || nlpQuery;
    if (!textToRun.trim()) return;
    setIsProcessingNlp(true);
    setNlpResponse(null);

    setTimeout(() => {
      setIsProcessingNlp(false);
      const lower = textToRun.toLowerCase();
      if (lower.includes('overtime') || lower.includes('cost') || lower.includes('hours')) {
        setNlpResponse({
          query: textToRun,
          answer: 'Cross-module analysis reveals 4 Front of House servers (Elena, Hannah, Carlos, David) projected to exceed 40.0 hours this week due to Friday dinner reservations (+44%). Total overtime risk is $1,420 across 16.5 penalty hours. Recommended fix: Swap Saturday closing shift with Maya Lin.',
          relatedModule: 'Smart Schedule + Labor Watchdog'
        });
      } else if (lower.includes('review') || lower.includes('rating') || lower.includes('sunday') || lower.includes('cocktail')) {
        setNlpResponse({
          query: textToRun,
          answer: 'Correlation between Google/Yelp reviews and POS ticket latency flags Sunday brunch (11:30 AM - 2:30 PM). Cocktail preparation times hit 16.2 mins with 1 scheduled bartender for 130 covers. Recommended fix: Reassign cross-trained barback Chloe to dual bartender role.',
          relatedModule: 'Guest Reviews + POS Sales + Shift Engine'
        });
      } else if (lower.includes('saving') || lower.includes('optimization') || lower.includes('midday')) {
        setNlpResponse({
          query: textToRun,
          answer: 'Workqora identified $6,490 in monthly labor optimization opportunities. Top recommendation: Dynamic midday kitchen staggering on Tue/Wed/Thu saves $2,840/mo by trimming 1.5h per prep cook during low 2:00 PM order volume.',
          relatedModule: 'Labor Optimization Suite'
        });
      } else {
        setNlpResponse({
          query: textToRun,
          answer: `Workqora Intelligence aggregated 12,450 data points across 6 connected modules. Workforce health score is 94/100. All rest periods, POS sales integrations, and geofenced time punches are functioning within target compliance parameters.`,
          relatedModule: 'Workqora Executive Telemetry'
        });
      }
    }, 450);
  };

  // Filtered Insights
  const filteredInsights = useMemo(() => {
    return insights.filter(ins => {
      const matchesCat = selectedCategory === 'all' || ins.category === selectedCategory;
      const matchesSearch = searchQuery === '' ||
        ins.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ins.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [insights, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-12" id="shiftsky-intelligence-agent-view">
      {/* Executive Command & Telemetry Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cross-Module Intelligence & Proactive Agent Layer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Workqora Intelligence Agent
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Continuously synthesizes scheduling velocity, Toast POS sales streams, customer reviews, compliance guardrails, and ADP payroll to surface high-impact workforce optimizations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Monthly Optimization Value</span>
              <span className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                +${totalOptimizedSavings.toLocaleString()}/mo
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Agent Confidence</span>
              <span className="text-xl font-bold text-indigo-400">96.8%</span>
            </div>
          </div>
        </div>

        {/* Global Telemetry Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Data Points Analyzed</span>
            <span className="text-base font-bold text-white">12,450+ Events</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Active Critical Alerts</span>
            <span className={`text-base font-bold ${activeAlertsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {activeAlertsCount} Pending Action
            </span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Overtime Risk Cap</span>
            <span className="text-base font-bold text-indigo-300">38.0h Target</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Rest Period Compliance</span>
            <span className="text-base font-bold text-emerald-400">99.4% Pass</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">POS Sync Latency</span>
            <span className="text-base font-bold text-emerald-400">&lt; 1.2s Real-Time</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">AI Agent Autonomy</span>
            <span className="text-base font-bold text-indigo-400">Continuous 24/7</span>
          </div>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Natural Language Cross-Module Intelligence Query Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Ask Workqora Intelligence (Multi-Module Synthesizer)
          </h2>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={nlpQuery}
              onChange={(e) => setNlpQuery(e.target.value)}
              placeholder='e.g., "What is causing our weekend overtime risk?" or "Why did Sunday brunch ratings drop?"'
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunNlpQuery();
              }}
            />
          </div>
          <button
            onClick={() => handleRunNlpQuery()}
            disabled={isProcessingNlp || !nlpQuery.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synthesize</span>
          </button>
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 pt-1">
          <span className="font-semibold text-slate-600">Quick queries:</span>
          {[
            'Overtime risk analysis',
            'Sunday brunch review correlation',
            'Midday labor savings opportunities',
            'Compliance & cert audit'
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => {
                setNlpQuery(prompt);
                handleRunNlpQuery(prompt);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* NLP Response Card */}
        {nlpResponse && (
          <div className="mt-3 p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                Grounded Analysis • {nlpResponse.relatedModule}
              </span>
              <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">
                Confidence: 98%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
              {nlpResponse.answer}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'insights', label: 'Proactive AI Insights', icon: Sparkles, badge: `${insights.length} Identified` },
          { id: 'optimization', label: 'Labor Optimization Suite', icon: DollarSign, badge: `+$${totalOptimizedSavings.toLocaleString()}/mo` },
          { id: 'alerts', label: 'Workforce Critical Alerts', icon: AlertTriangle, badge: `${activeAlertsCount} Pending` },
          { id: 'health', label: 'Module Sync & Health', icon: ShieldCheck, badge: '6 Connected' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---------------- SECTION 1: PROACTIVE INSIGHTS ---------------- */}
      {activeSection === 'insights' && (
        <div className="space-y-4" id="section-proactive-insights">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Insights' },
                { id: 'labor_cost', label: 'Labor & Overtime' },
                { id: 'guest_experience', label: 'Guest Experience & Reviews' },
                { id: 'compliance_guard', label: 'Compliance & Guardrails' },
                { id: 'wellbeing_retention', label: 'Wellbeing & Burnout' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredInsights.length} cross-module recommendations
            </span>
          </div>

          {/* Insights Cards List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredInsights.map(ins => {
              const isExecuted = executedInsights.includes(ins.id);
              return (
                <div
                  key={ins.id}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    isExecuted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : ins.impactLevel === 'critical'
                        ? 'border-red-200 hover:border-red-300'
                        : 'border-slate-200 hover:border-indigo-300'
                  } shadow-sm`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-3 max-w-3xl">
                      {/* Badge Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ins.impactLevel === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ins.impactLevel} Impact
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          Source: {ins.sourceModule.replace('_', ' ').toUpperCase()}
                        </span>

                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-indigo-500" />
                          Confidence: {ins.confidenceScore}%
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{ins.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          {ins.description}
                        </p>
                      </div>

                      {/* Root Cause & Synthesis */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-800 block">Root Cause Synthesis:</span>
                        <p className="text-slate-600">{ins.rootCauseAnalysis}</p>
                      </div>
                    </div>

                    {/* Financial Metric & Action CTA */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 flex-shrink-0 min-w-[200px] border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <div className="text-left lg:text-right">
                        <span className="text-xs text-slate-500 block">{ins.metricLabel}</span>
                        <span className="text-lg font-bold text-slate-900">{ins.headlineMetric}</span>
                        <span className="text-xs font-semibold text-emerald-700 block">
                          +${ins.estimatedFinancialImpact.toLocaleString()} Value
                        </span>
                      </div>

                      {isExecuted ? (
                        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Action Deployed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeployInsightAction(ins)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 w-full lg:w-auto justify-center"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{ins.actionLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: LABOR OPTIMIZATION SUITE ---------------- */}
      {activeSection === 'optimization' && (
        <div className="space-y-4" id="section-labor-optimization">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Targeted Labor Optimization Strategies
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-configured AI optimization models designed to balance staffing margins with service excellence.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Optimization Potential</span>
                <span className="text-lg font-bold text-emerald-700">
                  +$12,640 / month
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategies.map(strat => {
                const isApplied = appliedStrategies.includes(strat.id);
                return (
                  <div
                    key={strat.id}
                    className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                      isApplied
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{strat.strategyName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isApplied ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isApplied ? 'ACTIVE IN SCHEDULE' : 'RECOMMENDED'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {strat.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>Target: <strong>{strat.targetDepartment}</strong></span>
                        <span>Affected Shifts: <strong>{strat.affectedShiftsCount} shifts/wk</strong></span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 block">Labor % Delta</span>
                        <span className="text-sm font-bold text-emerald-700">
                          {strat.projectedLaborPctImpact > 0 ? `+${strat.projectedLaborPctImpact}%` : `${strat.projectedLaborPctImpact}%`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 mr-2">
                          +${strat.monthlySavings.toLocaleString()}/mo
                        </span>
                        <button
                          onClick={() => handleToggleStrategy(strat.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isApplied
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isApplied ? 'Applied ✓' : 'Apply Strategy'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 3: WORKFORCE CRITICAL ALERTS ---------------- */}
      {activeSection === 'alerts' && (
        <div className="space-y-4" id="section-critical-alerts">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Workforce Sentinel & Compliance Monitor
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated detection of clopening violations, overtime acceleration, and certification expirations.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-full">
                Sentinel: Active 24/7
              </span>
            </div>

            <div className="space-y-3">
              {alerts.map(al => {
                const isResolved = resolvedAlerts.includes(al.id);
                return (
                  <div
                    key={al.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isResolved
                        ? 'border-emerald-200 bg-emerald-50/20 opacity-70'
                        : al.severity === 'critical'
                          ? 'border-red-200 bg-red-50/30'
                          : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          al.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {al.severity}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{al.title}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">• {al.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-700">
                        <strong>Target:</strong> {al.affectedEntity} ({al.department}) — {al.details}
                      </p>

                      <div className="text-xs text-indigo-900 font-medium">
                        💡 <strong>Playbook:</strong> {al.mitigationPlaybook}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isResolved ? (
                        <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mitigated</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResolveAlert(al)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{al.actionButtonLabel}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION 4: MODULE HEALTH SCORECARDS ---------------- */}
      {activeSection === 'health' && (
        <div className="space-y-4" id="section-module-health">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Connected Module Health & Telemetry Scorecards
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time synchronization status across POS, Scheduling, Compliance, Reviews, and Payroll.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scorecards.map(sc => (
                <div key={sc.moduleId} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">{sc.moduleName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sc.healthScore >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sc.healthScore}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {sc.activeMetricsSummary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {sc.syncStatus.replace(/_/g, ' ')}
                    </span>
                    <span>{sc.dataPointsAnalyzedCount} events</span>
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