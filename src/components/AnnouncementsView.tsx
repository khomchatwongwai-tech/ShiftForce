import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import { authenticatedFetch } from '../utils/apiClient';
import React, { useState } from 'react';
import {
  Megaphone,
  Send,
  Sparkles,
  Smartphone,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  Flame,
  Pin,
  RefreshCw,
  Users,
  ShieldCheck,
  Star,
  Award,
  Heart,
  Rocket,
  Camera
} from 'lucide-react';
import { Announcement, Employee, SupportedLanguage, Department, NotificationDispatch } from '../types';

interface AnnouncementsViewProps {
  portal: 'admin' | 'employee';
  announcements: Announcement[];
  employees: Employee[];
  currentEmployee?: Employee;
  currentLanguage: SupportedLanguage;
  onCreateAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'readByEmployeeIds'>) => void;
  onAcknowledgeAnnouncement: (announcementId: string, employeeId: string) => void;
  onReactToAnnouncement?: (announcementId: string, emoji: 'clap' | 'fire' | 'heart' | 'star' | 'rocket') => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  portal,
  announcements,
  employees,
  currentEmployee,
  currentLanguage,
  onCreateAnnouncement,
  onAcknowledgeAnnouncement,
  onReactToAnnouncement,
}) => {
  const t = translations[currentLanguage];

  // Admin New Announcement Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [targetDepartment, setTargetDepartment] = useState<Department | 'all'>('all');
  const [channels, setChannels] = useState<{ app: boolean; sms: boolean; email: boolean }>({
    app: true,
    sms: true,
    email: true,
  });

  // AI Announcement Drafting State
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const handleDraftWithAI = async () => {
    if (!aiPromptTopic.trim()) return;
    setIsDraftingAI(true);

    try {
      const res = await authenticatedFetch('/api/ai/draft-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiPromptTopic,
          priority,
          targetAudience: targetDepartment === 'all' ? 'All Restaurant Staff' : `${targetDepartment} Team`,
        }),
      });

      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.content) setContent(data.content);
      setShowAIAssistant(false);
    } catch (err) {
      console.error(err);
      setTitle(`Restaurant Update: ${aiPromptTopic}`);
      setContent(`Team, please note the following operational update regarding ${aiPromptTopic}. Make sure to review your shifts and adhere to all safety and service standards.`);
    } finally {
      setIsDraftingAI(false);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const enabledChannels: ('app' | 'sms' | 'email')[] = [];
    if (channels.app) enabledChannels.push('app');
    if (channels.sms) enabledChannels.push('sms');
    if (channels.email) enabledChannels.push('email');

    onCreateAnnouncement({
      title,
      content,
      authorName: portal === 'admin' ? 'General Manager' : 'Admin',
      authorRole: 'General Manager',
      priority,
      targetDepartment,
      channels: enabledChannels,
      isPinned: priority === 'emergency',
    });

    setTitle('');
    setContent('');
    setPriority('normal');
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{t.announcements}</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
              {portal === 'admin' ? 'Broadcast & Communication Hub' : 'Staff Notice Board'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {portal === 'admin'
              ? 'Only Admin and GM can publish announcements. Automatically broadcast to all employee phones, emails, and app.'
              : 'Official restaurant announcements, shift guidelines, menu updates, and mandatory notices.'}
          </p>
        </div>

        {portal === 'admin' && (
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-600 animate-spin" style={{ animationDuration: '8s' }} />
            <span>AI Announcement Drafter</span>
          </button>
        )}
      </div>

      {/* Admin Broadcast Publisher (Admin Portal Only) */}
      {portal === 'admin' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">

          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-sky-600" />
              <span>Create Official Staff Announcement</span>
            </h3>
            <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
              Admin Exclusive Authority
            </span>
          </div>

          {/* AI Drafter Drawer */}
          {showAIAssistant && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>Draft Announcement with Gemini AI</span>
                </div>
                <button onClick={() => setShowAIAssistant(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Health inspection this Friday, New tasting menu items, Holiday tip pool..."
                  value={aiPromptTopic}
                  onChange={(e) => setAiPromptTopic(e.target.value)}
                  className="flex-1 p-2 text-xs bg-white border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
                <button
                  onClick={handleDraftWithAI}
                  disabled={isDraftingAI}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isDraftingAI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-4 text-xs">

            {/* Title & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Headline / Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory Pre-Shift Tasting &amp; Service Standards"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority Level:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                >
                  <option value="normal">Normal Notice</option>
                  <option value="urgent">Urgent / Action Required</option>
                  <option value="emergency">Emergency / Pinned Top</option>
                </select>
              </div>
            </div>

            {/* Target Department */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Target Audience:</label>
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value as any)}
                className="w-full sm:w-64 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="all">All Restaurant Staff (All Departments)</option>
                <option value="Front of House">Front of House (Servers, Hosts, Bussers)</option>
                <option value="Back of House">Back of House (Chefs, Line Cooks)</option>
                <option value="Bar & Beverage">Bar &amp; Beverage (Bartenders)</option>
                <option value="Kitchen Prep & Dish">Kitchen Prep &amp; Dishwashers</option>
                <option value="Management">Management Only</option>
              </select>
            </div>

            {/* Content Box */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Announcement Message:</label>
              <textarea
                required
                rows={4}
                placeholder="Write message here. It will be delivered instantly to all staff phones and email rosters..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden font-normal"
              />
            </div>

            {/* Simultaneous Multi-Channel Delivery Selector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-slate-700 block">Simultaneous Delivery Channels:</span>
                <span className="text-[11px] text-slate-500">Sends at the exact same moment to all staff</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.app}
                    onChange={(e) => setChannels({ ...channels, app: e.target.checked })}
                    className="rounded text-sky-600"
                  />
                  <Bell className="w-3.5 h-3.5 text-sky-600" />
                  <span>In-App</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                    className="rounded text-sky-600"
                  />
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SMS Phone</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    className="rounded text-sky-600"
                  />
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Email</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Publish &amp; Broadcast Announcement</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* Announcements Feed (Visible to both Admin & Employee) */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span>Active Announcements Feed</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            {announcements.length} Published
          </span>
        </h3>

        <div className="space-y-4">
          {announcements.map((ann) => {
            const readList = ann.readByEmployeeIds || ann.readBy || [];
            const isRead = currentEmployee ? readList.includes(currentEmployee.id) : false;
            const readCount = readList.length;
            const totalStaff = employees.length;
            const channelsList = ann.channels || ['in_app'];
            const audienceText = ann.targetDepartment
              ? (ann.targetDepartment === 'all' ? 'All Staff' : ann.targetDepartment)
              : (ann.targetDepartments === 'all' || !ann.targetDepartments ? 'All Staff' : Array.isArray(ann.targetDepartments) ? ann.targetDepartments.join(', ') : 'All Staff');

            return (
              <div
                key={ann.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs transition-all space-y-3 ${
                  ann.priority === 'emergency'
                    ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                    : ann.priority === 'urgent'
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Announcement Top Meta */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {ann.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-rose-600 text-white rounded-md uppercase">
                        <Pin className="w-3 h-3" /> Pinned
                      </span>
                    )}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      ann.priority === 'emergency'
                        ? 'bg-rose-100 text-rose-800'
                        : ann.priority === 'urgent'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {ann.priority}
                    </span>

                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      Audience: {audienceText}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      • {ann.createdAt || ann.publishedAt || 'Recent'}
                    </span>
                  </div>

                  {/* Simultaneous Channels Sent Badge */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className="font-semibold">Dispatched via:</span>
                    {channelsList.map(ch => (
                      <span key={ch} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-mono uppercase">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Title & Body */}
                <div>
                  <h4 className="font-bold text-base text-slate-900 mb-1.5 flex items-center gap-2">
                    {ann.reviewSnapshot && <Star className="w-4 h-4 fill-amber-400 text-amber-500" />}
                    {ann.title}
                  </h4>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                {/* 5-Star Review Snapshot Card if attached */}
                {ann.reviewSnapshot && (
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    ann.reviewSnapshot.theme === 'neon'
                      ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 border-purple-500/40 text-white'
                      : ann.reviewSnapshot.theme === 'emerald'
                      ? 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 border-emerald-500/40 text-white'
                      : ann.reviewSnapshot.theme === 'sunset'
                      ? 'bg-gradient-to-br from-rose-950 via-orange-950 to-amber-950 border-orange-500/40 text-white'
                      : 'bg-gradient-to-br from-amber-950 via-yellow-950 to-amber-900 border-amber-500/40 text-amber-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> Verified 5-Star {ann.reviewSnapshot.source?.toUpperCase()} Review
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        +{ann.reviewSnapshot.kudosAwarded || 50} Kudos Points
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold italic text-white/95">
                      "{ann.reviewSnapshot.highlightQuote || ann.reviewSnapshot.reviewText}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-white/80">
                      <span>Guest: {ann.reviewSnapshot.reviewerName}</span>
                      {ann.reviewSnapshot.mentionedStaff && ann.reviewSnapshot.mentionedStaff.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>Staff Recognized:</span>
                          {ann.reviewSnapshot.mentionedStaff.map((st: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.2 bg-white/20 rounded font-bold text-white">
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Staff Interactive Emoji Reaction Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium mr-1">Staff Reactions:</span>
                    <button
                      onClick={() => onReactToAnnouncement && onReactToAnnouncement(ann.id, 'clap')}
                      className="px-2 py-0.5 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      👏 <span>{ann.reactions?.clap || 6}</span>
                    </button>
                    <button
                      onClick={() => onReactToAnnouncement && onReactToAnnouncement(ann.id, 'fire')}
                      className="px-2 py-0.5 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      🔥 <span>{ann.reactions?.fire || 4}</span>
                    </button>
                    <button
                      onClick={() => onReactToAnnouncement && onReactToAnnouncement(ann.id, 'heart')}
                      className="px-2 py-0.5 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      ❤️ <span>{ann.reactions?.heart || 8}</span>
                    </button>
                    <button
                      onClick={() => onReactToAnnouncement && onReactToAnnouncement(ann.id, 'star')}
                      className="px-2 py-0.5 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      ⭐ <span>{ann.reactions?.star || 5}</span>
                    </button>
                    <button
                      onClick={() => onReactToAnnouncement && onReactToAnnouncement(ann.id, 'rocket')}
                      className="px-2 py-0.5 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      🚀 <span>{ann.reactions?.rocket || 3}</span>
                    </button>
                  </div>

                  {ann.isCommunityPost && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Community Recognition Post
                    </span>
                  )}
                </div>

                {/* Bottom Footer: Author & Read Acknowledgement */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Posted by <strong>{ann.authorName}</strong> {ann.authorRole ? `(${ann.authorRole})` : ''}</span>
                    <span>•</span>
                    <span className="font-mono">{readCount} of {totalStaff} Staff Acknowledged</span>
                  </div>

                  {/* Employee Acknowledge Button */}
                  {currentEmployee && (
                    <div>
                      {isRead ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acknowledged &amp; Read</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAcknowledgeAnnouncement(ann.id, currentEmployee.id)}
                          className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark as Read &amp; Acknowledged</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};