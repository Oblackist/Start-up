import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  Crown,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Target,
  Percent,
  Flame,
} from 'lucide-react';
import type { ScreenType } from '../types';
import type { LeaderboardEntry, LeaderboardPage } from '../types';
import { ApiErrorClass, getLeaderboard } from '../lib/api';

interface LeaderboardScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

const PER_PAGE = 20;

const TABS: { id: string; label: string }[] = [
  { id: '', label: 'Hamısı' },
  { id: 'math', label: 'Riyaziyyat' },
  { id: 'aze', label: 'Azərbaycan dili' },
  { id: 'eng', label: 'İngilis dili' },
];

/** Soft, deterministic avatar palette (light/dark pairs) keyed by user id. */
const AVATAR_COLORS: { bg: string; text: string }[] = [
  { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-600 dark:text-blue-300' },
  { bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-600 dark:text-teal-300' },
  { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-300' },
  { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-300' },
  { bg: 'bg-violet-50 dark:bg-violet-950/60', text: 'text-violet-600 dark:text-violet-300' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-300' },
];

function avatarFor(userId: number): { bg: string; text: string } {
  return AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' });
  } catch {
    return '—';
  }
}

function accuracyColor(acc: number): string {
  if (acc >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (acc >= 70) return 'text-blue-600 dark:text-blue-400';
  if (acc >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Rank medal/accent tokens for the top three — restrained by design: a soft
 * tinted surface + a rank badge, no glow/gradients (per the design brief).
 */
const PODIUM: Record<number, { wrap: string; badge: string; label: string }> = {
  1: {
    wrap: 'border-amber-300/70 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    label: '1-ci yer',
  },
  2: {
    wrap: 'border-slate-300/70 dark:border-slate-600/40 bg-slate-50/70 dark:bg-slate-800/40',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    label: '2-ci yer',
  },
  3: {
    wrap: 'border-orange-300/60 dark:border-orange-700/40 bg-orange-50/50 dark:bg-orange-950/20',
    badge: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    label: '3-cü yer',
  },
};

const SkeletonRow: React.FC<{ wide?: boolean }> = ({ wide }) => (
  <div className={`flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark px-4 py-3 ${wide ? 'h-16' : 'h-14'}`}>
    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
    <div className="flex-1 min-w-0 space-y-1.5">
      <div className="h-3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-1/3" />
      <div className="h-2.5 rounded bg-slate-100 dark:bg-slate-800 animate-pulse w-1/4" />
    </div>
    <div className="h-3 w-12 rounded bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0" />
  </div>
);

const Avatar: React.FC<{ userId: number; name: string; size?: 'sm' | 'md' | 'lg' }> = ({
  userId,
  name,
  size = 'md',
}) => {
  const c = avatarFor(userId);
  const dim = size === 'lg' ? 'w-12 h-12 text-base' : size === 'md' ? 'w-9 h-9 text-xs' : 'w-8 h-8 text-[11px]';
  return (
    <div
      className={`${dim} rounded-full ${c.bg} ${c.text} flex items-center justify-center font-bold shrink-0 select-none`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </div>
  );
};

const PodiumCard: React.FC<{ entry: LeaderboardEntry; rank: 1 | 2 | 3; isMe: boolean }> = ({
  entry,
  rank,
  isMe,
}) => {
  const p = PODIUM[rank];
  return (
    <div
      className={`relative rounded-2xl border p-4 sm:p-5 shadow-calm transition-transform duration-150 ${p.wrap} ${
        rank === 1 ? 'sm:-translate-y-2' : ''
      } ${rank === 1 ? 'sm:order-2' : rank === 2 ? 'sm:order-1' : 'sm:order-3'}`}
    >
      {rank === 1 && (
        <Crown
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-500 dark:text-amber-400"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${p.badge}`}>
          {rank}
        </span>
        {isMe && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand text-white px-1.5 py-0.5 rounded">
            Sən
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 min-w-0">
        <Avatar userId={entry.user_id} name={entry.name} size={rank === 1 ? 'lg' : 'md'} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy dark:text-white truncate" title={entry.name}>
            {entry.name}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.label}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-extrabold text-navy dark:text-white leading-none">
            {entry.total_score}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">toplanan bal</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-bold ${accuracyColor(entry.accuracy)}`}>{entry.accuracy}%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{entry.tests_completed} sınaq</p>
        </div>
      </div>
    </div>
  );
};

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onSelectScreen }) => {
  const [data, setData] = useState<LeaderboardPage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const load = useCallback(async (sid: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard({ subject_id: sid || undefined, page: p, per_page: PER_PAGE });
      setData(res);
    } catch (err) {
      setError(
        err instanceof ApiErrorClass
          ? err.message
          : 'Reytinq yüklenə bilmədi. Bir az sonra yenidən cəhd edin.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(subjectId, page);
  }, [load, subjectId, page]);

  const entries = data?.entries ?? [];
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(page === 1 ? 3 : 0);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;

  const handleSubject = (id: string) => {
    setSubjectId(id);
    setPage(1);
  };

  const meRow = data?.me ?? null;
  const meInPage = useMemo(
    () => entries.some((e) => meRow && e.user_id === meRow.user_id),
    [entries, meRow],
  );

  const Row: React.FC<{ entry: LeaderboardEntry; isMe: boolean }> = ({ entry, isMe }) => (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        isMe
          ? 'border-brand/40 bg-blue-50/60 dark:bg-blue-950/30 dark:border-blue-800/60'
          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-surface-dark-alt'
      }`}
    >
      <span
        className={`w-8 text-center text-sm font-bold shrink-0 ${
          entry.rank <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {entry.rank}
      </span>
      <Avatar userId={entry.user_id} name={entry.name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy dark:text-white truncate flex items-center gap-1.5" title={entry.name}>
          <span className="truncate">{entry.name}</span>
          {isMe && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand text-white px-1.5 py-0.5 rounded shrink-0">
              Sən
            </span>
          )}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {entry.tests_completed} sınaq · ən yaxşı {entry.best_score} bal · {formatDate(entry.last_activity)}
        </p>
      </div>
      <div className="text-right shrink-0 min-w-[64px]">
        <p className="text-sm font-extrabold text-navy dark:text-white leading-none">{entry.total_score}</p>
        <p className={`text-[11px] font-semibold mt-0.5 ${accuracyColor(entry.accuracy)}`}>
          {entry.accuracy}%
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] flex flex-col transition-colors">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B1220]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onSelectScreen('landing')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-blue-400 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Ana səhifə</span>
          </button>
          <div className="flex items-center gap-2 text-brand dark:text-blue-400 min-w-0">
            <Trophy className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider truncate">Reytinq lövhəsi</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 min-w-0">
        {/* Heading */}
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy dark:text-white tracking-tight">
            Reytinq lövhəsi
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Təqdim olunmuş sınaqların server tərəfindən hesablanmış nəticələri. Sıralama
            toplanan bala, sonra dəqiqlik faizinə görə müəyyən olunur.
          </p>
        </div>

        {/* Subject filter */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Fənn üzrə filtre">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={subjectId === t.id}
              onClick={() => handleSubject(t.id)}
              className={`px-3.5 h-9 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors shrink-0 ${
                subjectId === t.id
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-red-200/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300 break-words">{error}</p>
            <button
              onClick={() => load(subjectId, page)}
              className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-[12px] bg-brand text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Yenidən cəhd et
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-6 space-y-3" aria-busy="true" aria-live="polite">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SkeletonRow wide />
              <SkeletonRow wide />
              <SkeletonRow wide />
            </div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.total === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark p-10 text-center shadow-calm">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-navy dark:text-white">
              Hələ heç kim reytinqə daxil deyil
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              İlk sınağını tamamla və reytinq lövhəsində görün. Nəticələr təqdim olunmuş
              sınaqlardan avtomatik hesablanır.
            </p>
            <button
              onClick={() => onSelectScreen('subjects')}
              className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-brand text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Target className="w-4 h-4" /> Sınağa başla
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && data.total > 0 && (
          <>
            {/* Podium (only on page 1) */}
            {page === 1 && top3.length > 0 && (
              <section aria-label="İlk üç yer" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 sm:items-end">
                  {top3.map((e) => (
                    <PodiumCard key={e.user_id} entry={e} rank={e.rank as 1 | 2 | 3} isMe={!!meRow && meRow.user_id === e.user_id} />
                  ))}
                </div>
              </section>
            )}

            {/* Rows 4+ */}
            {rest.length > 0 && (
              <section aria-label="Reytinq cədvəli" className="mt-4 space-y-2">
                {rest.map((e) => (
                  <Row key={e.user_id} entry={e} isMe={!!meRow && meRow.user_id === e.user_id} />
                ))}
              </section>
            )}

            {/* Current user pinned row when outside the current page window */}
            {meRow && !meInPage && (
              <section aria-label="Sənin reytinqin" className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                  Sənin yerin
                </p>
                <Row entry={meRow} isMe />
              </section>
            )}

            {/* Summary + pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                Ümumi {data.total} iştirakçı · səhifə {data.page}/{totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1 || loading}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Əvvəlki
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={data.page >= totalPages || loading}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-dark-alt disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Sonrakı <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Gentle CTA when anonymous */}
            {!meRow && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-surface-dark/60 p-5 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Reytinqə düşmək üçün hesab yarat və ilk sınağını tamamla.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => onSelectScreen('register')}
                    className="h-10 px-4 rounded-[12px] bg-brand text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Pulsuz başla
                  </button>
                  <button
                    onClick={() => onSelectScreen('login')}
                    className="h-10 px-4 rounded-[12px] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-dark-alt transition-colors"
                  >
                    Daxil ol
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Small stat legend */}
        {!loading && !error && data && data.total > 0 && (
          <p className="mt-8 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            Sıralama: toplanan bal ↓ · dəqiqlik ↓ · ən erkən aktivlik ↑ — tam server tərəfindən hesablanır.
          </p>
        )}
      </main>
    </div>
  );
};
