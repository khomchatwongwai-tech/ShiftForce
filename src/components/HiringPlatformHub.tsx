import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/i18n';
import React, { useState } from 'react';
import {
  Globe,
  Share2,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Plus,
  Settings,
  Sparkles,
  Copy,
  Check,
  FileText,
  Briefcase,
  Users,
  Calendar,
  DollarSign,
  Star,
  MapPin,
  Clock,
  Send,
  QrCode,
  ShieldCheck,
  Filter,
  Search,
  TrendingUp,
  AlertCircle,
  Award,
  Zap,
  ArrowRight,
  Eye,
  MessageSquare
} from 'lucide-react';
import {
  HiringPlatformConnection,
  JobOpening,
  HiringSyncLog,
  OnboardingCandidate,
  HiringPlatformId,
  RestaurantRole,
  Department,
  SupportedLanguage
} from '../types';
import {
  INITIAL_HIRING_PLATFORMS,
  INITIAL_JOB_OPENINGS,
  INITIAL_MULTI_SOURCE_APPLICANTS,
  INITIAL_HIRING_SYNC_LOGS,
  generateCraigslistPostContent,
  generateGoogleJobsJsonLd
} from '../data/hiringPlatformData';

interface HiringPlatformHubProps {
  candidates: OnboardingCandidate[];
  onAddCandidate: (candidate: Omit<OnboardingCandidate, 'id' | 'appliedAt'>) => void;
  onUpdateCandidateStage: (id: string, stage: OnboardingCandidate['stage']) => void;
  onSelectCandidateForAI?: (candidate: OnboardingCandidate) => void;
  currentLanguage?: SupportedLanguage;
}

