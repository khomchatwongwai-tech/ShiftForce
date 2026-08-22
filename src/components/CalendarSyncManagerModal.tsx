import React, { useState } from 'react';
import {
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Sliders,
  Sparkles,
  X,
  FileSpreadsheet,
  Globe,
  Radio,
  CalendarCheck,
  CalendarDays,
  Lock,
  Eye,
  EyeOff,
  Building,
  User,
  ArrowRightLeft,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  CalendarConnection,
  ExternalCalendarEvent,
  CalendarFeedSubscription,
  CalendarSyncLog,
  CalendarConflict,
  CalendarProvider,
  CalendarSyncDirection,
  CalendarPrivacyLevel,
  Department
} from '../types';

interface CalendarSyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: CalendarConnection[];
  onAddConnection: (conn: Partial<CalendarConnection>) => void;
  onUpdateConnection: (id: string, patch: Partial<CalendarConnection>) => void;
  onDeleteConnection: (id: string) => void;
  externalEvents: ExternalCalendarEvent[];
  onAddExternalEvent: (evt: Partial<ExternalCalendarEvent>) => void;
  onDeleteExternalEvent: (id: string) => void;
  feedSubscriptions: CalendarFeedSubscription[];
  syncLogs: CalendarSyncLog[];
  conflicts: CalendarConflict[];
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
}

