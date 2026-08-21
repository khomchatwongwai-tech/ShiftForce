import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Zap, 
  Lock, 
  ShieldCheck, 
  Layers, 
  Search, 
  CreditCard, 
  Sliders, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import { ALL_SYSTEM_PLUGINS } from '../plugins/registry';
import { PluginDefinition, EnterpriseFeatureManagerState, PluginCategory } from '../plugins/types';
import { PaymentPortalItem } from './PaymentPortalModal';

interface EnterpriseFeatureManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureState: EnterpriseFeatureManagerState;
  onUpdateFeatureState: (updated: EnterpriseFeatureManagerState) => void;
  onOpenPaymentPortalForPlugin: (item: PaymentPortalItem) => void;
}

export const EnterpriseFeatureManagerModal: React.FC<EnterpriseFeatureManagerModalProps> = ({
  isOpen,
  onClose,
  featureState,
  onUpdateFeatureState,
  onOpenPaymentPortalForPlugin,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTogglePlugin = (plugin: PluginDefinition) => {
    if (plugin.isCore) {
      showToast(`"${plugin.name}" is a core operational system module and cannot be disabled.`);
      return;
    }

    const isCurrentlyEnabled = featureState.enabledPluginIds.includes(plugin.id);
    const isPurchased = featureState.purchasedPluginIds.includes(plugin.id);

    if (!isPurchased) {
      // Need to purchase first
      onOpenPaymentPortalForPlugin({
        id: `plugin-${plugin.id}`,
        title: `${plugin.name} (Add-on Module)`,
        description: plugin.description,
        priceUSD: plugin.monthlyAddonPrice,
        period: 'monthly',
        type: 'plugin_addon',
        badge: 'Enterprise Add-On'
      });
      return;
    }

    let updatedEnabled: string[];
    if (isCurrentlyEnabled) {
      updatedEnabled = featureState.enabledPluginIds.filter(id => id !== plugin.id);
      showToast(`Disabled "${plugin.name}". Tab removed from active navigation.`);
    } else {
      updatedEnabled = [...featureState.enabledPluginIds, plugin.id];
      showToast(`Enabled "${plugin.name}"! Dynamic tab and workflows are now active.`);
    }

    onUpdateFeatureState({
      ...featureState,
      enabledPluginIds: updatedEnabled,
      lastModifiedTimestamp: new Date().toISOString()
    });
  };

  const handleBuyPlugin = (plugin: PluginDefinition) => {
    onOpenPaymentPortalForPlugin({
      id: `plugin-${plugin.id}`,
      title: `${plugin.name} (Add-on Module)`,
      description: plugin.description,
      priceUSD: plugin.monthlyAddonPrice,
      period: 'monthly',
      type: 'plugin_addon',
      badge: 'Enterprise Add-On'
    });
  };

  const filteredPlugins = ALL_SYSTEM_PLUGINS.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[94vh] flex flex-col">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3 text-indigo-400" />
                Centralized Enterprise Feature Manager
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full">
                Plan Tier: {featureState.activePlanTier.toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Modular Plugins & Add-On Licensing Center
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
              Enable or disable dynamic application modules (ShiftForce Learn, ShiftForce Payroll, POS Bridge, etc.) based on your purchased enterprise licenses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => {
                onOpenPaymentPortalForPlugin({
                  id: 'enterprise-all-access-bundle',
                  title: 'ShiftForce All-Access Enterprise Bundle',
                  description: 'Unlock all 12 modules including Payroll, LMS, AI Copilot & Multi-Unit Hub',
                  priceUSD: 199,
                  period: 'monthly',
                  type: 'enterprise_license',
                  badge: 'Full Suite'
                });
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Universal Payment Portal</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 flex items-center justify-between text-indigo-900 text-xs font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-indigo-500 hover:text-indigo-800 text-[11px]">
              Dismiss
            </button>
          </div>
        )}

        {/* Search and Category Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'payroll_finance', label: 'Payroll & Finance' },
              { id: 'learning_academy', label: 'LMS Academy' },
              { id: 'ai_intelligence', label: 'AI Intelligence' },
              { id: 'integrations', label: 'POS & HCM Hub' },
              { id: 'operations', label: 'Operations' },
              { id: 'performance_hr', label: 'HR & Kudos' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins & modules..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Plugins Grid */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlugins.map(plugin => {
              const isEnabled = featureState.enabledPluginIds.includes(plugin.id);
              const isPurchased = featureState.purchasedPluginIds.includes(plugin.id);
              const Icon = plugin.icon;

              return (
                <div
                  key={plugin.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all bg-white relative ${
                    isEnabled
                      ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-500/10'
                      : 'border-slate-200 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon, Category & Toggle */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 rounded-xl ${isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-slate-900 leading-tight">{plugin.name}</h3>
                            {plugin.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 rounded-sm">
                                {plugin.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">v{plugin.version} • {plugin.shortCode}</span>
                        </div>
                      </div>

                      {/* Enable/Disable Switch */}
                      <button
                        onClick={() => handleTogglePlugin(plugin)}
                        className="cursor-pointer transition-transform active:scale-95 shrink-0"
                        title={plugin.isCore ? 'Core module (Always Enabled)' : (isEnabled ? 'Click to Disable' : 'Click to Enable')}
                      >
                        {plugin.isCore ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">Core</span>
                        ) : isEnabled ? (
                          <div className="w-10 h-6 bg-indigo-600 rounded-full p-0.5 flex items-center justify-end shadow-xs">
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                          </div>
                        ) : (
                          <div className="w-10 h-6 bg-slate-200 rounded-full p-0.5 flex items-center justify-start">
                            <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                          </div>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {plugin.description}
                    </p>

                    {/* Features checklist */}
                    <div className="space-y-1 mb-4 text-[11px] text-slate-500">
                      {plugin.features.slice(0, 2).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Metrics and Status */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    {plugin.metrics ? (
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">{plugin.metrics.label}</div>
                        <div className="font-bold text-slate-800 text-[11px]">{plugin.metrics.value}</div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400">Standard Module</div>
                    )}

                    <div>
                      {plugin.monthlyAddonPrice > 0 && !isPurchased ? (
                        <button
                          onClick={() => handleBuyPlugin(plugin)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>${plugin.monthlyAddonPrice}/mo</span>
                        </button>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isEnabled 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isEnabled ? '● Active in App' : '○ Standby'}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Summary Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              <strong>{featureState.enabledPluginIds.length} of {ALL_SYSTEM_PLUGINS.length}</strong> Modules active in runtime bundle.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Enable all plugins
                onUpdateFeatureState({
                  ...featureState,
                  enabledPluginIds: ALL_SYSTEM_PLUGINS.map(p => p.id),
                  lastModifiedTimestamp: new Date().toISOString()
                });
                showToast('All 13 modular plugins enabled successfully!');
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 font-bold rounded-xl text-slate-700 cursor-pointer"
            >
              Enable All Plugins
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
