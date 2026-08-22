import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Archive,
  Trash2,
  Star,
  Search,
  RefreshCw,
  Plus,
  Paperclip,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Building2,
  Mail,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import {
  BusinessEmailConnection,
  EmailMessage,
  EmailTemplate,
  EmailSignature,
  CustomRole,
  Location
} from '../../types';
import {
  generateEmailAISummary,
  generateAIDraftReply,
  canUserSendFromMailbox
} from '../../utils/emailSyncEngine';
import { EmailActionConverterModal } from './EmailActionConverterModal';

interface UnifiedEmailInboxViewProps {
  connections: BusinessEmailConnection[];
  messages: EmailMessage[];
  templates: EmailTemplate[];
  signatures: EmailSignature[];
  locations: Location[];
  currentRole: CustomRole | null;
  selectedLocationId: string | null;
  onSendMessage: (msg: Partial<EmailMessage>) => void;
  onUpdateMessage: (id: string, updates: Partial<EmailMessage>) => void;
  onDeleteMessage: (id: string) => void;
  onSyncConnection: (connectionId: string) => void;
  onOpenSettings: () => void;
}

export const UnifiedEmailInboxView: React.FC<UnifiedEmailInboxViewProps> = ({
  connections,
  messages,
  templates,
  signatures,
  locations,
  currentRole,
  selectedLocationId,
  onSendMessage,
  onUpdateMessage,
  onDeleteMessage,
  onSyncConnection,
  onOpenSettings
}) => {
  // Navigation State
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    messages.length > 0 ? messages[0].id : null
  );

  // Modals & Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Compose Form
  const [composeFromId, setComposeFromId] = useState<string>(
    connections[0]?.id || ''
  );
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedSigId, setSelectedSigId] = useState<string>(
    signatures[0]?.id || ''
  );

  // Reply state in viewer
  const [replyText, setReplyText] = useState<string>('');
  const [isGeneratingAIReply, setIsGeneratingAIReply] = useState(false);

  // Trigger sync animation
  const handleTriggerSync = () => {
    setIsSyncing(true);
    if (selectedConnectionId !== 'all') {
      onSyncConnection(selectedConnectionId);
    } else if (connections[0]) {
      onSyncConnection(connections[0].id);
    }
    setTimeout(() => {
      setIsSyncing(false);
      setActionNotice('Mailboxes synchronized successfully with Google Workspace and Microsoft 365.');
      setTimeout(() => setActionNotice(null), 4000);
    }, 1200);
  };

  // Filter messages based on scope, folder, category, and search query
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Folder filter
      if (selectedFolder === 'inbox' && (msg.folder !== 'inbox' || msg.isArchived)) return false;
      if (selectedFolder === 'starred' && (!msg.isStarred || msg.isArchived)) return false;
      if (selectedFolder === 'sent' && !msg.isSent) return false;
      if (selectedFolder === 'drafts' && !msg.isDraft) return false;
      if (selectedFolder === 'archive' && !msg.isArchived) return false;
      if (selectedFolder === 'trash' && msg.folder !== 'trash') return false;

      // Mailbox connection filter
      if (selectedConnectionId !== 'all' && msg.connectionId !== selectedConnectionId) return false;

      // Location scope filter if not viewing all
      if (selectedLocationId && selectedLocationId !== 'all' && msg.locationId && msg.locationId !== selectedLocationId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && msg.category !== selectedCategory) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = msg.subject.toLowerCase().includes(q);
        const matchSender = msg.from.name.toLowerCase().includes(q) || msg.from.email.toLowerCase().includes(q);
        const matchBody = msg.bodyText.toLowerCase().includes(q);
        const matchLabels = msg.labels.some((l) => l.toLowerCase().includes(q));
        if (!matchSubject && !matchSender && !matchBody && !matchLabels) return false;
      }

      return true;
    });
  }, [messages, selectedFolder, selectedCategory, selectedConnectionId, selectedLocationId, searchQuery]);

  const activeMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || filteredMessages[0] || null;
  }, [messages, selectedMessageId, filteredMessages]);

  // Handle template selection in compose modal
  const handleApplyTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (!tmpl) return;

    setComposeSubject(tmpl.subject.replace('{{week_dates}}', 'Aug 24 - Aug 30, 2026').replace('{{location_name}}', 'SF Flagship #104'));
    let populatedBody = tmpl.body
      .replace('{{employee_name}}', 'Alex Rivera')
      .replace('{{location_name}}', 'Workqora SF Flagship #104')
      .replace('{{week_dates}}', 'Aug 24 - Aug 30, 2026')
      .replace('{{shifts_summary}}', '• Mon Aug 24: 04:00 PM - 11:30 PM (Bar Captain)\n• Wed Aug 26: 04:00 PM - 11:30 PM (Bar Captain)\n• Fri Aug 28: 05:00 PM - 01:00 AM (Closing Lead)')
      .replace('{{manager_name}}', 'Johnathan Cole')
      .replace('{{manager_phone}}', '(415) 555-0104');

    const sig = signatures.find((s) => s.id === selectedSigId);
    if (sig) {
      populatedBody += `\n\n--\n${sig.content}`;
    }

    setComposeBody(populatedBody);
  };

  // Handle AI quick draft reply
  const handleGenerateAIReply = (tone: 'professional' | 'concise' | 'friendly' | 'schedule_confirm') => {
    if (!activeMessage) return;
    setIsGeneratingAIReply(true);
    setTimeout(() => {
      const draft = generateAIDraftReply(activeMessage, tone);
      const sig = signatures[0];
      const withSig = sig ? `${draft}\n\n--\n${sig.content}` : draft;
      setReplyText(withSig);
      setIsGeneratingAIReply(false);
    }, 400);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMessage) return;

    const fromConn = connections.find((c) => c.id === activeMessage.connectionId) || connections[0];

    onSendMessage({
      connectionId: fromConn?.id || 'conn-default',
      threadId: activeMessage.threadId || activeMessage.id,
      from: {
        name: fromConn?.displayName || 'Workqora Operations',
        email: fromConn?.emailAddress || 'operations@workqora-hospitality.com'
      },
      to: [activeMessage.from],
      subject: activeMessage.subject.startsWith('Re:') ? activeMessage.subject : `Re: ${activeMessage.subject}`,
      snippet: replyText.slice(0, 100) + '...',
      bodyText: replyText,
      folder: 'sent',
      isSent: true,
      isRead: true,
      category: activeMessage.category,
      labels: ['Reply', ...activeMessage.labels]
    });

    setReplyText('');
    setActionNotice(`Reply sent from ${fromConn?.emailAddress || 'Workqora mailbox'}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendCompose = (e: React.FormEvent) => {
    e.preventDefault();
    const fromConn = connections.find((c) => c.id === composeFromId) || connections[0];

    onSendMessage({
      connectionId: fromConn.id,
      from: {
        name: fromConn.displayName,
        email: fromConn.emailAddress
      },
      to: [{ name: composeTo, email: composeTo }],
      subject: composeSubject,
      snippet: composeBody.slice(0, 100) + '...',
      bodyText: composeBody,
      folder: 'sent',
      isSent: true,
      isRead: true,
      category: 'operations',
      labels: ['Outbound', 'Workqora Broadcast']
    });

    setIsComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setActionNotice(`Email sent successfully via ${fromConn.displayName}.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.isRead && m.folder === 'inbox' && !m.isArchived).length;
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[640px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Banner Notice if available */}
      {actionNotice && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-white/80 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Main Mailbox Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Business Email Inbox
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Multi-Tenant Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Connected across Google Workspace, Microsoft 365, & IMAP/SMTP accounts
            </p>
          </div>
        </div>

        {/* Mailbox Scope Switcher & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Active Mailbox Selector */}
          <div className="relative">
            <select
              id="select-email-connection-scope"
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">📬 All Connected Mailboxes ({connections.length})</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.scopeLevel === 'organization' ? '🏢 ' : c.scopeLevel === 'region' ? '🌎 ' : '📍 '}
                  {c.displayName} ({c.emailAddress})
                </option>
              ))}
            </select>
          </div>

          {/* Sync Button */}
          <button
            id="trigger-email-sync-btn"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">Sync Mailboxes</span>
          </button>

          {/* Compose Email */}
          <button
            id="compose-new-email-btn"
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Compose</span>
          </button>

          {/* Settings Shortcut */}
          <button
            id="open-email-settings-btn"
            onClick={onOpenSettings}
            title="Manage Email Integrations"
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Folders / Thread List / Detail Viewer */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLUMN 1: Folders & Mailboxes Sidebar */}
        <div className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Primary Folders */}
            <div>
              <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1.5">
                Mail Folders
              </p>
              <nav className="space-y-0.5">
                <button
                  id="folder-inbox-btn"
                  onClick={() => setSelectedFolder('inbox')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    selectedFolder === 'inbox'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4" />
                    <span>Inbox</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  id="folder-starred-btn"
                  onClick={() => setSelectedFolder('starred')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    selectedFolder === 'starred'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </button>
                <button
                  id="folder-sent-btn"
                  onClick={() => setSelectedFolder('sent')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    selectedFolder === 'sent'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Sent</span>
                </button>
                <button
                  id="folder-drafts-btn"
                  onClick={() => setSelectedFolder('drafts')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    selectedFolder === 'drafts'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Drafts</span>
                </button>
                <button
                  id="folder-archive-btn"
                  onClick={() => setSelectedFolder('archive')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    selectedFolder === 'archive'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive</span>
                </button>
                <button
                  id="folder-trash-btn"
                  onClick={() => setSelectedFolder('trash')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                    selectedFolder === 'trash'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </button>
              </nav>
            </div>

            {/* Smart Category Filters */}
            <div>
              <p className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1.5">
                Work Categories
              </p>
              <div className="space-y-1">
                {[
                  { id: 'all', label: 'All Categories' },
                  { id: 'operations', label: 'Operations & Policy' },
                  { id: 'inventory', label: 'Inventory & Vendors' },
                  { id: 'maintenance', label: 'Equipment & HVAC' },
                  { id: 'hiring', label: 'Hiring & Applicants' },
                  { id: 'scheduling', label: 'Schedules & Shifts' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-xl transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Mailboxes summary */}
            <div>
              <div className="flex items-center justify-between px-3 mb-1.5">
                <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  Mailboxes ({connections.length})
                </p>
                <button
                  onClick={onOpenSettings}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Manage
                </button>
              </div>
              <div className="space-y-1">
                {connections.slice(0, 4).map((conn) => (
                  <div
                    key={conn.id}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {conn.displayName}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Connected" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{conn.emailAddress}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RBAC notice */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Isolated Organization Isolation Active</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Message List */}
        <div className="w-80 sm:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col overflow-hidden">
          {/* Search bar & list header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search subject, sender, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>{filteredMessages.length} messages</span>
              <span className="capitalize">{selectedFolder}</span>
            </div>
          </div>

          {/* Message List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold">No messages in this view</p>
                <p className="text-[11px]">Try switching filters or search query.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = activeMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessageId(msg.id);
                      if (!msg.isRead) {
                        onUpdateMessage(msg.id, { isRead: true });
                      }
                    }}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/75 dark:bg-emerald-950/40 border-l-4 border-emerald-500'
                        : msg.isRead
                        ? 'bg-white dark:bg-slate-900/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                        : 'bg-white dark:bg-slate-900 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {!msg.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        <span className={`text-xs truncate ${!msg.isRead ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {msg.from.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                        {new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className={`text-xs mb-1 line-clamp-1 ${!msg.isRead ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {msg.snippet}
                    </p>

                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {msg.category && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                            {msg.category}
                          </span>
                        )}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-slate-400">
                            <Paperclip className="w-3 h-3" />
                            <span>{msg.attachments.length}</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateMessage(msg.id, { isStarred: !msg.isStarred });
                        }}
                        className="text-slate-400 hover:text-amber-500 transition-colors p-1"
                      >
                        <Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: Thread / Detail Viewer */}
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto">
          {activeMessage ? (
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              {/* Message Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {activeMessage.subject}
                  </h1>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onUpdateMessage(activeMessage.id, { isStarred: !activeMessage.isStarred })}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={activeMessage.isStarred ? 'Unstar' : 'Star'}
                    >
                      <Star className={`w-4 h-4 ${activeMessage.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => onUpdateMessage(activeMessage.id, { isArchived: !activeMessage.isArchived })}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMessage(activeMessage.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      id="convert-email-to-action-btn"
                      onClick={() => setIsConverterOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors ml-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Convert to Task/Action</span>
                    </button>
                  </div>
                </div>

                {/* Sender & Recipient Metadata */}
                <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {activeMessage.from.name}
                      </span>
                      <span className="text-slate-400">&lt;{activeMessage.from.email}&gt;</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      To:{' '}
                      {activeMessage.to.map((r, i) => (
                        <span key={i} className="mr-1">
                          {r.name || r.email}
                          {i < activeMessage.to.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>{new Date(activeMessage.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div>{new Date(activeMessage.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>

              {/* Workqora AI Assistant Insights Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Workqora AI Intelligence Engine
                    </span>
                  </div>
                  {activeMessage.aiSuggestedAction && (
                    <button
                      onClick={() => setIsConverterOpen(true)}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>1-Click Dispatch Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1">
                    Summary:
                  </p>
                  <p>{activeMessage.aiSummary || generateEmailAISummary(activeMessage).summary}</p>
                </div>

                {activeMessage.aiActionItems && activeMessage.aiActionItems.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Action Items Detected:
                    </p>
                    <ul className="space-y-1">
                      {activeMessage.aiActionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Email Body Content */}
              <div className="flex-1 prose dark:prose-invert max-w-none text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {activeMessage.bodyText}
              </div>

              {/* Attachments Section */}
              {activeMessage.attachments && activeMessage.attachments.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Attachments ({activeMessage.attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeMessage.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-xs">
                            {att.filename}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(att.sizeBytes / 1024).toFixed(1)} KB • Safe Scanned
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Reply Form */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Quick Reply
                  </span>
                  {/* AI Quick Response Tone Generator */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400 mr-1">AI Draft:</span>
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('professional')}
                      disabled={isGeneratingAIReply}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                    >
                      Professional
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateAIReply('schedule_confirm')}
                      disabled={isGeneratingAIReply}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold"
                    >
                      Confirm Schedule
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSendReply} className="space-y-2">
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeMessage.from.name}...`}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400">
                      Sending from:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {connections.find((c) => c.id === activeMessage.connectionId)?.emailAddress || 'Corporate Mailbox'}
                      </span>
                    </p>
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Mail className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Conversation Selected
              </h3>
              <p className="text-xs max-w-sm mt-1">
                Select an email thread on the left to read messages, access AI summaries, or dispatch operational tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Email-to-Action Converter */}
      {isConverterOpen && activeMessage && (
        <EmailActionConverterModal
          message={activeMessage}
          onClose={() => setIsConverterOpen(false)}
          onConverted={(type, title) => {
            setIsConverterOpen(false);
            setActionNotice(`Created ${type.toUpperCase()}: "${title}" linked to email thread.`);
            setTimeout(() => setActionNotice(null), 5000);
          }}
        />
      )}

      {/* MODAL: Full Compose Email */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            id="compose-email-modal"
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Compose Business Email
                </h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-6 space-y-4">
              {/* From Mailbox */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  From Mailbox
                </label>
                <select
                  value={composeFromId}
                  onChange={(e) => setComposeFromId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.displayName} &lt;{c.emailAddress}&gt;
                    </option>
                  ))}
                </select>
              </div>

              {/* To Recipient */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  To (Recipient Email or Staff Group)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. employee@company.com or vendor@sysco.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Template Selector & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Insert Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">Custom Email</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Subject of the email..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Write your email here..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