export const CalendarSyncManagerModal: React.FC<CalendarSyncManagerModalProps> = ({
  isOpen,
  onClose,
  connections,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
  externalEvents,
  onAddExternalEvent,
  onDeleteExternalEvent,
  feedSubscriptions,
  syncLogs,
  conflicts,
  onTriggerSync,
  isSyncing,
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'feeds' | 'events' | 'conflicts' | 'logs'>('connections');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Connection Form Modal / Section
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [newProvider, setNewProvider] = useState<CalendarProvider>('google');
  const [newEmail, setNewEmail] = useState('');
  const [newCalName, setNewCalName] = useState('');
  const [newDirection, setNewDirection] = useState<CalendarSyncDirection>('two_way');
  const [newPrivacy, setNewPrivacy] = useState<CalendarPrivacyLevel>('full_details');
  const [newSyncInterval, setNewSyncInterval] = useState<number>(15);

  // New External Event Form
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEventStart, setNewEventStart] = useState('17:00');
  const [newEventEnd, setNewEventEnd] = useState('23:00');
  const [newEventType, setNewEventType] = useState<ExternalCalendarEvent['eventType']>('restaurant_buyout');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventLoc, setNewEventLoc] = useState('Main Patio & Dining Room');
  const [newEventPax, setNewEventPax] = useState<number>(80);
  const [newEventRevenue, setNewEventRevenue] = useState<number>(10000);

  if (!isOpen) return null;

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    onAddConnection({
      provider: newProvider,
      accountEmail: newEmail.trim(),
      calendarName: newCalName.trim() || `${newProvider.toUpperCase()} Business Calendar`,
      syncDirection: newDirection,
      privacyLevel: newPrivacy,
      autoSyncIntervalMinutes: newSyncInterval,
      color: newProvider === 'google' ? '#0284c7' : newProvider === 'microsoft' ? '#4f46e5' : '#d97706',
    });

    setIsAddingConnection(false);
    setNewEmail('');
    setNewCalName('');
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    onAddExternalEvent({
      title: newEventTitle.trim(),
      date: newEventDate,
      startTime: newEventStart,
      endTime: newEventEnd,
      eventType: newEventType,
      description: newEventDesc.trim(),
      location: newEventLoc.trim(),
      attendeesCount: newEventPax,
      revenueForecast: newEventRevenue,
      isBusy: true,
      privacyLevel: 'full_details',
      color: newEventType === 'restaurant_buyout' ? '#9333ea' : newEventType === 'vip_reservation' ? '#e11d48' : '#0284c7',
    });

    setIsAddingEvent(false);
    setNewEventTitle('');
    setNewEventDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-sky-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shadow-inner">
              <CalendarDays className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Workqora Calendar Synchronization Hub
                </h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Live 2-Way Sync
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Connect Google Workspace, Microsoft 365, Apple CalDAV &amp; live ICS feeds with restaurant conflict intelligence.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerSync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync All Calendars'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('connections')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'connections'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Connected Providers ({connections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'feeds'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live iCal/Webcal Feeds ({feedSubscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'events'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>External Restaurant Events ({externalEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'bg-rose-600 text-white shadow-xs'
                : conflicts.length > 0
                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Schedule Conflicts ({conflicts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sync History</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: CONNECTED PROVIDERS */}
          {activeTab === 'connections' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">External Calendar Integrations</h3>
                  <p className="text-xs text-slate-500">
                    Two-way synchronization between Workqora shift roster and external business/personal calendars.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingConnection(true)}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect New Calendar</span>
                </button>
              </div>

              {/* Add Connection Modal Form */}
              {isAddingConnection && (
                <form onSubmit={handleCreateConnection} className="bg-sky-50/70 border-2 border-sky-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Connect Calendar Provider
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingConnection(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Calendar Provider</label>
                      <select
                        value={newProvider}
                        onChange={(e) => setNewProvider(e.target.value as CalendarProvider)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="google">Google Calendar / Google Workspace</option>
                        <option value="microsoft">Microsoft 365 / Outlook Calendar</option>
                        <option value="apple_caldav">Apple iCloud / CalDAV</option>
                        <option value="ics_webcal">External ICS / Webcal Feed URL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Email / ID</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. events@restaurant.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Calendar Display Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Restaurant Buyouts & VIP Events"
                        value={newCalName}
                        onChange={(e) => setNewCalName(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Sync Direction</label>
                      <select
                        value={newDirection}
                        onChange={(e) => setNewDirection(e.target.value as CalendarSyncDirection)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="two_way">Two-Way (Import Events & Export Shifts)</option>
                        <option value="workqora_to_external">Workqora → External Only (Export shifts)</option>
                        <option value="external_to_workqora">External → Workqora Only (Import events/busy blocks)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Privacy &amp; Free/Busy Filter</label>
                      <select
                        value={newPrivacy}
                        onChange={(e) => setNewPrivacy(e.target.value as CalendarPrivacyLevel)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="full_details">Full Event Details (Title, Notes, Location)</option>
                        <option value="free_busy_only">Free / Busy Only (Hide personal titles, mark as Busy)</option>
                        <option value="work_hours_only">Work Hours Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Auto-Sync Frequency</label>
                      <select
                        value={newSyncInterval}
                        onChange={(e) => setNewSyncInterval(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
                      >
                        <option value={15}>Every 15 Minutes (Real-Time)</option>
                        <option value={30}>Every 30 Minutes</option>
                        <option value={60}>Every 1 Hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingConnection(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs cursor-pointer"
                    >
                      Authorize &amp; Connect Calendar
                    </button>
                  </div>
                </form>
              )}

              {/* Connections List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                          style={{ backgroundColor: conn.color }}
                        >
                          {conn.provider === 'google' ? 'G' : conn.provider === 'microsoft' ? 'MS' : conn.provider === 'apple_caldav' ? '🍎' : 'ICS'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{conn.calendarName}</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Synced" />
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                            {conn.accountEmail}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteConnection(conn.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Disconnect Calendar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                      <div>
                        <span className="font-bold block text-slate-400 uppercase tracking-wider text-[9px]">Direction</span>
                        <span className="font-medium text-slate-800 capitalize">{conn.syncDirection.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400 uppercase tracking-wider text-[9px]">Privacy</span>
                        <span className="font-medium text-slate-800 capitalize">{conn.privacyLevel.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Auto-sync: every {conn.autoSyncIntervalMinutes}m</span>
                      {conn.syncStatus === 'error' ? (
                        <div className="flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Authorization Expired</span>
                          <button
                            onClick={() => onUpdateConnection(conn.id, { syncStatus: 'synced', lastSyncedAt: new Date().toISOString() })}
                            className="underline hover:text-rose-900 ml-1 cursor-pointer font-black"
                          >
                            Reconnect
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE ICAL / WEBCAL FEEDS */}
          {activeTab === 'feeds' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-950 space-y-1">
                  <h4 className="font-bold">Live Calendar Subscription URLs (RFC 5545)</h4>
                  <p className="text-sky-800">
                    Subscribe from any calendar app (Apple Calendar on iPhone/Mac, Google Calendar, Outlook). Any shift created or modified in Workqora automatically updates on all employee devices.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {feedSubscriptions.map((feed) => (
                  <div key={feed.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{feed.name}</h4>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            {feed.feedType.replace(/_/g, ' ')} {feed.department ? `• ${feed.department}` : ''}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        Active 24/7 Feed
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span>Webcal Subscription Link (Apple &amp; Outlook 1-Click Sync):</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={feed.webcalUrl}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 select-all"
                        />
                        <button
                          onClick={() => handleCopyLink(feed.webcalUrl, `webcal-${feed.id}`)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedToken === `webcal-${feed.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedToken === `webcal-${feed.id}` ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXTERNAL RESTAURANT EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Restaurant Business Events &amp; Buyouts</h3>
                  <p className="text-xs text-slate-500">
                    Imported from Google Calendar / Microsoft 365 catering systems.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingEvent(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Restaurant Event</span>
                </button>
              </div>

              {/* Add Event Form */}
              {isAddingEvent && (
                <form onSubmit={handleCreateEvent} className="bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-purple-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-900">
                      Create Restaurant Special Event
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Event Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 🎉 Hollywood Movie Wrap Party Buyout (150 Pax)"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Event Category</label>
                      <select
                        value={newEventType}
                        onChange={(e) => setNewEventType(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
                      >
                        <option value="restaurant_buyout">Restaurant Buyout / Private Dining</option>
                        <option value="vip_reservation">VIP Chef Tasting / Wine Dinner</option>
                        <option value="catering_event">Large Catering Delivery</option>
                        <option value="maintenance">Kitchen Maintenance / Shutoff</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Start &amp; End Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={newEventStart}
                          onChange={(e) => setNewEventStart(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2 py-2 font-mono"
                        />
                        <input
                          type="time"
                          value={newEventEnd}
                          onChange={(e) => setNewEventEnd(e.target.value)}
                          className="w-full text-xs bg-white border border-slate-300 rounded-xl px-2 py-2 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Location / Dining Room</label>
                      <input
                        type="text"
                        value={newEventLoc}
                        onChange={(e) => setNewEventLoc(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingEvent(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Event
                    </button>
                  </div>
                </form>
              )}

              {/* Event Cards */}
              <div className="space-y-2.5">
                {externalEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ backgroundColor: evt.color || '#0284c7' }}
                        >
                          {evt.eventType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          📅 {evt.date} • {evt.startTime} - {evt.endTime}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {evt.title}
                      </h4>

                      {evt.description && (
                        <p className="text-[11px] text-slate-600">
                          {evt.description}
                        </p>
                      )}

                      {evt.revenueForecast && (
                        <div className="text-[10px] text-emerald-700 font-bold font-mono">
                          Revenue Forecast: ${evt.revenueForecast.toLocaleString()} ({evt.attendeesCount || 0} Guests)
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteExternalEvent(evt.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SCHEDULE CONFLICTS */}
          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Real-Time Calendar Conflicts</h3>
                <p className="text-xs text-slate-500">
                  Cross-checked against staff personal Google/Outlook busy blocks and restaurant maintenance schedules.
                </p>
              </div>

              {conflicts.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-3xl space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">All Calendars Clear!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No overlapping shifts, employee out-of-office blocks, or restaurant maintenance conflicts detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conflicts.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span className="font-bold text-xs text-rose-950">
                            {c.severity === 'blocking' ? '🚫 Hard Calendar Conflict' : '⚠️ Schedule Warning'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-mono font-black rounded-md">
                          {c.shiftDate}
                        </span>
                      </div>

                      <div className="text-xs text-slate-800">
                        <strong>{c.employeeName}</strong>: {c.details}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        Shift: {c.shiftTitle} vs External: {c.externalEventTitle}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYNC LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Calendar Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Detailed logs of bidirectional synchronization triggers and delta changes.
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {log.provider.toUpperCase()} ({log.accountEmail})
                      </span>
                      <span className="text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Imported: {log.eventsImported}</span>
                      <span>Exported: {log.eventsExported}</span>
                      <span>Conflicts: {log.conflictsFound}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            🔒 Multi-Tenant RLS Protected • Privacy Free/Busy Filter Enabled
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Calendar Hub
          </button>
        </div>

      </div>
    </div>
  );
};
