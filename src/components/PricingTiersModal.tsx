import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useMemo, useState } from 'react';
import { Check, X, Building2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { ENTERPRISE_PRICING_PLANS, formatPlanPrice, getPlanForLocationCount, isPlanEligible } from '../data/enterprisePricing';

interface PricingTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmployeeCount: number;
  currentLocationCount: number;
  currentLanguage: SupportedLanguage;
  onSelectTier: (tierId: string, billingCycle: 'monthly' | 'annual') => void | Promise<void>;
}

export const PricingTiersModal: React.FC<PricingTiersModalProps> = ({
  isOpen, onClose, currentEmployeeCount, currentLocationCount, onSelectTier,
}) => {
  const { currentLanguage, t } = useLanguage();

  const [billingCycle, setBillingCycle] = useState<'monthly'|'annual'>('monthly');
  const [processingTierId, setProcessingTierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recommended = useMemo(() => getPlanForLocationCount(currentLocationCount), [currentLocationCount]);
  if (!isOpen) return null;

  return <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
      <div className="bg-slate-950 text-white px-6 py-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-widest"><Building2 className="w-4 h-4"/>Workqora Enterprise Pricing</div>
        <h2 className="text-3xl font-black mt-2">Pay by active locations, not by team size.</h2>
        <p className="text-slate-300 text-sm mt-2 max-w-3xl">One company account can manage every authorized store from one sign-in. Paid plans include unlimited employees. Company data remains isolated from every other Workqora customer.</p>
        <div className="mt-4 inline-flex bg-white/10 p-1 rounded-xl">
          <button onClick={()=>setBillingCycle('monthly')} className={`px-4 py-2 rounded-lg text-sm font-bold ${billingCycle==='monthly'?'bg-white text-slate-950':'text-white'}`}>Monthly</button>
          <button onClick={()=>setBillingCycle('annual')} className={`px-4 py-2 rounded-lg text-sm font-bold ${billingCycle==='annual'?'bg-white text-slate-950':'text-white'}`}>Annual · ~2 months free</button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        <div className="grid md:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200"><Building2 className="w-5 h-5 text-sky-600"/><div className="font-black mt-2">{currentLocationCount} active location{currentLocationCount===1?'':'s'}</div><div className="text-xs text-slate-600">Billing meter</div></div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"><Users className="w-5 h-5 text-emerald-600"/><div className="font-black mt-2">{currentEmployeeCount} employees</div><div className="text-xs text-slate-600">Unlimited on paid plans</div></div>
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200"><Sparkles className="w-5 h-5 text-indigo-600"/><div className="font-black mt-2">Recommended: {recommended.label}</div><div className="text-xs text-slate-600">Based on active stores</div></div>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm font-semibold text-red-700">{error}</div>}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ENTERPRISE_PRICING_PLANS.map(plan => {
            const eligible = isPlanEligible(plan, currentLocationCount, currentEmployeeCount);
            const recommendedPlan = plan.id === recommended.id;
            const locationLabel = plan.maxLocations == null ? `${plan.minLocations?.toLocaleString()}+ locations` : plan.minLocations === plan.maxLocations ? `${plan.maxLocations} location` : `${plan.minLocations?.toLocaleString()}–${plan.maxLocations.toLocaleString()} locations`;
            return <div key={plan.id} className={`rounded-2xl border p-5 flex flex-col ${recommendedPlan?'border-indigo-500 ring-2 ring-indigo-100':'border-slate-200'}`}>
              {recommendedPlan && <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700 mb-2">Recommended for your company</div>}
              <h3 className="font-black text-lg text-slate-950">{plan.label}</h3>
              <div className="text-sm font-semibold text-slate-500 mt-1">{locationLabel}</div>
              <div className="text-3xl font-black mt-4">{formatPlanPrice(plan,billingCycle)}</div>
              {billingCycle==='annual' && plan.monthlyPrice>0 && <div className="text-xs text-emerald-700 font-semibold mt-1">≈ ${plan.annualMonthlyPrice.toFixed(2)}/month effective</div>}
              <div className="space-y-2 mt-5 flex-1">{plan.features.map(f=><div key={f} className="flex gap-2 text-sm text-slate-700"><Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"/>{f}</div>)}</div>
              <button disabled={processingTierId!==null || (!eligible && plan.id!=='enterprise-custom')} onClick={async()=>{
                setError(null); setProcessingTierId(plan.id);
                try { await onSelectTier(plan.id,billingCycle); }
                catch (e:any) { setError(e?.message || 'Unable to start billing.'); setProcessingTierId(null); }
              }} className={`mt-5 py-2.5 rounded-xl font-bold text-sm ${eligible||plan.id==='enterprise-custom'?'bg-slate-950 text-white hover:bg-slate-800':'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>{processingTierId===plan.id?'Opening secure checkout…':plan.id==='enterprise-custom'?'Contact Enterprise':'Choose plan'}</button>
            </div>
          })}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3 text-sm text-slate-700"><ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0"/><div><strong>Access model:</strong> Corporate owners can see all authorized stores; regional managers see assigned regions; store managers see assigned locations; employees see only permitted employee workflows. Company A cannot access Company B.</div></div>
      </div>
    </div>
  </div>;
};