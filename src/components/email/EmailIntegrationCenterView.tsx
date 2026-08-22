import React, { useState } from 'react';
import {
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  Server,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check
} from 'lucide-react';
import {
  BusinessEmailConnection,
  EmailAuditEvent,
  Location,
  CustomRole
} from '../../types';

interface EmailIntegrationCenterViewProps {
  connections: BusinessEmailConnection[];
  auditLogs: EmailAuditEvent[];
  locations: Location[];
  currentRole: CustomRole | null;
  onAddConnection: (conn: Partial<BusinessEmailConnection>) => void;
  onUpdateConnection: (id: string, updates: Partial<BusinessEmailConnection>) => void;
  onDeleteConnection: (id: string) => void;
  onSyncConnection: (id: string) => void;
}

export const EmailIntegrationCenterView: React.FC<EmailIntegrationCenterViewProps> = ({
  connections,
  auditLogs,
  locations,
  currentRole,
  onAddConnection,
  onUpdateConnection,
  onDeleteConnection,
  onSyncConnection
}) => {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'providers' | 'audit' | 'security'>('accounts');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // New Connection Form State
  const [newProvider, setNewProvider] = useState<'google' | 'microsoft' | 'imap_smtp'>('google');
  const [newScopeLevel, setNewScopeLevel] = useState<'organization' | 'region' | 'location' | 'department'>('location');
  const [newLocationId, setNewLocationId] = useState<string>(locations[0]?.id || 'loc-sf-flagship');
  const [newDisplayName, setNewDisplayName] = useState<string>('');
  const [newEmailAddress, setNewEmailAddress] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'operations' | 'general' | 'manager' | 'hiring' | 'inventory'>('general');
  const [newImapHost, setNewImapHost] = useState<string>('imap.mailservice.com');
  const [newImapPort, setNewImapPort] = useState<number>(993);
  const [newSmtpHost, setNewSmtpHost] = useState<string>('smtp.mailservice.com');
  const [newSmtpPort, setNewSmtpPort] = useState<number>(587);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSync = (id: string) => {
    setSyncingId(id);
    onSyncConnection(id);
    setTimeout(() => {
      setSyncingId(null);
      setSuccessBanner('Mailbox synchronized successfully.');
      setTimeout(() => setSuccessBanner(null), 3500);
    }, 1000);
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsConnectModalOpen(false);

      const targetLoc = locations.find((l) => l.id === newLocationId);

      onAddConnection({
        organizationId: 'org-workqora-primary',
        scopeLevel: newScopeLevel,
        locationId: newScopeLevel === 'location' || newScopeLevel === 'department' ? newLocationId : undefined,
        provider: newProvider,
        emailAddress: newEmailAddress || (newProvider === 'google' ? 'store@workqora.com' : 'contact@workqora.com'),
        displayName: newDisplayName || (targetLoc ? `${targetLoc.name} Mailbox` : 'Workqora Business Mailbox'),
        category: newCategory,
        connectionStatus: 'connected',
        scopes: newProvider === 'google'
          ? ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']
          : newProvider === 'microsoft'
          ? ['Mail.Read', 'Mail.Send', 'User.Read']
          : ['IMAP', 'SMTP'],
        imapHost: newProvider === 'imap_smtp' ? newImapHost : undefined,
        imapPort: newProvider === 'imap_smtp' ? newImapPort : undefined,
        smtpHost: newProvider === 'imap_smtp' ? newSmtpHost : undefined,
        smtpPort: newProvider === 'imap_smtp' ? newSmtpPort : undefined,
        autoSyncIntervalMinutes: 15,
        lastSyncedAt: new Date().toISOString()
      });

      setSuccessBanner(`Connected business email account (${newEmailAddress || 'New Account'}).`);
      setTimeout(() => setSuccessBanner(null), 4000);

      // Reset form
      setNewDisplayName('');
      setNewEmailAddress('');
      setNewUsername('');
      setNewPassword('');
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      {successBanner && (
        <div className="flex items-center justify-between px-6 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-white/80 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Header Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Business Email Integration Center
              </h2>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                OAuth 2.0 PKCE Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Connect Google Workspace, Microsoft 365, and IMAP/SMTP accounts per Organization, Region, or Location.
            </p>
          </div>
        </div>

        <button
          id="connect-email-account-btn"
          onClick={() => setIsConnectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Email Account</span>
        </button>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'accounts'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Connected Accounts ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'providers'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Supported Providers & Scopes
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Security & Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: Connected Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((conn) => {
              const isSyncing = syncingId === conn.id;
              const location = locations.find((l) => l.id === conn.locationId);

              return (
                <div
                  key={conn.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header with scope and status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          conn.scopeLevel === 'organization'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : conn.scopeLevel === 'region'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {conn.scopeLevel}
                        </span>
                        {conn.isDefaultOrgSender && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Default Org Sender
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                          {conn.connectionStatus}
                        </span>
                      </div>
                    </div>

                    {/* Account Name & Email */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {conn.displayName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {conn.emailAddress}
                      </p>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        Provider: {conn.provider === 'google' ? 'Google Workspace' : conn.provider === 'microsoft' ? 'Microsoft 365' : 'IMAP/SMTP'}
                      </span>
                      {location && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          📍 {location.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with Last Sync & Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {conn.lastSyncedAt
                        ? `Synced ${new Date(conn.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never synced'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={isSyncing}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Sync Now"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
                      </button>
                      <button
                        onClick={() => onDeleteConnection(conn.id)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 transition-colors"
                        title="Disconnect Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Supported Providers & Scopes */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-lg">
              G
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Workspace & Gmail
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Direct OAuth 2.0 PKCE authentication with Gmail API for enterprise operations and location mailboxes.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>gmail.readonly & gmail.send</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted Refresh Token Rotation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Google Cloud Pub/Sub Webhook Sync</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-lg">
              M
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Microsoft 365 & Exchange
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enterprise Microsoft Graph integration supporting Exchange Online mailboxes and shared department inboxes.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mail.Read & Mail.Send scopes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Azure AD Tenant Isolation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>MS Graph Delta Sync API</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Custom IMAP / SMTP
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Universal email protocol connection for custom corporate domains, cPanel, Fastmail, or on-premise mail servers.
              </p>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>TLS / SSL encrypted transport</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Custom IMAP/SMTP port mapping</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Automated Polling intervals</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs & Security */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Enterprise Email Audit Trail
            </h3>
            <span className="text-xs text-slate-400">
              Immutable security event logs
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.action}
                    </span>
                    <span className="text-slate-400">• {log.actorName} ({log.actorRole})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">{log.details}</p>
                </div>
                <div className="text-right shrink-0 text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Connect Account */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div
            id="connect-account-modal"
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Connect Business Email Account
              </h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="p-6 space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Service Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProvider('google')}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      newProvider === 'google'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-base text-red-500">G</span>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProvider('microsoft')}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      newProvider === 'microsoft'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-base text-blue-500">M</span>
                    <span>Microsoft 365</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProvider('imap_smtp')}
                    className={`p-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      newProvider === 'imap_smtp'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Server className="w-5 h-5" />
                    <span>IMAP / SMTP</span>
                  </button>
                </div>
              </div>

              {/* Hierarchy Scope */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hierarchy Scope
                  </label>
                  <select
                    value={newScopeLevel}
                    onChange={(e: any) => setNewScopeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="organization">🏢 Organization (Corporate)</option>
                    <option value="region">🌎 Region</option>
                    <option value="location">📍 Location / Store</option>
                    <option value="department">🏷️ Department / Team</option>
                  </select>
                </div>
                {(newScopeLevel === 'location' || newScopeLevel === 'department') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Location
                    </label>
                    <select
                      value={newLocationId}
                      onChange={(e) => setNewLocationId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Display Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SF Flagship General Mailbox"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. store104@company.com"
                    value={newEmailAddress}
                    onChange={(e) => setNewEmailAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* IMAP/SMTP Custom Config if applicable */}
              {newProvider === 'imap_smtp' && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        IMAP Server Host
                      </label>
                      <input
                        type="text"
                        value={newImapHost}
                        onChange={(e) => setNewImapHost(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        IMAP Port
                      </label>
                      <input
                        type="number"
                        value={newImapPort}
                        onChange={(e) => setNewImapPort(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        SMTP Server Host
                      </label>
                      <input
                        type="text"
                        value={newSmtpHost}
                        onChange={(e) => setNewSmtpHost(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={newSmtpPort}
                        onChange={(e) => setNewSmtpPort(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Authenticating...'
                  ) : (
                    <>
                      <span>Authorize & Connect Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
