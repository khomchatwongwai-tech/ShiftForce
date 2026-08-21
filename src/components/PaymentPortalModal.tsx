import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { openStripeBillingPortal } from '../utils/enterpriseService';

export interface PaymentPortalItem {
  id: string;
  title: string;
  description: string;
  priceUSD: number;
  period?: 'monthly' | 'annually' | 'one_time';
  type: 'plan_subscription' | 'plugin_addon' | 'enterprise_license';
  badge?: string;
}

interface PaymentPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToPurchase?: PaymentPortalItem;
  currentLanguage: SupportedLanguage;
  onPaymentSuccess?: (item: PaymentPortalItem, transactionId: string) => void;
}

export const PaymentPortalModal: React.FC<PaymentPortalModalProps> = ({ isOpen, onClose, itemToPurchase }) => {
  const { currentLanguage, t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isOpen) return null;

  const openPortal = async () => {
    setLoading(true); setError(null);
    try { await openStripeBillingPortal(); }
    catch (e:any) { setError(e?.message || 'Billing portal is unavailable.'); setLoading(false); }
  };

  return <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
      <div className="bg-slate-950 text-white p-6 relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
        <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4"/>Secure billing</div>
        <h2 className="text-2xl font-black mt-2">Billing is handled by Stripe</h2>
        <p className="text-slate-300 text-sm mt-2">Workqora does not collect or simulate card numbers, bank credentials, or payment approval in the application.</p>
      </div>
      <div className="p-6 space-y-5">
        {itemToPurchase && <div className="rounded-2xl border border-slate-200 p-4"><div className="font-black text-slate-900">{itemToPurchase.title}</div><div className="text-sm text-slate-600 mt-1">{itemToPurchase.description}</div><div className="text-xs text-amber-700 mt-3">Add-on checkout must be configured as a server-authorized Stripe Price before purchase.</div></div>}
        <div className="flex gap-3 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-950"><CreditCard className="w-5 h-5 shrink-0"/><div>Use the Pricing screen to start a new subscription through Stripe Checkout. Use the Stripe Billing Portal below to manage an existing subscription, payment method, invoices, or cancellation.</div></div>
        {error && <div className="flex gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-xl"><AlertCircle className="w-4 h-4 mt-0.5"/>{error}</div>}
        <button onClick={openPortal} disabled={loading} className="w-full py-3 rounded-xl bg-slate-950 text-white font-black flex items-center justify-center gap-2 disabled:opacity-60">{loading?'Opening Stripe…':'Open Stripe Billing Portal'}<ExternalLink className="w-4 h-4"/></button>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700">Close</button>
      </div>
    </div>
  </div>;
};