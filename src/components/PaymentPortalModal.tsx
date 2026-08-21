import React, { useState, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  QrCode, 
  Building2, 
  Download, 
  Printer, 
  Check, 
  AlertCircle, 
  Tag, 
  ChevronRight, 
  RefreshCw, 
  Globe, 
  FileText, 
  Zap,
  DollarSign
} from 'lucide-react';
import { SupportedLanguage } from '../types';

export type PaymentMethodType = 
  | 'card' 
  | 'apple_pay' 
  | 'google_pay' 
  | 'alipay' 
  | 'wechat_pay' 
  | 'paypal' 
  | 'ach_bank' 
  | 'promptpay'
  | 'corporate_invoice';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'unionpay' | 'generic';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // relative to USD
}

const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.79 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exchangeRate: 154.5 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', exchangeRate: 7.24 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', exchangeRate: 36.5 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', exchangeRate: 1.36 },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', exchangeRate: 1.52 },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', exchangeRate: 1.35 },
];

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

export const PaymentPortalModal: React.FC<PaymentPortalModalProps> = ({
  isOpen,
  onClose,
  itemToPurchase,
  currentLanguage,
  onPaymentSuccess,
}) => {
  // Default item if none provided
  const item: PaymentPortalItem = itemToPurchase || {
    id: 'plan-enterprise-monthly',
    title: 'ShiftForce Enterprise Plan + All Core Modules',
    description: 'Unlimited staff, Multi-Unit Franchise Hub, AI Intelligence Copilot & POS Integration Bridge',
    priceUSD: 199.00,
    period: 'monthly',
    type: 'plan_subscription',
    badge: 'Enterprise Tier'
  };

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo>(SUPPORTED_CURRENCIES[0]);
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState<string>('Alex Morgan');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCVC, setCardCVC] = useState<string>('888');
  const [billingZip, setBillingZip] = useState<string>('94103');
  const [saveCardForFuture, setSaveCardForFuture] = useState<boolean>(true);

  // Bank ACH inputs
  const [bankRouting, setBankRouting] = useState<string>('121000358');
  const [bankAccount, setBankAccount] = useState<string>('9876543210');
  const [companyTaxId, setCompanyTaxId] = useState<string>('US-EIN-94-3829102');

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentOff: number } | null>({
    code: 'WELCOME20',
    percentOff: 20
  });
  const [promoError, setPromoError] = useState<string | null>(null);

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentCompletedReceipt, setPaymentCompletedReceipt] = useState<{
    transactionId: string;
    paidAmount: number;
    currencySymbol: string;
    currencyCode: string;
    paymentMethodLabel: string;
    timestamp: string;
    invoiceNumber: string;
  } | null>(null);

  // Detect card brand automatically from number
  const detectedCardBrand: CardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^6(?:011|5)/.test(clean)) return 'discover';
    if (/^35(?:2[89]|[3-8][0-9])/.test(clean)) return 'jcb';
    if (/^62/.test(clean)) return 'unionpay';
    return 'generic';
  }, [cardNumber]);

  // Calculations
  const basePriceInCurrency = item.priceUSD * selectedCurrency.exchangeRate;
  const discountAmount = appliedDiscount ? (basePriceInCurrency * (appliedDiscount.percentOff / 100)) : 0;
  const subtotal = basePriceInCurrency - discountAmount;
  const estimatedTax = subtotal * 0.0825; // 8.25% state/local tax
  const finalTotal = subtotal + estimatedTax;

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'SHIFTSKY50' || code === 'VIP50') {
      setAppliedDiscount({ code, percentOff: 50 });
      setPromoError(null);
    } else if (code === 'WELCOME20' || code === 'RESTAURANT20') {
      setAppliedDiscount({ code, percentOff: 20 });
      setPromoError(null);
    } else if (code === '') {
      setAppliedDiscount(null);
      setPromoError(null);
    } else {
      setPromoError('Invalid or expired coupon code.');
    }
  };

  const handleExecutePayment = (overrideMethod?: PaymentMethodType) => {
    const methodToUse = overrideMethod || selectedMethod;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const txId = `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const invNum = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      let methodLabel = 'Credit Card (Visa / Mastercard)';
      if (methodToUse === 'apple_pay') methodLabel = 'Apple Pay (Biometric Authorization)';
      else if (methodToUse === 'google_pay') methodLabel = 'Google Pay (Instant Wallet)';
      else if (methodToUse === 'alipay') methodLabel = 'Alipay 支付宝 (Verified Mobile)';
      else if (methodToUse === 'wechat_pay') methodLabel = 'WeChat Pay 微信支付';
      else if (methodToUse === 'paypal') methodLabel = 'PayPal Express';
      else if (methodToUse === 'promptpay') methodLabel = 'PromptPay QR (Bank of Thailand)';
      else if (methodToUse === 'ach_bank') methodLabel = 'ACH Corporate Direct Debit';
      else if (methodToUse === 'corporate_invoice') methodLabel = 'Net-30 Enterprise Invoicing';

      const receipt = {
        transactionId: txId,
        paidAmount: finalTotal,
        currencySymbol: selectedCurrency.symbol,
        currencyCode: selectedCurrency.code,
        paymentMethodLabel: methodLabel,
        timestamp: new Date().toLocaleString(),
        invoiceNumber: invNum,
      };

      setPaymentCompletedReceipt(receipt);

      if (onPaymentSuccess) {
        onPaymentSuccess(item, txId);
      }
    }, 1600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-auto max-h-[96vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">ShiftForce Host &amp; Admin Billing Portal</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PCI-DSS Level 1
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Employer &amp; Host Subscription Gateway • Employees use ShiftForce 100% Free with $0.00 Staff Fees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-xl border border-white/15 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-300" />
              <select
                value={selectedCurrency.code}
                onChange={(e) => {
                  const found = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                  if (found) setSelectedCurrency(found);
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code} className="text-slate-900">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {paymentCompletedReceipt ? (
          /* Receipt / Confirmation Screen */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                Payment Authorized & Activated
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                Thank You! Your Subscription is Live
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Your license has been provisioned. A formal PDF tax invoice and receipt has been dispatched to your billing email.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left max-w-lg mx-auto space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Invoice Number</span>
                <span className="font-mono font-bold text-slate-800">{paymentCompletedReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Transaction Reference</span>
                <span className="font-mono font-bold text-slate-800">{paymentCompletedReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Item Purchased</span>
                <span className="font-bold text-indigo-700">{item.title}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Payment Channel</span>
                <span className="font-semibold text-slate-800">{paymentCompletedReceipt.paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Date & Time</span>
                <span className="text-slate-700">{paymentCompletedReceipt.timestamp}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-black">
                <span className="text-slate-900">Total Charged</span>
                <span className="text-emerald-700 font-mono">
                  {paymentCompletedReceipt.currencySymbol}
                  {paymentCompletedReceipt.paidAmount.toFixed(2)} {paymentCompletedReceipt.currencyCode}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  alert(`Downloading Official Tax Receipt ${paymentCompletedReceipt.invoiceNumber} (PDF)...`);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Invoice PDF</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                Done & Return to App
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Layout: Two Columns (Methods & Form Left, Order Summary Right) */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-y-auto">
            
            {/* Left Column (7 Cols): Payment Methods & Form */}
            <div className="lg:col-span-7 p-6 space-y-6">
              
              {/* Quick Express Wallet Checkout Bar (Apple Pay / Google Pay / Alipay) */}
              <div>
                <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center justify-between">
                  <span>1-Click Express Checkout</span>
                  <span className="text-emerald-600 font-semibold text-[10px]">Instant Biometric Verification</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Apple Pay Button */}
                  <button
                    onClick={() => handleExecutePayment('apple_pay')}
                    disabled={isProcessing}
                    className="py-2.5 px-3 bg-black hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-sm font-black">Pay</span>
                  </button>

                  {/* Google Pay Button */}
                  <button
                    onClick={() => handleExecutePayment('google_pay')}
                    disabled={isProcessing}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-xs font-bold text-slate-700">G Pay</span>
                  </button>

                  {/* Alipay Button */}
                  <button
                    onClick={() => handleExecutePayment('alipay')}
                    disabled={isProcessing}
                    className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>支付宝 Alipay</span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Or Choose Payment Channel
                </span>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'card', label: 'Credit Card', icon: CreditCard, subtitle: 'Visa, MC, Amex, JCB' },
                  { id: 'alipay', label: 'Alipay (支付宝)', icon: QrCode, subtitle: 'CNY / Global QR' },
                  { id: 'wechat_pay', label: 'WeChat Pay', icon: Smartphone, subtitle: '微信支付 Mobile' },
                  { id: 'paypal', label: 'PayPal', icon: Zap, subtitle: 'One-Touch Express' },
                  { id: 'apple_pay', label: 'Apple Pay', icon: Smartphone, subtitle: 'Touch / Face ID' },
                  { id: 'google_pay', label: 'Google Pay', icon: Globe, subtitle: 'GPay Wallet' },
                  { id: 'promptpay', label: 'PromptPay', icon: QrCode, subtitle: 'Thai QR Instant' },
                  { id: 'ach_bank', label: 'Bank ACH', icon: Building2, subtitle: 'US / SEPA Transfer' },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      selectedMethod === method.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <method.icon className={`w-4 h-4 ${selectedMethod === method.id ? 'text-indigo-600' : 'text-slate-500'}`} />
                      {selectedMethod === method.id && (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">{method.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{method.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dynamic Method Form Container */}
              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
                
                {/* 1. Credit Card Form (Visa, Mastercard, Amex, JCB, Discover, UnionPay) */}
                {selectedMethod === 'card' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Card Information</label>
                      {/* Accepted Card Badges */}
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          detectedCardBrand === 'visa' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          VISA
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          detectedCardBrand === 'mastercard' ? 'bg-red-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          MC
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          detectedCardBrand === 'amex' ? 'bg-sky-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          AMEX
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          detectedCardBrand === 'jcb' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          JCB
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider ${
                          detectedCardBrand === 'unionpay' ? 'bg-teal-700 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                        }`}>
                          UnionPay
                        </span>
                      </div>
                    </div>

                    {/* Card Number Input */}
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Expires (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">CVC / CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Postal / Zip</label>
                        <input
                          type="text"
                          value={billingZip}
                          onChange={(e) => setBillingZip(e.target.value)}
                          placeholder="Zip code"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Cardholder Full Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={saveCardForFuture}
                        onChange={(e) => setSaveCardForFuture(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-[11px] text-slate-600 font-medium">
                        Save this card securely in restaurant vault for automated renewals
                      </span>
                    </label>
                  </div>
                )}

                {/* 2. Alipay (支付宝) QR & Mobile Flow */}
                {selectedMethod === 'alipay' && (
                  <div className="text-center py-3 space-y-3">
                    <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Scan with Alipay (支付宝)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Open Alipay mobile app and scan the dynamic QR code below to complete instant RMB payment.
                      </p>
                    </div>

                    {/* QR Code Placeholder graphic */}
                    <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-dashed border-sky-400 mx-auto flex items-center justify-center relative shadow-sm">
                      <div className="w-full h-full bg-slate-900 rounded-xl p-2 flex flex-col justify-between items-center text-white">
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-sky-400 rounded-xs" />
                          <div className="w-4 h-4 bg-sky-400 rounded-xs" />
                        </div>
                        <div className="text-[9px] font-bold text-sky-300">ALIPAY QR</div>
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-sky-400 rounded-xs" />
                          <div className="w-4 h-4 bg-sky-400 rounded-xs" />
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-600">
                      Amount: <strong>¥{(finalTotal * 7.24).toFixed(2)} CNY</strong> (Converted from {selectedCurrency.symbol}{finalTotal.toFixed(2)})
                    </div>
                  </div>
                )}

                {/* 3. WeChat Pay (微信支付) */}
                {selectedMethod === 'wechat_pay' && (
                  <div className="text-center py-3 space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">WeChat Pay (微信支付)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Scan with WeChat camera or click continue to launch WeChat Mini Program authorization.
                      </p>
                    </div>

                    <div className="w-36 h-36 bg-white p-2 rounded-2xl border-2 border-dashed border-emerald-400 mx-auto flex items-center justify-center relative shadow-sm">
                      <div className="w-full h-full bg-emerald-950 rounded-xl p-2 flex flex-col justify-between items-center text-white">
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-emerald-400 rounded-xs" />
                          <div className="w-4 h-4 bg-emerald-400 rounded-xs" />
                        </div>
                        <div className="text-[9px] font-bold text-emerald-300">WECHAT QR</div>
                        <div className="w-full flex justify-between">
                          <div className="w-4 h-4 bg-emerald-400 rounded-xs" />
                          <div className="w-4 h-4 bg-emerald-400 rounded-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PromptPay QR (Thailand) */}
                {selectedMethod === 'promptpay' && (
                  <div className="text-center py-3 space-y-3">
                    <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto font-black text-xs">
                      PromptPay
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">PromptPay National QR (พร้อมเพย์)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Compatible with all Thai Mobile Banking apps (K PLUS, SCB EASY, KMA, Krungthai NEXT).
                      </p>
                    </div>
                    <div className="text-xs font-bold text-blue-800">
                      Total: ฿{(finalTotal * 36.5).toFixed(2)} THB
                    </div>
                  </div>
                )}

                {/* 5. Bank ACH Direct Debit */}
                {selectedMethod === 'ach_bank' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Corporate Bank Transfer (ACH / SEPA)</label>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Zero Processing Surcharge
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Routing Number (ABA)</label>
                        <input
                          type="text"
                          value={bankRouting}
                          onChange={(e) => setBankRouting(e.target.value)}
                          placeholder="9-digit routing"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Account Number</label>
                        <input
                          type="password"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          placeholder="Account number"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Company Tax ID / EIN</label>
                      <input
                        type="text"
                        value={companyTaxId}
                        onChange={(e) => setCompanyTaxId(e.target.value)}
                        placeholder="US-EIN-XX-XXXXXXX"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* 6. Apple Pay / Google Pay / PayPal Info */}
                {(selectedMethod === 'apple_pay' || selectedMethod === 'google_pay' || selectedMethod === 'paypal') && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                    <Sparkles className="w-6 h-6 text-indigo-600 mx-auto" />
                    <h4 className="font-bold text-xs text-slate-900">
                      Ready for 1-Click {selectedMethod === 'apple_pay' ? 'Apple Pay' : selectedMethod === 'google_pay' ? 'Google Pay' : 'PayPal'} Checkout
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Click the payment button below to open your device's native authorization window securely.
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column (5 Cols): Order Summary, Coupon & Pay Action */}
            <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-6">
              
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs font-normal text-slate-500">{selectedCurrency.code} Currency</span>
                </h3>

                {/* Item Details Box */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                        {item.badge || 'Module License'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1.5">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-900 text-sm">
                        {selectedCurrency.symbol}{basePriceInCurrency.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">/{item.period || 'month'}</div>
                    </div>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="mt-4">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Coupon / Restaurant Promo Code</label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder="e.g. WELCOME20, SHIFTSKY50"
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs uppercase font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleApplyPromo}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && (
                    <div className="text-[10px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {promoError}
                    </div>
                  )}
                  {appliedDiscount && (
                    <div className="text-[10px] text-emerald-700 mt-1 font-bold flex items-center justify-between">
                      <span>✓ Coupon "{appliedDiscount.code}" applied ({appliedDiscount.percentOff}% off)</span>
                      <button onClick={() => setAppliedDiscount(null)} className="text-slate-400 hover:text-slate-600 underline">Remove</button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="mt-5 space-y-2 pt-4 border-t border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Subtotal</span>
                    <span>{selectedCurrency.symbol}{basePriceInCurrency.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-semibold text-[11px] bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-200/60">
                    <span>Staff &amp; Employee App Access</span>
                    <span className="font-bold uppercase tracking-wide">100% Free ($0.00)</span>
                  </div>

                  {appliedDiscount && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Discount ({appliedDiscount.percentOff}%)</span>
                      <span>-{selectedCurrency.symbol}{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Estimated Tax & VAT (8.25%)</span>
                    <span>{selectedCurrency.symbol}{estimatedTax.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 font-black text-slate-900">
                    <span className="text-sm">Total Due Today</span>
                    <span className="text-xl text-indigo-700 font-mono">
                      {selectedCurrency.symbol}{finalTotal.toFixed(2)} {selectedCurrency.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pay Now Button */}
              <div className="space-y-3">
                <button
                  onClick={() => handleExecutePayment()}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-700 hover:to-sky-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing Secure Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Authorize & Pay {selectedCurrency.symbol}{finalTotal.toFixed(2)}
                      </span>
                    </>
                  )}
                </button>

                <div className="text-center text-[10px] text-slate-400 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit SSL Encrypted • 15-Day Money-Back Guarantee</span>
                  </div>
                  <div>Cancel or adjust subscription anytime with 1-click in Enterprise Hub.</div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
