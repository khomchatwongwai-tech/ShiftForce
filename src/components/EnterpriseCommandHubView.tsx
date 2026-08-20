import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState } from 'react';
import {
  Building2,
  Layers,
  Cpu,
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Globe,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Key,
  Search,
  BookOpen,
  Share2,
  Terminal,
  Sliders,
  Users,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Activity,
  Sparkles,
  Camera,
  Server,
  Zap
} from 'lucide-react';
import {
  HierarchyNode,
  ShiftForceIntelligenceOverview,
  EnterpriseModuleTier,
  CorporateTaskChecklist,
  EnterpriseAuditLogEntry,
  ShiftForceAIAgent
} from '../types';
import {
  INITIAL_ENTERPRISE_HIERARCHY,
  INITIAL_ENTERPRISE_INTELLIGENCE,
  INITIAL_ENTERPRISE_MODULES,
  INITIAL_CORPORATE_CHECKLISTS,
  INITIAL_ENTERPRISE_AUDIT_LOGS,
  INITIAL_AI_AGENTS_SWARM
} from '../data/commandCenterData';

export const EnterpriseCommandHubView: React.FC = () => {
  const { currentLanguage, t } = useLanguage();

  // Navigation Tabs
  const [activeEnterpriseTab, setActiveEnterpriseTab] = useState<
    'intelligence' | 'hierarchy' | 'modules' | 'tasks_checklists' | 'policy_handbook' | 'security_audit'
  >('intelligence');

  // Intelligence Telemetry State
  const [intelligence, setIntelligence] = useState<ShiftForceIntelligenceOverview>(INITIAL_ENTERPRISE_INTELLIGENCE);
  const [executedActions, setExecutedActions] = useState<string[]>([]);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  // Hierarchy Tree State
  const [hierarchyNodes] = useState<HierarchyNode[]>(INITIAL_ENTERPRISE_HIERARCHY);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-corp-01');

  // Enterprise Modules
  const [modules, setModules] = useState<EnterpriseModuleTier[]>(INITIAL_ENTERPRISE_MODULES);

  // Checklists with Photo Verification
  const [checklists] = useState<CorporateTaskChecklist[]>(INITIAL_CORPORATE_CHECKLISTS);

  // Audit Logs
  const [auditLogs] = useState<EnterpriseAuditLogEntry[]>(INITIAL_ENTERPRISE_AUDIT_LOGS);

  // Policy AI Assistant
  const [policyQuestion, setPolicyQuestion] = useState('');
  const [policyAnswer, setPolicyAnswer] = useState<{ question: string; answer: string; clauseRef: string } | null>(null);
  const [isSearchingPolicy, setIsSearchingPolicy] = useState(false);

  // AI Swarm State
  const [agentsSwarm] = useState<ShiftForceAIAgent[]>(INITIAL_AI_AGENTS_SWARM);

  // Execute 1-Tap Action Plan from ShiftForce Intelligence
  const handleExecuteActionPlan = (insightId: string, command: string) => {
    setExecutedActions(prev => [...prev, insightId]);
    setActionSuccessNotice(`⚡ Action Plan Executed: "${command}". Directive deployed to regional general managers.`);
    setTimeout(() => setActionSuccessNotice(null), 6000);
  };

  // Run Policy AI Assistant
  const handleAskPolicyAssistant = () => {
    if (!policyQuestion.trim()) return;
    setIsSearchingPolicy(true);
    setPolicyAnswer(null);

    setTimeout(() => {
      setIsSearchingPolicy(false);
      const lower = policyQuestion.toLowerCase();
      if (lower.includes('call-out') || lower.includes('sick') || lower.includes('absence')) {
        setPolicyAnswer({
          question: policyQuestion,
          answer: 'ShiftForce Corporate Policy (§ 4.2 Attendance & Food Safety) mandates that food-handling staff experiencing gastrointestinal or fever symptoms must notify management at least 3 hours prior to shift. ShiftForce AI Shift Rescue is automatically activated upon log-in to find certified replacements with zero disciplinary points accrued.',
          clauseRef: 'ShiftForce Global SOP Manual § 4.2 (Health & Call-Out Protocol)'
        });
      } else if (lower.includes('overtime') || lower.includes('1.5x') || lower.includes('hours')) {
        setPolicyAnswer({
          question: policyQuestion,
          answer: 'All hours exceeding 40.0 hours per workweek are compensated at 1.5x regular pay rate. District Manager approval is required prior to scheduling overtime shifts above 42.0 hours. Minor labor guardrails strictly forbid scheduling consecutive closing and opening shifts (<10 hours rest).',
          clauseRef: 'ShiftForce Compensation & Fair Workweek Policy § 7.1'
        });
      } else {
        setPolicyAnswer({
          question: policyQuestion,
          answer: 'According to ShiftForce General Operating Guidelines, all scheduled shifts and swap requests must be submitted via the ShiftForce Mobile App at least 24 hours in advance. Managers review automated eligibility and fairness checks before confirming.',
          clauseRef: 'ShiftForce General Employee Operating Manual § 2.0'
        });
      }
    }, 400);
  };

  const selectedNode = hierarchyNodes.find(n => n.id === selectedNodeId) || hierarchyNodes[0];

  return (
    <div className="space-y-6 pb-12" id="enterprise-command-hub">
      {/* Enterprise Executive Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>ShiftForce Enterprise Multi-Unit Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Corporate Command & Intelligence Layer
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Centralized visibility, automated policy inheritance, and predictive AI telemetry across 847 locations, 4 regions, and 14,250 active employees.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Locations Analyzed</span>
              <span className="text-xl font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                {intelligence.analyzedLocationsCount} Units
              </span>
            </div>

            <div className="bg-slate-800/90 border border-slate-700/60 rounded-xl px-4 py-2.5">
              <span className="text-xs text-slate-400 block font-medium">Optimization Value</span>
              <span className="text-xl font-bold text-emerald-400">
                +${(intelligence.monthlyOptimizationOpportunityDollars / 1000).toFixed(0)}k/mo
              </span>
            </div>
          </div>
        </div>

        {/* Global Telemetry Strip */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Budget Overages</span>
            <span className="text-base font-bold text-amber-400">{intelligence.projectedBudgetOveragesCount} Stores Flagged</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Staffing Shortages</span>
            <span className="text-base font-bold text-red-400">{intelligence.seriousStaffingShortagesCount} Critical Units</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Approaching Overtime</span>
            <span className="text-base font-bold text-amber-300">{intelligence.employeesApproachingOvertimeCount} Employees</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Expiring Certs (&lt;30d)</span>
            <span className="text-base font-bold text-indigo-300">{intelligence.expiringCertificationsCount} Certifications</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Regional OT Variance</span>
            <span className="text-base font-bold text-orange-400">+{intelligence.regionalOvertimeVariancePct}% ({intelligence.regionalOvertimeVarianceName})</span>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block">Security & RBAC</span>
            <span className="text-base font-bold text-emerald-400">SOC2 Type II Active</span>
          </div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            ✕
          </button>
        </div>
      )}

      {/* Enterprise Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'intelligence', label: 'ShiftForce Intelligence', icon: Sparkles, badge: 'Proactive Telemetry' },
          { id: 'hierarchy', label: '8-Tier Org Hierarchy', icon: Layers, badge: '847 Units' },
          { id: 'modules', label: 'Modular Product Suite', icon: Cpu, badge: '9 Modules' },
          { id: 'tasks_checklists', label: 'Corporate Checklists & Audits', icon: Camera, badge: 'Photo Verification' },
          { id: 'policy_handbook', label: 'Policy AI & Digital Handbook', icon: BookOpen, badge: 'Grounded Assistant' },
          { id: 'security_audit', label: 'Security, SSO & Audit Logs', icon: ShieldCheck, badge: 'Enterprise RBAC' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeEnterpriseTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveEnterpriseTab(tab.id as any)}
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

      {/* ---------------- SUB-TAB 1: SHIFTSKY INTELLIGENCE TELEMETRY ---------------- */}
      {activeEnterpriseTab === 'intelligence' && (
        <div className="space-y-6" id="section-intelligence">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Proactive Intelligence & Autonomous Action Plans
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instead of browsing through hundreds of reports, ShiftForce detects multi-unit variances and provides 1-tap executable solutions.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {intelligence.topInsights.map(insight => {
                const isExecuted = executedActions.includes(insight.id);
                return (
                  <div
                    key={insight.id}
                    className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          insight.impactLevel === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {insight.impactLevel.toUpperCase()} IMPACT
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{insight.title}</h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExecuted ? (
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Action Deployed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleExecuteActionPlan(insight.id, insight.suggestedActionCommand)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{insight.actionLabel}</span>
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

      {/* ---------------- SUB-TAB 2: 8-TIER ORG HIERARCHY ---------------- */}
      {activeEnterpriseTab === 'hierarchy' && (
        <div className="space-y-6" id="section-hierarchy">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Corporate Hierarchy Explorer (Inherited Policies & Rollups)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organization → Brand → Country → Region → District → Location → Department → Team
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hierarchy Tree Navigation */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Multi-Unit Organizational Units:
                </span>
                {hierarchyNodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-center justify-between ${
                      selectedNodeId === node.id
                        ? 'bg-slate-900 text-white font-bold shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="block">{node.name}</span>
                      <span className={`text-[10px] uppercase font-semibold ${selectedNodeId === node.id ? 'text-indigo-300' : 'text-slate-500'}`}>
                        {node.level} • {node.locationsCount} stores
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              {/* Selected Node Details & Budget Rollups */}
              <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">{selectedNode.level}</span>
                    <h3 className="text-lg font-bold text-slate-900">{selectedNode.name}</h3>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-full text-xs border border-emerald-200">
                    Health Score: {selectedNode.healthScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block">Locations Count</span>
                    <span className="text-base font-bold text-slate-900">{selectedNode.locationsCount} Units</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block">Active Headcount</span>
                    <span className="text-base font-bold text-slate-900">{selectedNode.activeHeadcount.toLocaleString()} Employees</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block">Labor Target %</span>
                    <span className="text-base font-bold text-emerald-700">{selectedNode.laborTargetPct}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 block">Weekly Budget</span>
                    <span className="text-base font-bold text-indigo-700">${selectedNode.weeklyBudgetDollars.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">Inherited Corporate Guardrails:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Overtime Ceiling: 40.0 hours max per employee per week (GM Exception required above 40h).</li>
                    <li>Rest Periods: Minimum 10 hours rest required between closing and opening shifts (Zero Clopening Rule).</li>
                    <li>Meal Break Auto-Scheduling: 30-min unpaid meal break automatically queued for shifts &gt; 5.0 hours.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SUB-TAB 3: MODULAR PRODUCT SUITE ---------------- */}
      {activeEnterpriseTab === 'modules' && (
        <div className="space-y-6" id="section-modules">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  ShiftForce Modular Architecture Suite
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modular packaging enables standalone adoption or complete multi-location enterprise workforce management.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map(mod => (
                <div key={mod.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{mod.moduleName}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full uppercase">
                        {mod.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{mod.tagline}</p>

                    <div className="pt-3 border-t border-slate-200 space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Key Capabilities:</span>
                      <ul className="space-y-0.5 text-xs text-slate-600">
                        {mod.featureHighlights.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-xs text-slate-500">
                    <span>Status: <strong className="text-emerald-700">Active</strong></span>
                    <span className="font-semibold text-slate-700">All Tiers</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SUB-TAB 4: CORPORATE TASKS & CHECKLISTS ---------------- */}
      {activeEnterpriseTab === 'tasks_checklists' && (
        <div className="space-y-6" id="section-checklists">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  Corporate Checklists & Photo Verification Audits
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deploy recurring store procedures (opening, closing, sanitation) across 847 locations with mandatory photo timestamping.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {checklists.map(chk => (
                <div key={chk.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{chk.title}</h3>
                      {chk.requiresPhotoVerification && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          Photo Verification Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">Scope: {chk.assignedScope} • {chk.lastUpdated}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-slate-500 block">Completion</span>
                      <span className="font-bold text-emerald-700">{chk.completionRatePct}% ({chk.totalSubmissions} logs)</span>
                    </div>
                    <button className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs">
                      View Photos & Logs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SUB-TAB 5: DIGITAL HANDBOOK & POLICY AI ---------------- */}
      {activeEnterpriseTab === 'policy_handbook' && (
        <div className="space-y-6" id="section-policy-assistant">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Searchable Digital Employee Handbook & Policy AI</h2>
                <p className="text-xs text-slate-500">Ask questions grounded strictly in official company SOPs and HR policies.</p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={policyQuestion}
                onChange={(e) => setPolicyQuestion(e.target.value)}
                placeholder='e.g., "What is our call-out policy?" or "What are the rules on overtime?"'
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskPolicyAssistant();
                }}
              />
              <button
                onClick={handleAskPolicyAssistant}
                disabled={isSearchingPolicy || !policyQuestion.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Policy</span>
              </button>
            </div>

            {policyAnswer && (
              <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-2 animate-fadeIn">
                <span className="text-xs font-bold text-indigo-900 block">{policyAnswer.clauseRef}</span>
                <p className="text-xs text-slate-800 leading-relaxed">{policyAnswer.answer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- SUB-TAB 6: SECURITY, SSO & AUDIT LOGS ---------------- */}
      {activeEnterpriseTab === 'security_audit' && (
        <div className="space-y-6" id="section-security-audit">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Enterprise Security, RBAC & Audit Trail
                </h2>
                <p className="text-xs text-slate-500">Immutable ledger of schedule edits, punch overrides, policy updates, and AI agent actions.</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                SSO / SCIM Connected (Okta, Azure AD)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Scope / Store</th>
                    <th className="py-2.5 px-3">Action Category</th>
                    <th className="py-2.5 px-3">Event Details</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{log.actorName}</td>
                      <td className="py-2 px-3 text-slate-600">{log.scopeLocation}</td>
                      <td className="py-2 px-3 font-semibold text-indigo-700 uppercase text-[10px]">{log.actionCategory}</td>
                      <td className="py-2 px-3 text-slate-700 max-w-xs truncate">{log.details}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.status.toUpperCase()}
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
    </div>
  );
};