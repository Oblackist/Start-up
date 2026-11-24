import React, { useEffect, useMemo, useState } from 'react';
import type { ScreenType } from '../types';
import type { TestSubmitResult } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import { AnswerReview } from '../components/AnswerReview';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { ApiErrorClass, getTest } from '../lib/api';

interface ResultScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
  result?: TestSubmitResult | null;
  attemptId?: number | null;
}

/**
 * Result screen wired to the backend:
 *   - prefer the result passed in via props (the just-submitted result)
 * *   - otherwise fetch the result by attempt ID
 *   - empty state if none of the above is available
 */
export const ResultScreen: React.FC<ResultScreenProps> = ({
  onSelectScreen,
  result,
  attemptId,
}) => {
  const [data, setData] = useState<TestSubmitResult | null>(result ?? null);
  const [loading, setLoading] = useState<boolean>(!result && Boolean(attemptId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // If we already have a result prop, just sync to it.
    if (result) {
      setData(result);
      setLoading(false);
      return;
    }
    (async () => {
      if (attemptId === undefined || attemptId === null) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const fetched = await getTest(attemptId);
        if (!cancelled) {
          setData(fetched);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiErrorClass
              ? err.message
              : 'Nəticəni yükləmək mümkün olmadı. Bir az sonra yenidən cəhd edin.',
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result, attemptId]);

  // Build derived stats from the submitted answers.
  const derived = useMemo(() => {
    if (!data) return null;
    const total = data.total || data.results.length;
    const correct = data.results.filter((r) => r.is_correct).length;
    const wrong = data.results.filter((r) => r.user_answer !== null && !r.is_correct).length;
    const blank = data.results.filter((r) => r.user_answer === null).length;
    const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const mistakes = data.results.filter((item) => !item.is_correct);
    return { total, correct, wrong, blank, scorePct, mistakes };
  }, [data]);

  // --- Loading ----------------------------------------------------------
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] flex flex-col items-center justify-center px-4 transition-colors">
        <div className="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
          Nəticə yüklənir…
        </p>
      </div>
    );
  }

  // --- Error ------------------------------------------------------------
  if (error) {
    return (
      <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] flex flex-col transition-colors">
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0B1220]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
            <button
              type="button"
              onClick={() => onSelectScreen('subjects')}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              <span>Fənlər</span>
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nəticə tapılmadı
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 break-words">{error}</p>
            <button
              onClick={() => onSelectScreen('dashboard')}
              className="mt-6 h-11 px-5 rounded-[12px] bg-brand hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              İnkişaf panelinə keç
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- Empty ------------------------------------------------------------
  if (!data || !derived) {
    return (
      <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-[1440px] mx-auto text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="mt-4 text-xl font-bold text-navy dark:text-white">Nəticə yoxdur</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hələ heç bir sınaq təqdim etməmisən. Yeni sınaq verərək başla.
          </p>
          <button
            onClick={() => onSelectScreen('subjects')}
            className="mt-6 h-11 px-5 rounded-[12px] bg-brand hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            Fənlərə keç
          </button>
        </div>
      </div>
    );
  }

  const { total, correct, wrong, blank, scorePct, mistakes } = derived;
  const subjectName = data.subject_name ?? 'Bu fənn';

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-10">
        {/* Title & Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-brand dark:text-blue-400 tracking-wider uppercase mb-1">
              Sınaq İmtahanı Hesabatı
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy dark:text-white tracking-tight">
              Nəticə və Təhlil
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onSelectScreen('test')}
              className="h-10 px-4 rounded-[12px] bg-slate-100 dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yenidən test ver</span>
            </button>
            <button
              onClick={() => onSelectScreen('dashboard')}
              className="h-10 px-4 rounded-[12px] bg-brand hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              İnkişaf panelinə keç
            </button>
          </div>
        </div>

        {/* TOP SECTION: Readiness Ring + 4 Stat Cards + Weak Topics Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: Readiness Ring + 4 Stat Cards */}
          <div className="lg:col-span-7 bg-white dark:bg-surface-dark rounded-[20px] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-8 min-w-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-2 text-center sm:text-left min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ümumi Göstərici
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy dark:text-white">
                  Hazırlıq səviyyəsi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs break-words">
                  {subjectName} üzrə son sınaqda {total} sualdan {correct} düzgün cavabın oldu.
                </p>
              </div>

              <div className="shrink-0 p-3 bg-slate-50 dark:bg-[#0E172A] rounded-2xl border border-slate-100 dark:border-slate-800">
                <ProgressRing
                  progress={scorePct}
                  size={150}
                  strokeWidth={14}
                  color="#2563EB"
                  trackColor="#E2E8F0"
                  label="Hazırlıq"
                  sublabel={scorePct >= 70 ? 'Yaxşı nəticə' : 'İnkişaf etməli'}
                />
              </div>
            </div>

            {/* Four Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Düzgün */}
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-center min-w-0">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Düzgün</span>
                </div>
                <div className="text-2xl font-extrabold text-teal-800 dark:text-teal-300 tabular-nums">
                  {correct}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {total > 0 ? Math.round((correct / total) * 100) : 0}% dəqiqlik
                </div>
              </div>

              {/* Səhv */}
              <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-center min-w-0">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span>Səhv</span>
                </div>
                <div className="text-2xl font-extrabold text-red-700 dark:text-red-400 tabular-nums">
                  {wrong}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {total > 0 ? Math.round((wrong / total) * 100) : 0}% xəta
                </div>
              </div>

              {/* Boş */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark-alt border border-slate-200/80 dark:border-slate-800 text-center min-w-0">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>Boş</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                  {blank}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {total > 0 ? Math.round((blank / total) * 100) : 0}% cavabsız
                </div>
              </div>

              {/* Cəmi sual */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-center min-w-0">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand dark:text-blue-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Cəmi</span>
                </div>
                <div className="text-2xl font-extrabold text-brand dark:text-blue-300 tabular-nums">
                  {total}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.score} bal
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: "Zəif mövzular" (derived from wrong answers grouped by topic) */}
          <div className="lg:col-span-5 bg-white dark:bg-surface-dark rounded-[20px] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-6 min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-lg font-bold text-navy dark:text-white">Zəif mövzular</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0">Bu sınaqda</span>
            </div>

            {mistakes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
                Bu sınaqda səhv yoxdur. Əla iş!
              </p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  // Group mistakes by topic for the weak-topics list.
                  const grouped = new Map<string, number>();
                  for (const m of mistakes) {
                    grouped.set(m.topic, (grouped.get(m.topic) || 0) + 1);
                  }
                  return Array.from(grouped.entries()).map(([topic, count]) => (
                    <div
                      key={topic}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 min-w-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white break-words">
                            {topic}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            {count} səhv
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onSelectScreen('practice')}
                        className="text-xs font-bold text-brand dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
                      >
                        <span>Məşq et</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ));
                })()}
              </div>
            )}

            {mistakes.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => onSelectScreen('practice')}
                  className="w-full h-11 rounded-[12px] bg-brand-soft dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-brand dark:text-blue-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span>Bütün zəif mövzuları məşq et</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {data.results.length > 0 && (
          <AnswerReview results={data.results} isMath={data.subject_id === 'math'} />
        )}
      </div>
    </div>
  );
};
