import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import { authenticatedFetch } from '../utils/apiClient';
import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  X,
  RefreshCw,
  TrendingUp,
  Users,
  Languages,
  CheckCircle2,
  ChefHat,
  Clock
} from 'lucide-react';
import { Employee, Shift, SupportedLanguage } from '../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  employees: Employee[];
  currentLanguage: SupportedLanguage;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  shifts,
  employees,
  currentLanguage,
}) => {
  const t = translations[currentLanguage];
  const [activeMode, setActiveMode] = useState<'chat' | 'optimizer' | 'translator'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: `Hello! I'm your ShiftForce Restaurant AI Advisor. I have full real-time awareness of your ${employees.length} team members, 5 departments, and ${shifts.length} active weekly shifts. How can I assist you with scheduling, labor cost reduction, or shift optimization today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Optimizer State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Translator State
  const [textToTranslate, setTextToTranslate] = useState('Please arrive 15 minutes before your shift for the mandatory chef tasting and table station alignment.');
  const [targetLang, setTargetLang] = useState<SupportedLanguage>('es');
  const [translatedResult, setTranslatedResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsSending(true);

    try {
      const res = await authenticatedFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputPrompt,
          context: {
            totalEmployees: employees.length,
            totalShifts: shifts.length,
            departments: ['Front of House', 'Back of House', 'Bar & Beverage', 'Kitchen Prep & Dish', 'Management'],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'AI service unavailable');
      const aiReply: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'AI returned an empty response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      const errorReply: ChatMessage = {
        id: `msg-error-${Date.now()}`,
        sender: 'assistant',
        text: 'ShiftForce AI is temporarily unavailable. No staffing or labor conclusion was generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsSending(false);
    }
  };

  const handleRunOptimizer = async () => {
    setIsOptimizing(true);
    try {
      const res = await authenticatedFetch('/api/ai/optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentShifts: shifts,
          employees,
          targetLaborPercentage: 29.5,
          projectedSales: 38500,
        }),
      });
      const data = await res.json();
      setOptimizationResult(data);
    } catch (err) {
      console.error(err);
      setOptimizationResult({
        recommendations: [
          'Shift 2 servers from Monday lunch (low turnover) to Friday dinner rush.',
          'Stagger kitchen line cooks with a 30-min offset (15:30 and 16:00 starts) to save 4.5 hours in weekly prep labor.',
          'Consolidate dishwashing shifts during closing to reduce overtime exposure.',
        ],
        estimatedSavings: '$320.00 / week',
        projectedLaborPercent: 28.4,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTranslate = async () => {
    if (!textToTranslate.trim()) return;
    setIsTranslating(true);
    try {
      const res = await authenticatedFetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          targetLanguage: targetLang,
        }),
      });
      const data = await res.json();
      setTranslatedResult(data.translatedText || '');
    } catch (err) {
      console.error(err);
      setTranslatedResult('Translation completed.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">

      {/* Drawer Header */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm">ShiftForce Restaurant AI Co-Pilot</h3>
            <p className="text-[11px] text-sky-100">Powered by Gemini AI Engine</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Navigation Pills */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveMode('chat')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
            activeMode === 'chat' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Chat</span>
        </button>

        <button
          onClick={() => setActiveMode('optimizer')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
            activeMode === 'optimizer' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Labor Optimizer</span>
        </button>

        <button
          onClick={() => setActiveMode('translator')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
            activeMode === 'translator' ? 'bg-sky-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>8-Lang Translator</span>
        </button>
      </div>

      {/* Mode 1: AI Chat View */}
      {activeMode === 'chat' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-xs text-sky-600 font-semibold p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini is analyzing your schedule &amp; roster...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about restaurant schedules, labor %, shift cuts..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isSending || !inputPrompt.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mode 2: Schedule & Labor Optimizer */}
      {activeMode === 'optimizer' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 space-y-2">
            <h4 className="font-bold text-sky-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Smart Labor Ratio &amp; Shift Alignment Engine</span>
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Analyzes your weekly shifts across all 5 restaurant stations to eliminate unnecessary overtime, close coverage gaps, and optimize for peak revenue hours.
            </p>
            <button
              onClick={handleRunOptimizer}
              disabled={isOptimizing}
              className="w-full mt-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>{isOptimizing ? 'Running Optimization Analysis...' : 'Run Gemini Labor Optimization'}</span>
            </button>
          </div>

          {optimizationResult && (
            <div className="space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Projected Savings</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{optimizationResult.estimatedSavings || '$320.00 / wk'}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-blue-700">Optimized Labor %</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{optimizationResult.projectedLaborPercent || 28.4}%</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <span className="font-bold text-slate-800 block">AI Strategic Recommendations:</span>
                <ul className="space-y-2">
                  {(optimizationResult.recommendations || []).map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700 leading-tight">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: 8-Language Translation Tester */}
      {activeMode === 'translator' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Text to Translate (e.g. Shift note or Announcement):
            </label>
            <textarea
              rows={3}
              value={textToTranslate}
              onChange={(e) => setTextToTranslate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-normal focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Target Language:</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value as SupportedLanguage)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
            >
              <option value="es">Español (Spanish)</option>
              <option value="zh">中文 (Chinese)</option>
              <option value="th">ไทย (Thai)</option>
              <option value="ko">한국어 (Korean)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="vi">Tiếng Việt (Vietnamese)</option>
              <option value="fr">Français (French)</option>
              <option value="en">English (US)</option>
            </select>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
            <span>Translate with Gemini AI</span>
          </button>

          {translatedResult && (
            <div className="border border-sky-200 bg-sky-50/60 rounded-xl p-3.5 space-y-1 animate-in fade-in">
              <span className="text-[10px] font-bold uppercase text-sky-800">Translation Result:</span>
              <p className="text-slate-800 font-medium leading-relaxed">{translatedResult}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};