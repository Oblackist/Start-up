import React, { useEffect, useMemo, useState } from 'react';
import type { ScreenType } from '../types';
import type { Progress } from '../types';
import {
  LayoutDashboard,
  BarChart3,
  Target,
  TrendingUp,
  Settings,
  Flame,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { ApiErrorClass, getMyProgress } from '../lib/api';
import { useAuth } from '../lib/auth';

interface DashboardScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

/**
 * Dashboard screen wired to GET /api/v1/me/progress. For a new user with no
 * attempts, every array is empty — we render honest empty states with a CTA
 * to start the first test.
 */
export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onSelectScreen }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyTaskDone, setDailyTaskDone] = useState<boolean>(false);
  const [sidebarItem, setSidebarItem] = useState<string>('panel');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProgress();
        if (!cancelled) setProgress(p);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiErrorClass
              ? err.message
              : 'İnkişaf məlumatlarını yükləmək mümkün olmadı.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const userName = user?.name || 'Şagird';
  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user?.name]);

  // Line chart computation (uses backend progress_chart if present).
  const chart = useMemo(() => {
    const points =
      progress && progress.progress_chart.length > 0
        ? progress.progress_chart
        : [];
    if (points.length === 0) return null;
    const chartWidth = 600;
    const chartHeight = 180;
    const paddingX = 40;
    const paddingY = 25;
    const minScore = Math.min(...points.map((p) => p.score), 50);
    const maxScore = Math.max(...points.map((p) => p.score), 95);
    const span = Math.max(1, maxScore - minScore);
    const coords = points.map((p, i) => ({
      x: paddingX + (i * (chartWidth - 2 * paddingX)) / Math.max(1, points.length - 1),
      y: chartHeight - paddingY - ((p.score - minScore) / span) * (chartHeight - 2 * paddingY),
      ...p,
    }));
    const pathD = coords.reduce((acc, curr, i) => {
      if (i === 0) return `M ${curr.x} ${curr.y}`;
      const prev = coords[i - 1];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }, '');
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`;
    const gridVals = [
      Math.round(minScore),
      Math.round((minScore + maxScore) / 2),
      Math.round(maxScore),
    ];
    return {
      coords,
      pathD,
      areaD,
      chartWidth,
      chartHeight,
      paddingX,
      paddingY,
      minScore,
      maxScore,
      span,
      gridVals,
    };
  }, [progress]);

  const totalAttempts = progress?.subjects.reduce(
    (acc, s) => acc + (s.completed_questions > 0 ? 1 : 0),
    0,
  ) ?? 0;
  const weakTopicCount = progress?.weak_topics.length ?? 0;
  const avgReadiness =
    progress && progress.subjects.length > 0
      ? Math.round(
          progress.subjects.reduce((a, s) => a + s.readiness_score, 0) /
            progress.subjects.length,
        )
      : 0;

  // Loading skeleton.
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <div className="h-10 w-1/3 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
          <div className="h-72 rounded-[20px] bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state.
  if (error || !progress) {
    return (
      <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-[1440px] mx-auto">
          <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                Məlumatları yükləmək alınmadı
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 break-words">
                {error}
              </p>
              <button
                onClick={() => onSelectScreen('subjects')}
                className="mt-4 h-10 px-4 rounded-[12px] bg-brand hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                Fənlərə keç
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty =
    progress.subjects.every((s) => s.completed_questions === 0) &&
    progress.weak_topics.length === 0 &&
    progress.saved_mistakes.length === 0 &&
    progress.progress_chart.length === 0;

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SLIM LEFT SIDEBAR */}
        <aside className="lg:col-span-3 bg-white dark:bg-surface-dark rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-calm flex flex-col justify-between h-fit lg:sticky lg:top-24 min-w-0">
          <div className="space-y-6 min-w-0">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800 min-w-0">
              <div className="w-12 h-12 rounded-[14px] bg-brand-soft dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center font-bold text-base text-brand dark:text-blue-400 shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <h2
                  className="text-base font-bold text-navy dark:text-white leading-tight break-words"
                  title={userName}
                >
                  {userName}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 break-words">
                  {user?.email}
                </span>
              </div>
            </div>

            <nav className="space-y-1.5 text-sm font-semibold">
              <button
                onClick={() => setSidebarItem('panel')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  sidebarItem === 'panel'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />
                <span>Panel</span>
              </button>

              <button
                onClick={() => onSelectScreen('result')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
                <span>Nəticələr</span>
              </button>

              <button
                onClick={() => onSelectScreen('practice')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <Target className="w-4 h-4" strokeWidth={1.75} />
                <span>Fərdi məşq</span>
              </button>

              <button
                onClick={() => onSelectScreen('dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
                <span>İnkişaf</span>
              </button>

              {/* Settings button activated to open ProfileScreen */}
              <button
                onClick={() => {
                  setSidebarItem('profile');
                  onSelectScreen('profile' as ScreenType);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  sidebarItem === 'profile'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt'
                }`}
              >
                <Settings className="w-4 h-4" strokeWidth={1.75} />
                <span>Tənzimləmələr</span>
              </button>
            </nav>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 select-none">
                <span className="font-medium">Interview Arena</span>
                <span className="text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                  Tezliklə
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <button
              onClick={() => onSelectScreen('test')}
              className="w-full h-11 rounded-[12px] bg-brand-soft dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-brand dark:text-blue-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>Yeni sınağa başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="lg:col-span-9 space-y-8 min-w-0">
          {/* GREETING */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold text-navy dark:text-white tracking-tight break-words">
                Salam, {userName.split(' ')[0]}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isEmpty
                  ? 'İlk sınağını verərək hazırlığa başla.'
                  : 'Hazırlıq qrafikinə nəzər sal və zəif mövzuları məşq et.'}
              </p>
            </div>

            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div>
                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 block leading-tight">
                  {totalAttempts} sınaq verilib
                </span>
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400">
                  Ümumi göstərici
                </span>
              </div>
            </div>
          </div>

          {/* FOUR KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-calm min-w-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Ümumi nəticə
              </span>
              <div className="text-3xl font-extrabold text-navy dark:text-white tabular-nums">
                {avgReadiness}%
              </div>
              <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 mt-1 inline-block">
                {progress.subjects.length > 0 ? 'fənn üzrə orta' : 'məlumat yox'}
              </span>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-calm min-w-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Həll edilən test
              </span>
              <div className="text-3xl font-extrabold text-navy dark:text-white tabular-nums">
                {totalAttempts}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                {progress.subjects.reduce((a, s) => a + s.completed_questions, 0)} sual cəmi
              </span>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-calm min-w-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Zəif mövzu
              </span>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                {weakTopicCount}
              </div>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400 mt-1 inline-block">
                {weakTopicCount > 0 ? 'Hədəf məşqdədir' : 'yox'}
              </span>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-calm min-w-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Saxlanmış səhv
              </span>
              <div className="text-3xl font-extrabold text-brand dark:text-blue-400 tabular-nums">
                {progress.saved_mistakes.length}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">arxivdə</span>
            </div>
          </div>

          {/* EMPTY STATE for new users */}
          {isEmpty && (
            <div className="bg-white dark:bg-surface-dark rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-calm text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft dark:bg-blue-950/60 flex items-center justify-center text-brand dark:text-blue-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-navy dark:text-white">
                Hələ imtahan verməmisən
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                İlk sınağını verərək hazırlıq səviyyəni ölç. Sistem sənin zəif
                mövzularını tapıb fərdi məşq planı hazırlayacaq.
              </p>
              <button
                onClick={() => onSelectScreen('subjects')}
                className="mt-6 h-12 px-6 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-sm inline-flex items-center gap-2"
              >
                <span>İlk sınağa başla</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TWO COLUMN ROW: LINE CHART & DAILY TASK */}
          {!isEmpty && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* LINE CHART */}
              <div className="lg:col-span-8 bg-white dark:bg-surface-dark rounded-[20px] p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-calm flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-navy dark:text-white">
                        İnkişaf qrafiki
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sınaqların dinamikası
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-brand dark:text-blue-400 shrink-0">
                      {progress.progress_chart.length} sınaq
                    </span>
                  </div>

                  {chart ? (
                    <div className="pt-6 pb-2 w-full overflow-x-auto min-w-0">
                      <svg
                        viewBox={`0 0 ${chart.chartWidth} ${chart.chartHeight}`}
                        className="w-full h-48 select-none"
                      >
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {chart.gridVals.map((val, i) => {
                          const y =
                            chart.chartHeight -
                            chart.paddingY -
                            ((val - chart.minScore) / chart.span) *
                              (chart.chartHeight - 2 * chart.paddingY);
                          return (
                            <g key={i}>
                              <line
                                x1={chart.paddingX}
                                y1={y}
                                x2={chart.chartWidth - chart.paddingX}
                                y2={y}
                                stroke="#E2E8F0"
                                strokeDasharray="4 4"
                                className="dark:stroke-slate-800"
                              />
                              <text
                                x={chart.paddingX - 10}
                                y={y + 3}
                                textAnchor="end"
                                className="text-[10px] fill-slate-400 font-mono"
                              >
                                {val}%
                              </text>
                            </g>
                          );
                        })}

                        <path d={chart.areaD} fill="url(#chartGradient)" />
                        <path
                          d={chart.pathD}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {chart.coords.map((pt, i) => (
                          <g key={i}>
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="5"
                              className="fill-white dark:fill-surface-dark stroke-brand stroke-[3]"
                            />
                            <text
                              x={pt.x}
                              y={pt.y - 10}
                              textAnchor="middle"
                              className="text-[11px] font-bold fill-slate-800 dark:fill-white font-mono"
                            >
                              {pt.score}%
                            </text>
                            <text
                              x={pt.x}
                              y={chart.chartHeight - 6}
                              textAnchor="middle"
                              className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
                            >
                              {pt.date}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                      Henüz qrafik üçün kifayət qədər məlumat yığılmayıb.
                    </p>
                  )}
                </div>

                {chart && chart.coords.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
                    <span className="break-words">
                      Başlanğıc: {chart.coords[0].score}% ({chart.coords[0].date})
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">
                      Cari: {chart.coords[chart.coords.length - 1].score}%
                    </span>
                  </div>
                )}
              </div>

              {/* DAILY TASK CARD */}
              <div className="lg:col-span-4 bg-white dark:bg-surface-dark rounded-[20px] p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-calm flex flex-col justify-between space-y-6 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-brand shrink-0" />
                      <h3 className="text-base font-bold text-navy dark:text-white">
                        Bu gün nə et?
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full shrink-0">
                      Gündəlik plan
                    </span>
                  </div>

                  <div className="pt-4 space-y-4 min-w-0">
                    <div
                      onClick={() => setDailyTaskDone(!dailyTaskDone)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer min-w-0 ${
                        dailyTaskDone
                          ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900'
                          : 'bg-slate-50 dark:bg-[#0E172A] border-slate-200/80 dark:border-slate-800 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                            dailyTaskDone
                              ? 'bg-teal-600 text-white'
                              : 'border-2 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {dailyTaskDone && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className={`text-sm font-bold break-words ${
                              dailyTaskDone
                                ? 'line-through text-slate-400'
                                : 'text-navy dark:text-white'
                            }`}
                          >
                            {weakTopicCount > 0
                              ? `${progress.weak_topics[0].name} üzrə məşq et`
                              : 'Yeni sınaq verərək hazırlığını ölç'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words">
                            {weakTopicCount > 0
                              ? 'Zəif mövzular üzrə fərdi məşqlə hazırlığını yüksəlt.'
                              : 'Hər sınaq daha dəqiq fərdi plan yaradır.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100/70 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 min-w-0">
                      <span>Tövsiyə:</span>
                      <span className="font-bold text-brand dark:text-blue-400 shrink-0">
                        {weakTopicCount > 0 ? '10–15 dəqiqə' : '20 dəqiqə'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectScreen('practice')}
                  className="w-full h-12 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Tapşırığa başla</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* WEAK TOPICS / SAVED MISTAKES (if present) */}
          {(weakTopicCount > 0 || progress.saved_mistakes.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {weakTopicCount > 0 && (
                <div className="lg:col-span-6 bg-white dark:bg-surface-dark rounded-[20px] p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-calm space-y-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500 shrink-0" />
                    <h3 className="text-lg font-bold text-navy dark:text-white">
                      Zəif mövzular
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {progress.weak_topics.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 min-w-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white break-words">
                              {t.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.accuracy}% dəqiqlik · {t.mistake_count} səhv · {t.subject}
                          </p>
                        </div>
                        <button
                          onClick={() => onSelectScreen('practice')}
                          className="text-xs font-bold text-brand dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Məşq</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {progress.saved_mistakes.length > 0 && (
                <div className="lg:col-span-6 bg-white dark:bg-surface-dark rounded-[20px] p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-calm space-y-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand shrink-0" />
                    <h3 className="text-lg font-bold text-navy dark:text-white">
                      Saxlanılan səhvlər
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {progress.saved_mistakes.slice(0, 4).map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 space-y-1 min-w-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-brand dark:text-blue-400 break-words">
                            {m.subject} · {m.topic}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">{m.date}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 break-words">
                          "{m.question_preview}"
                        </p>
                        <div className="text-[11px] flex items-center gap-3 flex-wrap">
                          <span className="text-red-500">Sənin: {m.user_answer}</span>
                          <span className="text-teal-600 font-semibold">
                            Doğru: {m.correct_answer}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