export const HiringPlatformHub: React.FC<HiringPlatformHubProps> = ({
  candidates,
  onAddCandidate,
  onUpdateCandidateStage,
  onSelectCandidateForAI,
}) => {
  const { currentLanguage, t } = useLanguage();

  // State
  const [platforms, setPlatforms] = useState<HiringPlatformConnection[]>(INITIAL_HIRING_PLATFORMS);
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>(INITIAL_JOB_OPENINGS);
  const [syncLogs, setSyncLogs] = useState<HiringSyncLog[]>(INITIAL_HIRING_SYNC_LOGS);
  const [activeSubTab, setActiveSubTab] = useState<'platforms' | 'jobs' | 'applicants' | 'craigslist' | 'logs'>('platforms');

  // Syncing Animation State
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  // Platform Config Modal State
  const [selectedPlatformForConfig, setSelectedPlatformForConfig] = useState<HiringPlatformConnection | null>(null);
  const [editApiKey, setEditApiKey] = useState('');
  const [editWebhook, setEditWebhook] = useState('');
  const [editFrequency, setEditFrequency] = useState<HiringPlatformConnection['syncFrequency']>('instant_webhook');
  const [editAutoImport, setEditAutoImport] = useState(true);
  const [editBudget, setEditBudget] = useState(15);

  // New Job Opening Modal State
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState<Department>('Front of House');
  const [newRole, setNewRole] = useState<RestaurantRole>('Server');
  const [newJobType, setNewJobType] = useState<JobOpening['jobType']>('full_time');
  const [newHourlyMin, setNewHourlyMin] = useState(20);
  const [newHourlyMax, setNewHourlyMax] = useState(24);
  const [newTipEligible, setNewTipEligible] = useState(true);
  const [newLocationName, setNewLocationName] = useState('SF Flagship Bistro & Lounge #104');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState<string[]>(['Valid Food Handler Card', 'Weekend availability']);
  const [newBenefits, setNewBenefits] = useState<string[]>(['Flexible scheduling with Workqora App', 'Daily shift meal']);
  const [newTargetPlatforms, setNewTargetPlatforms] = useState<HiringPlatformId[]>([
    'linkedin', 'indeed', 'craigslist', 'facebook_jobs', 'ziprecruiter', 'snagajob', 'google_jobs'
  ]);
  const [isGeneratingAIJob, setIsGeneratingAIJob] = useState(false);

  // Craigslist Assistant State
  const [selectedCraigslistJobId, setSelectedCraigslistJobId] = useState<string>(INITIAL_JOB_OPENINGS[0]?.id || 'job-1');
  const [copiedCraigslist, setCopiedCraigslist] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);

  // Applicant Filter State
  const [applicantPlatformFilter, setApplicantPlatformFilter] = useState<string>('all');
  const [applicantSearch, setApplicantSearch] = useState('');
  const [selectedJobPreview, setSelectedJobPreview] = useState<JobOpening | null>(null);
  const [qrCodeModalJob, setQrCodeModalJob] = useState<JobOpening | null>(null);

  // Calculate Metrics
  const totalActiveJobs = jobOpenings.filter(j => j.status === 'active').length;
  const totalInboundApplicants = candidates.length + INITIAL_MULTI_SOURCE_APPLICANTS.length;
  const connectedPlatformCount = platforms.filter(p => p.status === 'connected').length;

  // Combine unified candidates from prop & multi-source presets
  const unifiedApplicants = React.useMemo(() => {
    const existingIds = new Set(candidates.map(c => c.id));
    const merged = [...candidates];
    INITIAL_MULTI_SOURCE_APPLICANTS.forEach(app => {
      if (!existingIds.has(app.id)) {
        merged.push(app);
      }
    });
    return merged;
  }, [candidates]);

  // Filtered applicants
  const filteredApplicants = React.useMemo(() => {
    return unifiedApplicants.filter(cand => {
      if (applicantPlatformFilter !== 'all') {
        if (applicantPlatformFilter === 'other' && cand.sourcePlatform) return false;
        if (cand.sourcePlatform !== applicantPlatformFilter) return false;
      }
      if (applicantSearch.trim()) {
        const query = applicantSearch.toLowerCase();
        const matchesName = cand.name.toLowerCase().includes(query);
        const matchesRole = cand.role.toLowerCase().includes(query);
        const matchesDept = cand.department.toLowerCase().includes(query);
        const matchesSnippet = cand.resumeSnippet?.toLowerCase().includes(query);
        if (!matchesName && !matchesRole && !matchesDept && !matchesSnippet) return false;
      }
      return true;
    });
  }, [unifiedApplicants, applicantPlatformFilter, applicantSearch]);

  // Trigger 1-Click Multi-Platform Sync
  const handleSyncAllPlatforms = () => {
    setIsSyncingAll(true);
    setPlatforms(prev => prev.map(p => ({ ...p, status: 'syncing' })));

    setTimeout(() => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setPlatforms(prev => prev.map(p => ({
        ...p,
        status: 'connected',
        lastSyncedAt: now,
        inboundApplicantsCount: p.inboundApplicantsCount + Math.floor(Math.random() * 2) + 1,
      })));

      // Add a simulated sync log
      const newLog: HiringSyncLog = {
        id: `log-${Date.now()}`,
        platformId: 'linkedin',
        timestamp: now + ':00',
        type: 'status_synced',
        message: 'Omni-Sync Complete: Synchronized 9 connected hiring platforms. Fetched 3 new applications from LinkedIn, Indeed, and Craigslist.',
        status: 'success'
      };
      setSyncLogs(prev => [newLog, ...prev]);

      setIsSyncingAll(false);
      setSyncSuccessToast('All 9 hiring web platforms synchronized successfully! Webhooks and candidate feeds are live.');
      setTimeout(() => setSyncSuccessToast(null), 4000);
    }, 1200);
  };

  // Simulate Instant Inbound Webhook from specific platform
  const handleSimulateInboundWebhook = (platformId: HiringPlatformId) => {
    const platform = platforms.find(p => p.id === platformId) || platforms[0];
    const firstNames = ['Camila', 'Trevor', 'Darius', 'Mei-Ling', 'Lucas', 'Nadia', 'Hannah', 'Dante'];
    const lastNames = ['Rodriguez', 'O\'Connor', 'Bennett', 'Zhang', 'Silva', 'Kowalski', 'Miller', 'Romano'];
    const roles: RestaurantRole[] = ['Lead Bartender', 'Line Cook', 'Server', 'Host / Hostess', 'Prep Cook'];

    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomDept: Department = randomRole.includes('Cook') ? 'Back of House' : (randomRole.includes('Bar') ? 'Bar & Beverage' : 'Front of House');
    const randomScore = Math.floor(Math.random() * 15) + 85;

    const candidate: Omit<OnboardingCandidate, 'id' | 'appliedAt'> = {
      name: `${randomFirst} ${randomLast}`,
      email: `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@${platformId}-candidate.com`,
      phone: `+1 (555) ${Math.floor(Math.random() * 899 + 100)}-${Math.floor(Math.random() * 8999 + 1000)}`,
      role: randomRole,
      department: randomDept,
      stage: 'applied',
      sourcePlatform: platformId,
      sourceJobTitle: `${randomRole} Position`,
      resumeSnippet: `Inbound application from ${platform.name}. 3+ years restaurant hospitality experience with verified references.`,
      yearsExperience: Math.floor(Math.random() * 4) + 2,
      certificationsSummary: ['Food Handler Card', 'Hospitality Service'],
      aiMatchScore: randomScore,
      hourlyWageExpectation: 22.0,
      documents: {
        i9Verified: false,
        foodHandlerCertified: true,
        alcoholCardCertified: randomDept === 'Bar & Beverage' || randomRole === 'Server',
        directDeposit: false,
        uniformAssigned: false,
      }
    };

    onAddCandidate(candidate);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const log: HiringSyncLog = {
      id: `log-${Date.now()}`,
      platformId: platformId,
      timestamp: now,
      type: 'webhook_received',
      message: `Inbound Webhook from ${platform.name}: New applicant ${candidate.name} received for ${candidate.role} (AI Match: ${randomScore}%).`,
      candidateName: candidate.name,
      jobTitle: `${candidate.role}`,
      status: 'success'
    };
    setSyncLogs(prev => [log, ...prev]);

    setSyncSuccessToast(`New candidate ${candidate.name} imported instantly from ${platform.name}!`);
    setTimeout(() => setSyncSuccessToast(null), 4000);
  };

  // AI Job Description Generator
  const handleGenerateAIJobDescription = () => {
    setIsGeneratingAIJob(true);
    setTimeout(() => {
      const generatedDesc = `Workqora Flagship Bistro & Lounge is looking for an exceptional ${newRole} to join our high-energy ${newDepartment} team.
We pride ourselves on culinary excellence, warm neighborhood hospitality, and a supportive team environment where every employee is valued.
In this role, you will be a core contributor to our daily service, ensuring seamless operations, pristine standards, and delighted guests.`;

      const reqs = [
        `2+ years experience as a ${newRole} in a high-volume restaurant or hospitality venue`,
        newDepartment === 'Bar & Beverage' || newRole === 'Server'
          ? 'Valid California RBS (Responsible Beverage Service) & ServSafe Food Handler certification'
          : 'Valid ServSafe Food Handler Card (or obtained within 30 days)',
        'Positive hospitality mindset with strong teamwork and communication skills',
        'Weekend, evening, and holiday rush availability'
      ];

      const perks = [
        `Competitive base wage of $${newHourlyMin.toFixed(2)} - $${newHourlyMax.toFixed(2)}/hr ${newTipEligible ? '+ generous tip share' : ''}`,
        'Predictive 7-day scheduling via Workqora Mobile App with 1-click shift swaps',
        'Daily family meal prepared fresh by our Executive Chef',
        'Comprehensive health, dental, and vision insurance for 30+ hrs/wk',
        '50% employee discount at all Workqora restaurant properties nationwide'
      ];

      setNewDescription(generatedDesc);
      setNewRequirements(reqs);
      setNewBenefits(perks);
      setIsGeneratingAIJob(false);
    }, 600);
  };

  // Save New Job Opening
  const handleSaveJobOpening = (e: React.FormEvent) => {
    e.preventDefault();
    const createdJob: JobOpening = {
      id: `job-${Date.now()}`,
      title: newTitle || `${newRole} (${newDepartment})`,
      department: newDepartment,
      role: newRole,
      jobType: newJobType,
      hourlyMin: newHourlyMin,
      hourlyMax: newHourlyMax,
      tipEligible: newTipEligible,
      locationName: newLocationName,
      description: newDescription || `Seeking an energetic ${newRole} for our ${newDepartment} team.`,
      requirements: newRequirements,
      benefits: newBenefits,
      targetPlatforms: newTargetPlatforms,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      viewsCount: 1,
      applicantsCount: 0,
      shortlistedCount: 0,
      directApplyCode: `APPLY-${newRole.toUpperCase().slice(0, 4)}-${Math.floor(Math.random() * 899 + 100)}`,
      urgency: 'urgent_hire'
    };

    setJobOpenings(prev => [createdJob, ...prev]);

    // Add broadcast sync log
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const log: HiringSyncLog = {
      id: `log-${Date.now()}`,
      platformId: newTargetPlatforms[0] || 'linkedin',
      timestamp: now,
      type: 'job_broadcasted',
      message: `Omni-Broadcast: Published "${createdJob.title}" to ${newTargetPlatforms.length} job platforms (${newTargetPlatforms.join(', ')}).`,
      jobTitle: createdJob.title,
      status: 'success'
    };
    setSyncLogs(prev => [log, ...prev]);

    setIsNewJobModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setSyncSuccessToast(`Job opening "${createdJob.title}" broadcasted across ${newTargetPlatforms.length} hiring platforms!`);
    setTimeout(() => setSyncSuccessToast(null), 4000);
  };

  // Open Platform Config Modal
  const handleOpenPlatformConfig = (platform: HiringPlatformConnection) => {
    setSelectedPlatformForConfig(platform);
    setEditApiKey(platform.apiKeyMasked || '');
    setEditWebhook(platform.webhookEndpoint || '');
    setEditFrequency(platform.syncFrequency);
    setEditAutoImport(platform.autoImportApplicants);
    setEditBudget(platform.dailySponsorshipBudget || 15);
  };

  // Save Platform Config
  const handleSavePlatformConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatformForConfig) return;

    setPlatforms(prev => prev.map(p => {
      if (p.id === selectedPlatformForConfig.id) {
        return {
          ...p,
          apiKeyMasked: editApiKey,
          webhookEndpoint: editWebhook,
          syncFrequency: editFrequency,
          autoImportApplicants: editAutoImport,
          dailySponsorshipBudget: editBudget,
          status: 'connected',
          lastSyncedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
      }
      return p;
    }));

    setSelectedPlatformForConfig(null);
    setSyncSuccessToast(`Integration settings saved for ${selectedPlatformForConfig.name}. Webhook active.`);
    setTimeout(() => setSyncSuccessToast(null), 3000);
  };

  // Get Platform Badge Info
  const getPlatformBadge = (platformId?: HiringPlatformId) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) {
      return {
        name: 'Direct / In-Store QR',
        color: '#475569',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
      };
    }
    return {
      name: platform.name.split('(')[0].trim(),
      color: platform.brandColor,
      badgeBg: platform.badgeBg,
      badgeText: platform.badgeText,
    };
  };

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {syncSuccessToast && (
        <div className="fixed bottom-6 right-6 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 z-50 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-100">Hiring Hub Sync Update</h4>
            <p className="text-xs text-slate-300 mt-0.5">{syncSuccessToast}</p>
          </div>
          <button onClick={() => setSyncSuccessToast(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
        </div>
      )}

      {/* Main Hub Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full flex items-center gap-1.5 shadow-xs">
                <Globe className="w-3.5 h-3.5" />
                Omni-Channel Recruitment Engine
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                9 Platforms Active &amp; Synced
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hiring Web Platform Integration Hub
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Seamlessly link and broadcast open restaurant roles across <strong className="text-white">LinkedIn</strong>, <strong className="text-white">Indeed</strong>, <strong className="text-white">Craigslist</strong>, <strong className="text-white">Facebook Jobs</strong>, <strong className="text-white">ZipRecruiter</strong>, <strong className="text-white">Snagajob</strong>, <strong className="text-white">Culinary Agents</strong>, and <strong className="text-white">Google for Jobs</strong>. Inbound applications sync straight into your Workqora ATS &amp; Onboarding roster.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Broadcast New Job Opening</span>
            </button>
            <button
              onClick={handleSyncAllPlatforms}
              disabled={isSyncingAll}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin text-indigo-300' : ''}`} />
              <span>{isSyncingAll ? 'Syncing All Platforms...' : 'Sync All Feeds Now'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-indigo-800/50">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-indigo-300 font-medium block">Connected Platforms</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">{connectedPlatformCount} / {platforms.length}</span>
              <span className="text-[10px] text-emerald-400 font-bold">100% Live</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-indigo-300 font-medium block">Active Job Broadcasts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">{totalActiveJobs}</span>
              <span className="text-[10px] text-indigo-300 font-medium">Roles Open</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-indigo-300 font-medium block">Inbound Multi-Source Applicants</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{totalInboundApplicants}</span>
              <span className="text-[10px] text-emerald-300 font-medium">+8 today</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <span className="text-[11px] text-indigo-300 font-medium block">Estimated Talent Reach</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-white">48.5K+</span>
              <span className="text-[10px] text-indigo-300 font-medium">Hospitality Seekers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveSubTab('platforms')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'platforms' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>Connected Platforms ({platforms.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('jobs')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'jobs' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Job Openings &amp; Broadcaster ({jobOpenings.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('applicants')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'applicants' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unified Applicant Inbox ({filteredApplicants.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('craigslist')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'craigslist' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Craigslist &amp; SEO Assistant</span>
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'logs' ? 'bg-white text-indigo-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Live Webhooks &amp; Sync Activity</span>
          </button>
        </div>

        {/* Quick action: Simulate Inbound */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Simulate intake:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSimulateInboundWebhook('linkedin')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 border border-[#0077B5]/30 rounded-lg transition-colors cursor-pointer"
              title="Simulate inbound application from LinkedIn"
            >
              + LinkedIn
            </button>
            <button
              onClick={() => handleSimulateInboundWebhook('indeed')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#2164f3]/10 text-[#2164f3] hover:bg-[#2164f3]/20 border border-[#2164f3]/30 rounded-lg transition-colors cursor-pointer"
              title="Simulate inbound application from Indeed"
            >
              + Indeed
            </button>
            <button
              onClick={() => handleSimulateInboundWebhook('craigslist')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#551a8b]/10 text-[#551a8b] hover:bg-[#551a8b]/20 border border-[#551a8b]/30 rounded-lg transition-colors cursor-pointer"
              title="Simulate inbound application from Craigslist"
            >
              + Craigslist
            </button>
            <button
              onClick={() => handleSimulateInboundWebhook('facebook_jobs')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 border border-[#1877F2]/30 rounded-lg transition-colors cursor-pointer"
              title="Simulate inbound application from Facebook Jobs"
            >
              + Meta
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- 1. CONNECTED PLATFORMS VIEW ---------------- */}
      {activeSubTab === 'platforms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Integrated Job Boards &amp; Candidate Portals</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any platform to configure API credentials, webhook endpoints, and auto-import settings.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">Status: All Webhooks Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Brand Color Indicator Bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: platform.brandColor }}
                />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {platform.category}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-0.5 group-hover:text-indigo-600 transition-colors">
                        {platform.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {platform.tagline}
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-1 pt-1">
                    {platform.features.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats & Sync Info */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Active Openings</span>
                      <span className="font-black text-slate-900">{platform.activePostingsCount} Live</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Inbound Applicants</span>
                      <span className="font-black text-indigo-600">{platform.inboundApplicantsCount} Received</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 truncate">
                    Last sync: {platform.lastSyncedAt?.slice(11) || 'Live'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSimulateInboundWebhook(platform.id)}
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
                      title="Test Webhook with a simulated candidate intake"
                    >
                      Test Intake
                    </button>
                    <button
                      onClick={() => handleOpenPlatformConfig(platform)}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Config</span>
                    </button>
                    <a
                      href={platform.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Open platform portal"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 2. JOB OPENINGS & MULTI-BROADCASTER ---------------- */}
      {activeSubTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-600" />
                <span>Active Restaurant Job Openings &amp; Distribution Feeds</span>
              </h3>
              <p className="text-xs text-slate-500">
                1-click push to LinkedIn, Indeed, Craigslist, Facebook Jobs, ZipRecruiter, Snagajob, and Google for Jobs.
              </p>
            </div>

            <button
              onClick={() => setIsNewJobModalOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job Opening</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {jobOpenings.map((job) => (
              <div key={job.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-3">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-slate-900">{job.title}</h4>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded-md">
                        {job.department}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md uppercase">
                        {job.jobType.replace('_', ' ')}
                      </span>
                      {job.urgency === 'urgent_hire' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 rounded-md animate-pulse">
                          🔥 Urgent Hire
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                      <span className="font-semibold text-emerald-700">
                        💰 ${job.hourlyMin.toFixed(2)} - ${job.hourlyMax.toFixed(2)} / hr {job.tipEligible && '+ Tips'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {job.locationName}
                      </span>
                      <span className="text-slate-400">
                        Posted {job.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQrCodeModalJob(job)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Print In-Store Window QR Flyer & Direct Apply Link"
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      <span>QR &amp; Direct Apply</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCraigslistJobId(job.id);
                        setActiveSubTab('craigslist');
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Craigslist post formatting"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-700" />
                      <span>Craigslist Text</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {job.description}
                </p>

                {/* Broadcasted Platforms Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Broadcasting on:
                    </span>
                    {job.targetPlatforms.map((pid) => {
                      const b = getPlatformBadge(pid);
                      return (
                        <span
                          key={pid}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${b.badgeBg} ${b.badgeText} border border-slate-200 flex items-center gap-1`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                          {b.name}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span>👁️ {job.viewsCount} views</span>
                    <span className="font-bold text-indigo-700">📥 {job.applicantsCount} applicants</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- 3. UNIFIED APPLICANT INBOX (ATS) ---------------- */}
      {activeSubTab === 'applicants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Unified Multi-Source Applicant Pipeline</span>
              </h3>
              <p className="text-xs text-slate-500">
                All candidate applications from LinkedIn, Indeed, Craigslist, Facebook Jobs, ZipRecruiter, and Google for Jobs automatically centralized here.
              </p>
            </div>

            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={applicantSearch}
                  onChange={(e) => setApplicantSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <select
                value={applicantPlatformFilter}
                onChange={(e) => setApplicantPlatformFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">All Sources ({unifiedApplicants.length})</option>
                <option value="linkedin">LinkedIn</option>
                <option value="indeed">Indeed</option>
                <option value="craigslist">Craigslist</option>
                <option value="facebook_jobs">Facebook Jobs</option>
                <option value="ziprecruiter">ZipRecruiter</option>
                <option value="snagajob">Snagajob</option>
                <option value="culinary_agents">Culinary Agents</option>
                <option value="google_jobs">Google for Jobs</option>
              </select>
            </div>
          </div>

          {/* Applicants Card List */}
          <div className="space-y-3">
            {filteredApplicants.map((cand) => {
              const platformBadge = getPlatformBadge(cand.sourcePlatform);
              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900">{cand.name}</span>
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md">
                          {cand.role} ({cand.department})
                        </span>

                        {/* Source Platform Badge */}
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${platformBadge.badgeBg} ${platformBadge.badgeText} border border-slate-200 flex items-center gap-1`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: platformBadge.color }} />
                          {platformBadge.name}
                        </span>

                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                          Stage: {cand.stage.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>📧 {cand.email}</span>
                        <span>📞 {cand.phone}</span>
                        <span>📅 Applied {cand.appliedAt}</span>
                        {cand.yearsExperience && (
                          <span className="font-semibold text-slate-700">💼 {cand.yearsExperience} yrs exp</span>
                        )}
                      </div>
                    </div>

                    {/* AI Match Score Badge & Actions */}
                    <div className="flex items-center gap-3">
                      {cand.aiMatchScore && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">AI Match Score</span>
                          <span className="text-base font-black text-emerald-600 flex items-center gap-0.5 justify-end">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            {cand.aiMatchScore}%
                          </span>
                        </div>
                      )}

                      {onSelectCandidateForAI && (
                        <button
                          onClick={() => onSelectCandidateForAI(cand)}
                          className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>AI Interview Prep</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resume Snippet & Certifications */}
                  {cand.resumeSnippet && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700">
                      <p className="leading-relaxed italic">"{cand.resumeSnippet}"</p>

                      {cand.certificationsSummary && cand.certificationsSummary.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Verified:</span>
                          {cand.certificationsSummary.map((cert, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-semibold">
                              ✓ {cert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage Workflow Progression Controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Update Stage:</span>
                      <div className="flex items-center gap-1">
                        {(['applied', 'interview_scheduled', 'offer_sent', 'onboarding'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => onUpdateCandidateStage(cand.id, st)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                              cand.stage === st
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {st === 'interview_scheduled' ? 'Interview' : st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {cand.externalProfileUrl && (
                      <a
                        href={cand.externalProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <span>View on {platformBadge.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredApplicants.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No applicants found matching filter</h4>
                <p className="text-xs text-slate-500">
                  Try switching the source filter or click "+ LinkedIn" / "+ Indeed" at the top to simulate live intake.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- 4. CRAIGSLIST & LOCAL CLASSIFIEDS ASSISTANT ---------------- */}
      {activeSubTab === 'craigslist' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Craigslist &amp; Local Classifieds Posting Assistant
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
                  Food / Beverage / Hospitality
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates anti-spam compliant, high-converting formatted text with wage transparency and direct 1-click mobile apply redirect links for Craigslist local boards.
              </p>
            </div>

            {/* Select Target Job */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Select Role:</span>
              <select
                value={selectedCraigslistJobId}
                onChange={(e) => setSelectedCraigslistJobId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                {jobOpenings.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Formatted Preview Box */}
          {(() => {
            const currentJob = jobOpenings.find(j => j.id === selectedCraigslistJobId) || jobOpenings[0];
            const postContent = currentJob ? generateCraigslistPostContent(currentJob) : '';
            const jsonLdContent = currentJob ? generateGoogleJobsJsonLd(currentJob) : '';

            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      Craigslist Formatted Post (Plain Text / ASCII Optimized)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(postContent);
                          setCopiedCraigslist(true);
                          setTimeout(() => setCopiedCraigslist(false), 2500);
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        {copiedCraigslist ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCraigslist ? 'Copied to Clipboard!' : 'Copy Craigslist Text'}</span>
                      </button>
                      <a
                        href="https://sfbay.craigslist.org/d/food-beverage-hospitality/search/fbh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <span>Open Craigslist SF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto border border-slate-800 shadow-inner">
                    {postContent}
                  </pre>
                </div>

                {/* Google for Jobs Schema SEO JSON-LD */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Google for Jobs Structured Data (Schema.org/JobPosting JSON-LD)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(jsonLdContent);
                        setCopiedJsonLd(true);
                        setTimeout(() => setCopiedJsonLd(false), 2500);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedJsonLd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedJsonLd ? 'JSON-LD Copied!' : 'Copy Schema Code'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-50 text-slate-800 rounded-2xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto border border-slate-200">
                    {jsonLdContent}
                  </pre>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ---------------- 5. LIVE WEBHOOKS & SYNC ACTIVITY FEED ---------------- */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Real-Time Hiring Webhook Ingestion &amp; Distribution Log</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Stream: Connected</span>
          </div>

          <div className="divide-y divide-slate-100">
            {syncLogs.map((log) => {
              const platformBadge = getPlatformBadge(log.platformId);
              return (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${platformBadge.badgeBg} ${platformBadge.badgeText}`}>
                          {platformBadge.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-slate-800 font-medium mt-0.5">{log.message}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                    {log.type.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- MODAL: CREATE NEW JOB OPENING ---------------- */}
      {isNewJobModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Broadcast New Restaurant Job Opening
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly publish to LinkedIn, Indeed, Craigslist, Facebook Jobs, ZipRecruiter &amp; Google for Jobs.
                </p>
              </div>
              <button
                onClick={() => setIsNewJobModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJobOpening} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Bartender & Mixologist"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role Type</label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as RestaurantRole;
                      setNewRole(r);
                      if (r.includes('Cook') || r.includes('Chef')) setNewDepartment('Back of House');
                      else if (r.includes('Bartender') || r.includes('Barback')) setNewDepartment('Bar & Beverage');
                      else if (r.includes('Prep') || r.includes('Dishwasher')) setNewDepartment('Kitchen Prep & Dish');
                      else setNewDepartment('Front of House');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="Server">Server</option>
                    <option value="Head Server">Head Server</option>
                    <option value="Lead Bartender">Lead Bartender</option>
                    <option value="Bartender">Bartender</option>
                    <option value="Barback">Barback</option>
                    <option value="Line Cook">Line Cook</option>
                    <option value="Sous Chef">Sous Chef</option>
                    <option value="Head Chef">Head Chef</option>
                    <option value="Prep Cook">Prep Cook</option>
                    <option value="Host / Hostess">Host / Hostess</option>
                    <option value="Dishwasher">Dishwasher</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Hourly ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newHourlyMin}
                    onChange={(e) => setNewHourlyMin(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Hourly ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={newHourlyMax}
                    onChange={(e) => setNewHourlyMax(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tip Eligible?</label>
                  <select
                    value={newTipEligible ? 'yes' : 'no'}
                    onChange={(e) => setNewTipEligible(e.target.value === 'yes')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium cursor-pointer"
                  >
                    <option value="yes">Yes (+ Tip Pool)</option>
                    <option value="no">No (Base Wage Only)</option>
                  </select>
                </div>
              </div>

              {/* Target Platforms Checkboxes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Broadcast to Platforms:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {platforms.map((p) => {
                    const isChecked = newTargetPlatforms.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/70 border-indigo-300 font-bold text-indigo-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setNewTargetPlatforms(prev =>
                              isChecked ? prev.filter(x => x !== p.id) : [...prev, p.id]
                            );
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{p.name.split('(')[0].trim()}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* AI Description Generator Button */}
              <div className="flex items-center justify-between pt-1">
                <label className="font-bold text-slate-700">Job Description &amp; Requirements</label>
                <button
                  type="button"
                  onClick={handleGenerateAIJobDescription}
                  disabled={isGeneratingAIJob}
                  className="px-2.5 py-1 text-[11px] font-bold bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  <span>{isGeneratingAIJob ? 'Generating AI Post...' : 'Generate with Gemini AI'}</span>
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="Describe responsibilities, team culture, and shifts..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium leading-relaxed"
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewJobModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Broadcast Job Opening</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: CONFIGURE PLATFORM INTEGRATION ---------------- */}
      {selectedPlatformForConfig && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs"
                  style={{ backgroundColor: selectedPlatformForConfig.brandColor }}
                >
                  {selectedPlatformForConfig.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedPlatformForConfig.name} Configuration
                  </h3>
                  <p className="text-xs text-slate-500">API Credentials &amp; Auto-Intake Webhooks</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlatformForConfig(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatformConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">API Key / Token</label>
                <input
                  type="text"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder="Enter API Key or OAuth Secret"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Webhook Endpoint URL</label>
                <input
                  type="url"
                  value={editWebhook}
                  onChange={(e) => setEditWebhook(e.target.value)}
                  placeholder="https://api.workqora.com/webhooks/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sync Cadence</label>
                  <select
                    value={editFrequency}
                    onChange={(e) => setEditFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold cursor-pointer"
                  >
                    <option value="instant_webhook">Instant Webhook (Live)</option>
                    <option value="every_15m">Every 15 Minutes</option>
                    <option value="hourly">Hourly Polling</option>
                    <option value="manual">Manual Sync Only</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Daily Sponsor Budget ($)</label>
                  <input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAutoImport}
                  onChange={(e) => setEditAutoImport(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">
                  Automatically import new applicants directly into Workqora ATS
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlatformForConfig(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  Save Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL: QR CODE & DIRECT APPLY LINK ---------------- */}
      {qrCodeModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-base text-slate-900">
                In-Store Window &amp; Mobile Apply QR Code
              </h3>
              <button onClick={() => setQrCodeModalJob(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600">{qrCodeModalJob.title}</span>
              <p className="text-xs text-slate-500">Scan to apply directly on mobile in under 60 seconds</p>
            </div>

            {/* Generated QR Code Artifice */}
            <div className="w-48 h-48 mx-auto bg-slate-950 p-3 rounded-2xl shadow-inner flex flex-col items-center justify-center space-y-2 text-white">
              <QrCode className="w-28 h-28 text-white" />
              <span className="text-[10px] font-mono tracking-widest text-indigo-300">
                {qrCodeModalJob.directApplyCode}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 truncate">
              https://workqora.com/apply/{qrCodeModalJob.directApplyCode}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://workqora.com/apply/${qrCodeModalJob.directApplyCode}`);
                  setSyncSuccessToast('Direct application link copied to clipboard!');
                  setTimeout(() => setSyncSuccessToast(null), 3000);
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Copy Apply Link
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Print Flyer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};