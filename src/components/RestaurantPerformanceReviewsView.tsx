import React, { useState } from 'react';
import { 
  Star, 
  Award, 
  Sparkles, 
  MessageSquare, 
  ThumbsUp, 
  Heart, 
  Flame, 
  Rocket, 
  Camera, 
  Share2, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  ChefHat, 
  GlassWater, 
  Clock, 
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Users
} from 'lucide-react';
import { 
  GuestReview, 
  RestaurantPerformanceScore, 
  Employee,
  Announcement
} from '../types';

interface RestaurantPerformanceReviewsViewProps {
  performanceScore: RestaurantPerformanceScore;
  reviews: GuestReview[];
  setReviews: React.Dispatch<React.SetStateAction<GuestReview[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onPostCelebrationToCommunity: (announcement: Partial<Announcement>) => void;
  portal?: 'admin' | 'employee';
}

export const RestaurantPerformanceReviewsView: React.FC<RestaurantPerformanceReviewsViewProps> = ({
  performanceScore,
  reviews,
  setReviews,
  employees,
  setEmployees,
  onPostCelebrationToCommunity,
  portal = 'admin'
}) => {
  const [selectedReviewForSnapshot, setSelectedReviewForSnapshot] = useState<GuestReview>(reviews[0]);
  const [snapshotTheme, setSnapshotTheme] = useState<'gold' | 'neon' | 'emerald' | 'sunset'>('gold');
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiHeadline, setAiHeadline] = useState<string>('⭐ 5-Star Excellence: Flawless Dining Hospitality!');
  const [aiCaption, setAiCaption] = useState<string>(
    'Big applause to Elena and Chef Marcus! Recognized by verified Google diner for impeccable hospitality and exquisite dry-aged ribeye.'
  );
  const [kudosToAward, setKudosToAward] = useState<number>(50);
  const [postSuccessToast, setPostSuccessToast] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');

  const filteredReviews = reviews.filter(r => {
    if (filterSource === 'all') return true;
    return r.source === filterSource;
  });

