import React, { useState } from 'react';
import { AuthUser, ScreenType } from '../types';
import { OCTOBER_PROGRESS_CHART } from '../data/examData';
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
} from 'lucide-react';

interface DashboardScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
  user?: AuthUser | null;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onSelectScreen, user }) => {
  const profileName = user?.fullName ?? 'Aysel Yusifli';
  const profileInitials = profileName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const profileMeta = user ? `${user.grade}-ci sinif` : '11-ci sinif · Bakı şəhəri';
  const [sidebarItem, setSidebarItem] = useState<string>('panel');
  const [dailyTaskDone, setDailyTaskDone] = useState<boolean>(false);

  // SVG Line Chart points calculation for October 2026 dates
  // Values: 64, 68, 71, 75, 79, 85 on a 0-100 scale
  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = OCTOBER_PROGRESS_CHART.map((d, index) => {
    const x =
      paddingX + (index * (chartWidth - 2 * paddingX)) / (OCTOBER_PROGRESS_CHART.length - 1);
    // Score maps between 50 and 95
    const y = chartHeight - paddingY - ((d.score - 50) / 45) * (chartHeight - 2 * paddingY);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, index) => {
    if (index === 0) return `M ${curr.x} ${curr.y}`;
    // Simple smooth curve bezier
    const prev = points[index - 1];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SLIM LEFT SIDEBAR */}
        <aside className="lg:col-span-3 bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800 shadow-calm flex flex-col justify-between h-fit lg:sticky lg:top-24">
          <div className="space-y-6">
            {/* Student Mini Profile */}
            <div className="flex items-center gap-3 pb-6 border-b border-stone-100 dark:border-stone-800">
              <div className="w-12 h-12 rounded-[14px] bg-brand-soft dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/60 flex items-center justify-center font-bold text-base text-brand-fg dark:text-brand-400">
                {profileInitials}
              </div>
              <div>
                <h2 className="text-base font-bold text-ink dark:text-white leading-tight">
                  {profileName}
                </h2>
                <span className="text-xs text-stone-500 dark:text-stone-400">{profileMeta}</span>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1.5 text-sm font-semibold">
              <button
                onClick={() => setSidebarItem('panel')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  sidebarItem === 'panel'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-surface-dark-alt'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" strokeWidth={1.75} />
                <span>Panel</span>
              </button>

              <button
                onClick={() => onSelectScreen('result')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
                <span>Nəticələr</span>
              </button>

              <button
                onClick={() => onSelectScreen('practice')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <Target className="w-4 h-4" strokeWidth={1.75} />
                <span>Fərdi məşq</span>
              </button>

              <button
                onClick={() => onSelectScreen('dashboard')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
                <span>İnkişaf</span>
              </button>

              <button
                onClick={() => alert('Tənzimləmələr bölməsi')}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-surface-dark-alt transition-all"
              >
                <Settings className="w-4 h-4" strokeWidth={1.75} />
                <span>Tənzimləmələr</span>
              </button>
            </nav>

            {/* Muted "Interview Arena · Tezliklə" item */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400 select-none">
                <span className="font-medium">Interview Arena</span>
                <span className="text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-500 px-1.5 py-0.5 rounded font-semibold">
                  Tezliklə
                </span>
              </div>
            </div>
          </div>

          {/* Quick Help Link */}
          <div className="pt-6 border-t border-stone-100 dark:border-stone-800 mt-6">
            <button
              onClick={() => onSelectScreen('test')}
              className="w-full h-11 rounded-[12px] bg-brand-soft dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-fg dark:text-brand-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>Yeni sınağa başla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="lg:col-span-9 space-y-8">
          {/* GREETING "Salam, {profileName.split(' ')[0]}" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">
                Salam, {profileName.split(' ')[0]}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Bugünkü hədəfinə çatmaq üçün 1 fərdi tapşırıq qalıb. Hazırlıq qrafikin yüksəlir!
              </p>
            </div>

            {/* Streak Counter "5 gün ardıcıl" */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
              <div>
                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 block leading-tight">
                  5 gün ardıcıl
                </span>
                <span className="text-[10px] text-amber-600/80 dark:text-amber-400">
                  Davamiyyət seriyası
                </span>
              </div>
            </div>
          </div>

          {/* FOUR KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* KPI 1: Ümumi nəticə */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800 shadow-calm">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                Ümumi nəticə
              </span>
              <div className="text-3xl font-extrabold text-ink dark:text-white tabular-nums">
                85%
              </div>
              <span className="text-[11px] font-semibold text-sage-600 dark:text-sage-400 mt-1 inline-block">
                +12% son sınaq
              </span>
            </div>

            {/* KPI 2: Həll edilən test */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800 shadow-calm">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                Həll edilən test
              </span>
              <div className="text-3xl font-extrabold text-ink dark:text-white tabular-nums">
                14
              </div>
              <span className="text-[11px] text-stone-400 mt-1 inline-block">280 sual cəmi</span>
            </div>

            {/* KPI 3: Zəif mövzu */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800 shadow-calm">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                Zəif mövzu
              </span>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                3
              </div>
              <span className="text-[11px] text-amber-600/80 dark:text-amber-400 mt-1 inline-block">
                Hədəf məşqdədir
              </span>
            </div>

            {/* KPI 4: Hədəf bal */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800 shadow-calm">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block mb-1">
                Hədəf bal
              </span>
              <div className="text-3xl font-extrabold text-brand-fg dark:text-brand-400 tabular-nums">
                280+
              </div>
              <span className="text-[11px] text-stone-400 mt-1 inline-block">300 baldan</span>
            </div>
          </div>

          {/* TWO COLUMN ROW: INKISAFI QRAFIKI (LINE CHART) & BU GÜN NƏ ET? */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Smooth Line Chart "İnkişaf qrafiki" with October 2026 dates */}
            <div className="lg:col-span-8 bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <h3 className="text-lg font-bold text-ink dark:text-white">İnkişaf qrafiki</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Oktyabr 2026 buraxılış sınaqlarının dinamikası
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-fg dark:text-brand-400">
                    6 sınaq üzrə
                  </span>
                </div>

                {/* SVG Line Chart */}
                <div className="pt-6 pb-2">
                  <div className="w-full overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-48 select-none"
                    >
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--ring)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--ring)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[60, 70, 80].map((val) => {
                        const y =
                          chartHeight - paddingY - ((val - 50) / 45) * (chartHeight - 2 * paddingY);
                        return (
                          <g key={val}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={chartWidth - paddingX}
                              y2={y}
                              stroke="var(--ring-track)"
                              strokeDasharray="4 4"
                              className="dark:stroke-stone-800"
                            />
                            <text
                              x={paddingX - 10}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[10px] fill-stone-400 font-mono"
                            >
                              {val}%
                            </text>
                          </g>
                        );
                      })}

                      {/* Area Fill */}
                      <path d={areaD} fill="url(#chartGradient)" />

                      {/* Smooth Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="var(--ring)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Data Point Dots & Labels */}
                      {points.map((pt, i) => (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="5"
                            className="fill-white dark:fill-surface-dark stroke-brand-fg stroke-[3]"
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 10}
                            textAnchor="middle"
                            className="text-[11px] font-bold fill-stone-800 dark:fill-white font-mono"
                          >
                            {pt.score}%
                          </text>
                          <text
                            x={pt.x}
                            y={chartHeight - 6}
                            textAnchor="middle"
                            className="text-[10px] fill-stone-400 dark:fill-stone-500 font-medium"
                          >
                            {pt.date}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                <span>Başlanğıc: 64% (02 Okt)</span>
                <span className="font-bold text-sage-600 dark:text-sage-400">
                  Cari nəticə: 85% (+21% ümumi sıçrayış)
                </span>
              </div>
            </div>

            {/* CARD "Bu gün nə et?" with one concrete task */}
            <div className="lg:col-span-4 bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-fg" />
                    <h3 className="text-base font-bold text-ink dark:text-white">Bu gün nə et?</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-sage-600 bg-sage-50 dark:bg-sage-950/40 px-2 py-0.5 rounded-full">
                    Gündəlik plan
                  </span>
                </div>

                <div className="pt-4 space-y-4">
                  {/* Concrete Task */}
                  <div
                    onClick={() => setDailyTaskDone(!dailyTaskDone)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      dailyTaskDone
                        ? 'bg-sage-50/80 dark:bg-sage-950/40 border-sage-200 dark:border-sage-900'
                        : 'bg-stone-50 dark:bg-inset-dark border-stone-200/80 dark:border-stone-800 hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-colors ${
                          dailyTaskDone
                            ? 'bg-sage-600 text-white'
                            : 'border-2 border-stone-300 dark:border-stone-700'
                        }`}
                      >
                        {dailyTaskDone && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4
                          className={`text-sm font-bold ${
                            dailyTaskDone
                              ? 'line-through text-stone-400'
                              : 'text-ink dark:text-white'
                          }`}
                        >
                          Tənliklər üzrə 8 sual həll et
                        </h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                          Dünənki sınaqda səhv etdiyin tərəf-tərəfə toplama tipli sualları məşq et.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated time chip */}
                  <div className="p-3 rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100/70 dark:border-brand-900/40 text-xs text-stone-600 dark:text-stone-300 flex items-center justify-between">
                    <span>Təxmini vaxt:</span>
                    <span className="font-bold text-brand-fg dark:text-brand-400">12 dəqiqə</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectScreen('practice')}
                className="w-full h-12 rounded-[12px] bg-brand hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
              >
                <span>Tapşırığa başla</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
