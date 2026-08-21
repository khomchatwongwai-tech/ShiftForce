import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  X, 
  Zap, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Clock, 
  Smartphone, 
  Award,
  ArrowRight,
  Gift,
  HelpCircle,
  CreditCard,
  Lock
} from 'lucide-react';
import { PRICING_PLANS } from '../data/mockData';
import { SupportedLanguage } from '../types';
import { translations } from '../utils/i18n';

interface PricingTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmployeeCount: number;
  currentLanguage: SupportedLanguage;
  onSelectTier: (tierId: string, billingCycle: 'monthly' | 'annual') => void;
}

export const PricingTiersModal: React.FC<PricingTiersModalProps> = ({
  isOpen,
  onClose,
  currentEmployeeCount,
  currentLanguage,
  onSelectTier,
}) => {
  const t = translations[currentLanguage];
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanSuccess, setSelectedPlanSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate trial expiration date (15 days from now)
  const trialEndDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const formattedTrialEndDate = trialEndDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleChoosePlan = (tierId: string, tierLabel: string, isPaid: boolean) => {
    if (isPaid) {
      setSelectedPlanSuccess(`🎉 15-Day Free Trial activated for ${tierLabel}! You have full access until ${formattedTrialEndDate} before monthly billing starts.`);
      setTimeout(() => {
        onSelectTier(tierId, billingCycle);
        onClose();
      }, 1800);
    } else {
      onSelectTier(tierId, billingCycle);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 px-6 sm:px-8 py-6 text-white text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-white/20">
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>Host &amp; Admin Billing • 100% Free For All Employees</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Transparent, Restaurant-Friendly Pricing
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-2xl mx-auto mt-1">
            <strong>Only Restaurant Hosts &amp; Admins pay</strong> for workspace subscriptions. All employee accounts, mobile schedules, clock-ins, and shift trades are <strong>100% FREE</strong> for your entire staff.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center bg-black/25 backdrop-blur-md p-1 rounded-2xl mt-4 border border-white/20 text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === 'monthly' ? 'bg-white text-sky-900 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <span>{t.monthly} Plan</span>
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide shadow-xs">
                15 DAYS FREE
              </span>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === 'annual' ? 'bg-white text-sky-900 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <span>{t.annually} Plan</span>
              <span className="bg-amber-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide shadow-xs">
                SAVE 25%
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          
          {/* Trial Banner Notification Toast */}
          {selectedPlanSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{selectedPlanSuccess}</span>
            </div>
          ) : null}

          {/* Monthly 15-Day Trial Callout Banner */}
          {billingCycle === 'monthly' ? (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  15d
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span>15-Day Free Trial Active on Monthly Billing</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      No Risk
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Start today with <strong>15 days of unlimited access</strong>. Your first monthly billing will not occur until <strong>{formattedTrialEndDate}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cancel Anytime with 1-Click</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-sky-50 to-blue-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  25%
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <span>Annual Billing Discount + 15-Day Free Trial</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Best Value
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Save 25% on annual billing while still enjoying a <strong>15-day risk-free trial</strong> to test with your entire restaurant staff.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Host & Admin Exclusivity Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Host &amp; Admin Billing Responsibility</span>
                  <span className="bg-indigo-200/80 text-indigo-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Zero Cost for Staff
                  </span>
                </h4>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Subscriptions are billed strictly to <strong>Restaurant Hosts, Franchise Owners &amp; Enterprise Admins</strong>. Hourly staff, servers, line cooks, and bartenders are never asked to pay or enter payment details.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Employees: $0.00 Free</span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRICING_PLANS.map((tier) => {
              const price = billingCycle === 'annual' ? tier.annualMonthlyPrice : tier.monthlyPrice;
              const isCurrentTier = currentEmployeeCount <= tier.maxEmployees;
              const isFree = tier.monthlyPrice === 0;

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                    tier.isPopular 
                      ? 'border-sky-500 bg-sky-50/30 shadow-md ring-2 ring-sky-500/20' 
                      : 'border-slate-200 bg-white hover:border-sky-300'
                  }`}
                >
                  {tier.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-600 to-blue-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-sm tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Most Popular for Restaurants</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base text-slate-900">{tier.label}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        Up to {tier.maxEmployees} Staff
                      </span>
                    </div>

                    {/* Price & Trial Badge */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">/ month</span>
                      </div>
                      
                      {!isFree ? (
                        <div className="mt-1.5 space-y-1">
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>15-Day Free Trial Included</span>
                          </div>
                          {billingCycle === 'monthly' ? (
                            <div className="text-[10px] text-slate-500">
                              First charge on <span className="font-semibold text-slate-700">{formattedTrialEndDate}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 font-medium">
                              Billed annually ($<span className="font-bold">{(price * 12).toFixed(2)}</span>/yr, Save 25%)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-sky-600 font-bold mt-1">
                          Free Forever • No Card Needed
                        </div>
                      )}
                    </div>

                    {/* Features list */}
                    <div className="space-y-2 text-xs text-slate-700 mb-6">
                      {tier.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan CTA Button */}
                  <div>
                    <button
                      onClick={() => handleChoosePlan(tier.id, tier.label, !isFree)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tier.isPopular
                          ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20'
                          : isFree
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <span>
                        {isFree 
                          ? (isCurrentTier ? 'Active Free Tier' : 'Select Free Tier')
                          : `Start 15-Day Free Trial`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="text-[10px] text-slate-400 text-center mt-1.5 flex items-center justify-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>
                        {!isFree ? '15-day free trial • Cancel anytime • Zero risk' : 'Up to 20 staff • No expiration'}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* 15-Day Trial Journey Timeline */}
          <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-md border border-slate-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Gift className="w-4 h-4" />
              <span>How Your 15-Day Free Trial Works</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-black border border-emerald-400/30">1</span>
                  <span>Day 1: Instant Activation</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Immediate access to advanced scheduling, automated SMS shift blasts, and universal POS bridge.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <div className="text-sky-400 font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px] font-black border border-sky-400/30">2</span>
                  <span>Days 1–15: Full Testing</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Onboard your full team, test 24h reminders, and optimize live labor-to-sales ratios with zero charge.
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <div className="text-indigo-300 font-bold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-200 flex items-center justify-center text-[10px] font-black border border-indigo-400/30">3</span>
                  <span>Day 15: Flexible Renewal</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  First monthly payment begins on day 15. Easily switch plans, pause, or cancel anytime with one click.
                </p>
              </div>
            </div>
          </div>

          {/* Guarantee Footer */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Multi-Unit Restaurant Guarantee:</strong> 15-day risk-free trial on all monthly plans. Includes 256-bit SSL encryption, automated SMS notifications, and 24/7 hospitality support.
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 font-bold rounded-xl text-slate-800 shrink-0 cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