  const handleGenerateAISnapshot = async (review: GuestReview) => {
    setSelectedReviewForSnapshot(review);
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/review-snapshot-celebration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review }),
      });
      const data = await res.json();
      if (data.headline) setAiHeadline(data.headline);
      if (data.celebrationCaption) setAiCaption(data.celebrationCaption);
      if (data.kudosAwarded) setKudosToAward(data.kudosAwarded);
    } catch (e) {
      console.warn('AI fallback for snapshot:', e);
      setAiHeadline(`⭐ 5-Star Recognition on ${review.source.toUpperCase()}!`);
      setAiCaption(`Warmest congratulations to ${review.mentionedEmployeeNames.join(' & ')} for delivering outstanding guest service!`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handlePostToCommunityAndAwardKudos = (review: GuestReview) => {
    // 1. Award Kudos to mentioned employees
    if (review.mentionedEmployeeNames && review.mentionedEmployeeNames.length > 0) {
      setEmployees(prev => prev.map(emp => {
        if (review.mentionedEmployeeNames.includes(emp.name)) {
          return {
            ...emp,
            kudosPoints: (emp.kudosPoints || 120) + kudosToAward,
            fiveStarMentionCount: (emp.fiveStarMentionCount || 0) + 1
          };
        }
        return emp;
      }));
    }

    // 2. Mark review as posted
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, postedToCommunity: true } : r));

    // 3. Post to Announcements / Community Wall
    onPostCelebrationToCommunity({
      title: aiHeadline,
      content: `${aiCaption}\n\n🏆 Guest Review (${review.source.toUpperCase()} - ${review.rating}★):\n"${review.reviewText}"\n\n🎉 +${kudosToAward} Kudos awarded to ${review.mentionedEmployeeNames.join(', ') || 'the entire team'}!`,
      department: 'All Staff (FOH & BOH)',
      priority: 'high',
      isCommunityPost: true,
      reviewSnapshot: {
        reviewId: review.id,
        reviewerName: review.reviewerName,
        rating: review.rating,
        source: review.source,
        reviewText: review.reviewText,
        highlightQuote: review.reviewText.slice(0, 120),
        celebrationBadge: '5-Star Hospitality Champion',
        kudosAwarded: kudosToAward,
        mentionedStaff: review.mentionedEmployeeNames,
        theme: snapshotTheme,
      }
    });

    setPostSuccessToast(`Celebration snapshot posted to Community Wall & ${kudosToAward} Kudos awarded!`);
    setTimeout(() => setPostSuccessToast(null), 4000);
  };

  const getThemeStyles = (theme: 'gold' | 'neon' | 'emerald' | 'sunset') => {
    switch (theme) {
      case 'gold':
        return {
          container: 'bg-gradient-to-br from-amber-950 via-yellow-900 to-amber-900 border-amber-500/50 text-amber-50',
          badge: 'bg-amber-400 text-amber-950 font-bold',
          stars: 'text-amber-300 fill-amber-300',
          accent: 'text-amber-300',
          card: 'bg-amber-950/60 border-amber-500/30'
        };
      case 'neon':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 border-purple-500/50 text-purple-50',
          badge: 'bg-purple-500 text-white font-bold',
          stars: 'text-yellow-400 fill-yellow-400',
          accent: 'text-pink-400',
          card: 'bg-purple-950/60 border-purple-500/30'
        };
      case 'emerald':
        return {
          container: 'bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 border-emerald-500/50 text-emerald-50',
          badge: 'bg-emerald-400 text-emerald-950 font-bold',
          stars: 'text-yellow-300 fill-yellow-300',
          accent: 'text-emerald-300',
          card: 'bg-emerald-950/60 border-emerald-500/30'
        };
      case 'sunset':
        return {
          container: 'bg-gradient-to-br from-rose-950 via-orange-950 to-amber-950 border-orange-500/50 text-orange-50',
          badge: 'bg-orange-400 text-orange-950 font-bold',
          stars: 'text-yellow-300 fill-yellow-300',
          accent: 'text-orange-300',
          card: 'bg-orange-950/60 border-orange-500/30'
        };
    }
  };

  const themeStyle = getThemeStyles(snapshotTheme);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast banner */}
      {postSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-emerald-100 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{postSuccessToast}</span>
        </div>
      )}

      {/* Header Banner & Live Performance Score */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-amber-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Main Score Block */}
          <div className="space-y-2 lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                Live Guest Reputation & Quality Score
              </span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Top 1% in Hospitality Index
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Restaurant Performance: <span className="text-amber-400">{performanceScore.overallScore}/100</span>
              <span className="text-lg px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl font-mono">
                Grade {performanceScore.grade}
              </span>
            </h1>

            <p className="text-sm text-slate-300 max-w-2xl">
              Real-time sentiment aggregated from Google Maps, Yelp Elite, OpenTable, and in-house dining feedback. 5-star reviews automatically generate social celebration snapshots to reward your staff.
            </p>
          </div>

          {/* Quick Platform Ratings Pill */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Verified Platforms</span>
              <span>{performanceScore.totalReviewsCount} Total Reviews</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">G</span>
                  <span className="text-xs font-bold text-slate-200">Google</span>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-300" /> {performanceScore.googleRating}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">Y</span>
                  <span className="text-xs font-bold text-slate-200">Yelp</span>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-300" /> {performanceScore.yelpRating}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white text-[10px] font-bold">OT</span>
                  <span className="text-xs font-bold text-slate-200">OpenTable</span>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-300" /> {performanceScore.openTableRating}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">TA</span>
                  <span className="text-xs font-bold text-slate-200">TripAdvisor</span>
                </div>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-300" /> {performanceScore.tripAdvisorRating}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core Restaurant Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hospitality Delight</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{performanceScore.hospitalityScore}/100</p>
          <span className="text-[11px] text-emerald-600 font-medium">99.2% positive sentiment</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Food & Drink Quality</span>
            <ChefHat className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{performanceScore.foodQualityScore}/100</p>
          <span className="text-[11px] text-emerald-600 font-medium">Ribeye & Old Fashioned top</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Alcohol RBS / Safety</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-700">{performanceScore.alcoholAndFoodSafetyComplianceScore}%</p>
          <span className="text-[11px] text-emerald-600 font-medium">100% certified bartenders</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Labor Cost Control</span>
            <DollarSign className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{performanceScore.laborEfficiencyScore}/100</p>
          <span className="text-[11px] text-sky-600 font-medium">28.6% vs 30% target</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Team Morale & Kudos</span>
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{performanceScore.teamMoraleScore}/100</p>
          <span className="text-[11px] text-pink-600 font-medium">840 Kudos points earned</span>
        </div>
      </div>

      {/* Main Section: 5-Star Screenshot Spotlight Studio & Live Review Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / TOP STUDIO: 5-Star Screenshot Snapshot Studio (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" />
                  5-Star Review Snapshot & Celebration Studio
                </h3>
                <p className="text-xs text-slate-500">
                  Generate visual celebration cards to post to the Community Wall and award staff Kudos points.
                </p>
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['gold', 'neon', 'emerald', 'sunset'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setSnapshotTheme(t)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer ${
                      snapshotTheme === t
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* THE VISUAL SNAPSHOT CARD */}
            <div className={`p-6 sm:p-8 rounded-2xl border-2 shadow-2xl space-y-6 relative overflow-hidden transition-all duration-300 ${themeStyle.container}`}>
              {/* Background watermark badge */}
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <Star className="w-48 h-48 fill-current" />
              </div>

              {/* Top Snapshot Bar */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-white uppercase">
                      ShiftForce Bistro & Bar
                    </h4>
                    <span className="text-[10px] text-white/70">Verified 5-Star Diner Experience</span>
                  </div>
                </div>

                <span className={`px-3 py-1 text-xs rounded-full shadow-xs ${themeStyle.badge}`}>
                  ⭐ 5.0 Star Guest Spotlight
                </span>
              </div>

              {/* Stars & Highlighted Quote */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${themeStyle.stars}`} />
                  ))}
                  <span className="ml-2 text-xs font-bold text-white/90">
                    via {selectedReviewForSnapshot.source.toUpperCase()}
                  </span>
                </div>

                <blockquote className="text-base sm:text-lg font-semibold italic text-white leading-relaxed">
                  "{selectedReviewForSnapshot.reviewText}"
                </blockquote>
              </div>

              {/* Staff Mentions & Kudos Stamp */}
              <div className={`p-4 rounded-xl border backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 ${themeStyle.card}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {selectedReviewForSnapshot.reviewerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Review by {selectedReviewForSnapshot.reviewerName}</p>
                    <p className="text-[11px] text-white/70">{selectedReviewForSnapshot.date}</p>
                  </div>
                </div>

                {selectedReviewForSnapshot.mentionedEmployeeNames.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/80">Recognized Staff:</span>
                    {selectedReviewForSnapshot.mentionedEmployeeNames.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-lg border border-white/20">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Award Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white/80 relative z-10">
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-300" />
                  Hospitality Excellence Award
                </span>
                <span className="font-mono font-bold text-white">
                  +{kudosToAward} Team Kudos Points
                </span>
              </div>
            </div>

            {/* AI Caption & Publish Action Controls */}
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Community Post Headline & Caption</span>
                  <button
                    onClick={() => handleGenerateAISnapshot(selectedReviewForSnapshot)}
                    disabled={isGeneratingAI}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    {isGeneratingAI ? 'Regenerating AI...' : 'Regenerate with ShiftForce AI'}
                  </button>
                </label>
                <input
                  type="text"
                  value={aiHeadline}
                  onChange={(e) => setAiHeadline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
                <textarea
                  rows={2}
                  value={aiCaption}
                  onChange={(e) => setAiCaption(e.target.value)}
                  className="w-full p-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Bonus Kudos Award:</span>
                  {[25, 50, 100].map(points => (
                    <button
                      key={points}
                      onClick={() => setKudosToAward(points)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        kudosToAward === points
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      +{points} Kudos
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePostToCommunityAndAwardKudos(selectedReviewForSnapshot)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post Snapshot to Community & Award Kudos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / REVIEW FEED: Live Google & Yelp Review Stream (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Review Stream</h3>
                <p className="text-xs text-slate-500">Google, Yelp, and OpenTable verified reviews</p>
              </div>

              {/* Source Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['all', 'google', 'yelp', 'opentable'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterSource(s)}
                    className={`px-2 py-0.5 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                      filterSource === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Reviews */}
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredReviews.map(review => {
                const isSelected = review.id === selectedReviewForSnapshot.id;
                return (
                  <div
                    key={review.id}
                    onClick={() => handleGenerateAISnapshot(review)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                          review.source === 'google' ? 'bg-blue-600' : review.source === 'yelp' ? 'bg-red-600' : 'bg-rose-600'
                        }`}>
                          {review.source.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{review.reviewerName}</p>
                          <p className="text-[10px] text-slate-400">{review.date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 line-clamp-3 italic">
                      "{review.reviewText}"
                    </p>

                    {/* Mentions & Dish Tags */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {review.mentionedEmployeeNames.map((name, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded-md">
                            👤 {name}
                          </span>
                        ))}
                        {review.highlightDishes?.map((dish, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-md">
                            🍽️ {dish}
                          </span>
                        ))}
                      </div>

                      {review.postedToCommunity ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Shared in Community
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 hover:underline">
                          Create Snapshot →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Kudos Leaderboard & Alcohol / Food Safety Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Kudos Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Staff Kudos & 5-Star Recognition Leaderboard
              </h3>
              <p className="text-xs text-slate-500">Kudos points earned from guest compliments and peer recognition</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {employees.slice(0, 5).map((emp, index) => (
              <div key={emp.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    index === 1 ? 'bg-slate-200 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {emp.name}
                      {emp.fiveStarMentionCount && emp.fiveStarMentionCount > 0 ? (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold">
                          ⭐ {emp.fiveStarMentionCount} mentions
                        </span>
                      ) : null}
                    </h4>
                    <p className="text-[11px] text-slate-500">{emp.role} • {emp.department}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-amber-600">{emp.kudosPoints || 120}</span>
                  <span className="text-[11px] text-slate-400 block">Kudos Points</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alcohol Handler RBS & Food Safety Compliance Monitor */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                State Alcohol Handler (RBS/TIPS) & ServSafe Compliance
              </h3>
              <p className="text-xs text-slate-500">Active verification status across Front of House and Bar staff</p>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              100% Compliant
            </span>
          </div>

          <div className="space-y-2.5">
            {employees.filter(e => e.alcoholHandlerCard || e.foodHandlerCard).slice(0, 5).map(emp => (
              <div key={emp.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                  <p className="text-[11px] text-slate-500">{emp.role}</p>
                </div>

                <div className="flex items-center gap-2 text-right">
                  {emp.alcoholHandlerCard && (
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded-full border border-purple-200 block">
                        🍷 RBS: {emp.alcoholHandlerCard.state} ({emp.alcoholHandlerCard.status})
                      </span>
                      <span className="text-[9px] text-slate-400">Exp: {emp.alcoholHandlerCard.expirationDate}</span>
                    </div>
                  )}

                  {emp.foodHandlerCard && (
                    <div className="text-right">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 block">
                        🥗 ServSafe ({emp.foodHandlerCard.status})
                      </span>
                      <span className="text-[9px] text-slate-400">Exp: {emp.foodHandlerCard.expirationDate}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
