import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowRight,
  Code2,
  Coffee,
  Globe,
  BarChart3,
  ShieldCheck,
  Flame,
  Calendar,
  Clock,
  ChevronRight,
  BookOpen,
  Target,
  Compass,
} from 'lucide-react';
import { TARGET_ROLES, getReadinessBadge } from '../utils/interview';
import { InterviewSession } from '../utils/interview';
import { UserStats, isDailyChallengeCompleted } from '../utils/storage';
import { DailyChallengeData, fetchDailyChallenge } from '../utils/api';

interface DashboardViewProps {
  stats: UserStats;
  recentSessions: InterviewSession[];
  onStartRoleInterview: (roleId: string) => void;
  onOpenMockConfig: () => void;
  onViewSessionDetails: (session: InterviewSession) => void;
  onNavigateToTab: (tab: 'hr-practice' | 'tech-practice' | 'star-guide' | 'history') => void;
  onStartDailyPractice: (challenge: DailyChallengeData) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentSessions,
  onStartRoleInterview,
  onOpenMockConfig,
  onViewSessionDetails,
  onNavigateToTab,
  onStartDailyPractice,
}) => {
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeData | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [dailyDone, setDailyDone] = useState(false);

  useEffect(() => {
    setDailyDone(isDailyChallengeCompleted());
    setLoadingChallenge(true);
    fetchDailyChallenge()
      .then((data) => setDailyChallenge(data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingChallenge(false));
  }, []);

  const readiness = getReadinessBadge(stats.averageScore);

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-5 h-5 text-blue-600" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-cyan-600" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5 text-emerald-600" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-rose-600" />;
      default:
        return <Code2 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-7 sm:p-10 lg:p-12 shadow-sm border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 tracking-wide uppercase mb-3">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Campus Placements & IT Recruitment Prep</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-normal">TCS, Infosys, Wipro, Startups</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.15]">
            Ace Your Campus Placements & IT Job Interviews
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-7 max-w-2xl">
            Simulate realistic technical and HR interview rounds with Google Gemini AI. Receive objective scoring, competency breakdowns across 5 skill criteria, and actionable improvement feedback.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenMockConfig}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:translate-y-[-1px]"
            >
              <Target className="w-4 h-4" />
              <span>Start Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToTab('star-guide')}
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-semibold text-xs sm:text-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>STAR Method Guide</span>
            </button>

            <button
              onClick={() => onNavigateToTab('hr-practice')}
              className="inline-flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-semibold text-xs sm:text-sm transition-all"
            >
              <span>Practice HR Questions</span>
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Mock Sessions
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.totalSessions}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-slate-700 tabular-nums">{stats.totalQuestionsAnswered}</span> questions answered
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {stats.averageScore > 0 ? stats.averageScore : '—'}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 10</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Peak performance: <span className="font-semibold text-slate-800 tabular-nums">{stats.highestScore || 0}/10</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Placement Readiness
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {stats.totalSessions > 0 ? readiness.label : 'Benchmark Required'}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {stats.totalSessions > 0 ? readiness.description : 'Complete a mock to assess level'}
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Practice Streak
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {stats.streakDays} <span className="text-xs font-semibold text-slate-500">days</span>
            </div>
            <p className="text-xs text-amber-700 font-medium mt-1">
              {dailyDone ? '✓ Today\'s practice done' : 'Practice today to maintain streak'}
            </p>
          </div>
        </div>
      </section>

      {/* Question of the Day Banner */}
      {dailyChallenge && (
        <section className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px]">
                  Daily Practice Challenge
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700">{dailyChallenge.role}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">~{dailyChallenge.timeEstimateMinutes} mins</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                "{dailyChallenge.question}"
              </h3>
              <p className="text-xs text-slate-600">
                <strong className="text-slate-800">Recruiter context:</strong> {dailyChallenge.context}
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => onStartDailyPractice(dailyChallenge)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Answer & Get Feedback</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Target Roles Section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Target Job Role Tracks
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Select a target profile to calibrate questions to the exact technical stack and assessment format.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TARGET_ROLES.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    {getRoleIcon(role.icon)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Fresher / Experienced
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                  {role.name}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {role.description}
                </p>

                {/* Recruiters unboxed text */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Hiring: </span>
                    {role.popularCompanies.join(' · ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">Topics: </span>
                    {role.defaultTopics.join(' · ')}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3">
                <button
                  onClick={() => onStartRoleInterview(role.id)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold border border-slate-200 hover:border-slate-900 transition-all"
                >
                  <span>Practice {role.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* HR & Behavioral Spotlight Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between shadow-xs border border-slate-800">
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Behavioral & Cultural Fit</span>
              </div>
              <h3 className="font-bold text-lg text-white">HR Question Bank</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Master crucial questions: "Tell me about yourself", "Academic gap justification", "Relocation & shift flexibility", and conflict resolution.
              </p>
              <div className="mt-4 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>STAR method guidance & model answers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Real Indian IT placement prompts</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('hr-practice')}
              className="mt-5 w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
            >
              <span>Explore HR Question Bank</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Recent Practice Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Recent Practice Sessions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Review evaluations, scores, and areas where AI suggested improvements.
            </p>
          </div>
          {recentSessions.length > 0 && (
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No mock interviews completed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first 5-question AI mock interview to establish your baseline score and get personalized improvement tips.
            </p>
            <button
              onClick={onOpenMockConfig}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Your First Interview</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {recentSessions.slice(0, 4).map((session) => {
              const sessionDate = new Date(session.startedAt).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const evalCount = session.evaluations?.length || 0;
              const scoreBadge = getReadinessBadge(session.overallScore);

              return (
                <div
                  key={session.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">
                        {session.role}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {session.interviewType}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {session.experienceLevel}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      <span>{sessionDate}</span>
                      <span className="mx-1.5">·</span>
                      <span className="tabular-nums">{evalCount}</span> questions evaluated
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <div className="flex items-baseline space-x-1 sm:justify-end">
                        <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                          {session.overallScore}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">/ 10</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600">
                        {scoreBadge.label}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewSessionDetails(session)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <span>Review Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
