import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ChefHat,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';

export const AIInventoryCopilot: React.FC = () => {
  const { aiInsights, isAiLoading, requestAiAssessment, financialIntelligence } = useInventory();
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const quickTriggers = [
    'Analyze Prime Cost leaks & suggest labor/COGS rebalancing',
    'Audit kitchen waste incidents & formulate cook station retraining plan',
    'Optimize par levels for upcoming weekend dinner rush',
    'Identify recipes with high food cost % exceeding benchmark targets',
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    requestAiAssessment(customPrompt);
    setCustomPrompt('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-indigo-800/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">WorkQora AI Cost & Inventory Intelligence Copilot</h2>
                <p className="text-xs text-indigo-200">
                  Deterministic analytics synthesized with server-side AI model reasoning
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => requestAiAssessment()}
            disabled={isAiLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
            {isAiLoading ? 'Synthesizing Live Data...' : 'Run Full AI Diagnostic'}
          </button>
        </div>

        {/* Quick prompt buttons */}
        <div className="mt-4 pt-4 border-t border-indigo-800/40 flex flex-wrap gap-2">
          {quickTriggers.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => requestAiAssessment(prompt)}
              disabled={isAiLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-850 text-indigo-200 border border-indigo-700/50 transition-all text-left"
            >
              ✨ {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main AI Output Display */}
      {aiInsights ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive Briefing</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Grounded in Verified Ledger
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {aiInsights.executiveSummary}
            </p>
          </div>

          {/* Anomaly & Risk Highlights */}
          {aiInsights.anomalyDetections && aiInsights.anomalyDetections.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Detected Operational & Inventory Variances
              </h3>

              <div className="space-y-3">
                {aiInsights.anomalyDetections.map((anomaly, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      anomaly.severity === 'high'
                        ? 'bg-rose-50/70 border-rose-200'
                        : anomaly.severity === 'medium'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              anomaly.severity === 'high'
                                ? 'bg-rose-200 text-rose-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {anomaly.severity} Severity
                          </span>
                          <span className="text-xs font-bold text-slate-900">{anomaly.itemOrMetric}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-medium">{anomaly.detectedIssue}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          <strong className="text-slate-700">Root Cause Hypothesis:</strong> {anomaly.rootCauseHypothesis}
                        </p>
                      </div>

                      {anomaly.dollarImpact && (
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Est. Impact</span>
                          <span className="text-base font-bold text-rose-700">
                            ${anomaly.dollarImpact.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Waste Reduction Strategies */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                Waste Mitigation & Yield Tactics
              </h3>
              <ul className="space-y-2.5">
                {aiInsights.wasteReductionStrategies.map((strat, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{strat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Par Level & Replenishment Optimizations */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Par Level & Purchasing Actions
              </h3>
              <ul className="space-y-2.5">
                {aiInsights.parLevelRecommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Menu Engineering & Prime Cost Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-500" />
                Menu Engineering & Price Elasticity
              </h3>
              <ul className="space-y-2">
                {aiInsights.menuEngineeringSuggestions.map((sugg, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{sugg}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                Prime Cost Target Feasibility
              </h3>
              <ul className="space-y-2">
                {aiInsights.primeCostRoadmap.map((road, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{road}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Run WorkQora AI Diagnostic</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Click above to generate comprehensive executive recommendations combining ending stock counts, waste logs, recipe costs, and labor schedules.
          </p>
          <button
            onClick={() => requestAiAssessment()}
            disabled={isAiLoading}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
          >
            {isAiLoading ? 'Analyzing...' : 'Generate Cost Intelligence Assessment'}
          </button>
        </div>
      )}

      {/* Custom Prompt Inquiry Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ask AI Copilot anything about inventory, menu cost cards, pour cost, or COGS leaks..."
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isAiLoading || !customPrompt.trim()}
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Ask
          </button>
        </form>
      </div>
    </div>
  );
};
