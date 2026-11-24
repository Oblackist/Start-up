import React, { useEffect, useMemo, useState } from 'react';
import type { ScreenType } from '../types';
import type { PracticeCard } from '../types';
import {
  Clock,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ApiErrorClass, asArray, getPracticeCards, getMyProgress } from '../lib/api';

interface PracticeScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
  onStartPractice: (card: PracticeCard) => void;
}

/**
 * Practice screen wired to GET /api/v1/practice/cards (derived from weak
 * topics) and GET /api/v1/me/progress (for the saved-mistakes bank). Empty
 * states for new users.
 */
export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onSelectScreen, onStartPractice }) => {
  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState<boolean>(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const [savedMistakes, setSavedMistakes] = useState<
    {
      id: string;
      subject: string;
      topic: string;
      question_preview: string;
      user_answer: string;
      correct_answer: string;
      date: string;
      status: string;
    }[]
  >([]);
  const [activeTab, setActiveTab] = useState<'recommended' | 'saved'>('recommended');
  const [mistakeFilter, setMistakeFilter] = useState<
    'Hamısı' | 'Yeni' | 'Təkrar et' | 'Düzəldildi'
  >('Hamısı');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCardsLoading(true);
      setCardsError(null);
      try {
        const raw = await getPracticeCards();
        if (!cancelled) setCards(asArray<PracticeCard>(raw));
      } catch (err) {
        if (!cancelled) {
          setCardsError(
            err instanceof ApiErrorClass
              ? err.message
              : 'Məşq kartlarını yükləmək mümkün olmadı.',
          );
        }
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getMyProgress();
        if (!cancelled) setSavedMistakes(p.saved_mistakes);
      } catch {
        // ignore — saved mistakes is a "nice to have"
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredMistakes = useMemo(() => {
    return savedMistakes.filter((m) => {
      if (mistakeFilter === 'Hamısı') return true;
      return m.status === mistakeFilter;
    });
  }, [savedMistakes, mistakeFilter]);

  const cardsEmpty = !cardsLoading && !cardsError && cards.length === 0;

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 min-w-0">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-brand dark:text-blue-400 tracking-wider uppercase mb-1">
              Fərdiləşdirilmiş Hazırlıq
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy dark:text-white tracking-tight">
              Sənin məşq planın
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
              {cards.length > 0
                ? `Hədəflənən zəif mövzular: ${cards
                    .slice(0, 3)
                    .map((c) => c.topic)
                    .join(' · ')}`
                : 'Zəif mövzuların aşkarlanması üçün əvvəlcə bir sınaq ver.'}
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'recommended'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tövsiyə olunan məşqlər ({cards.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Saxlanmış səhvlər ({savedMistakes.length})
            </button>
          </div>
        </div>

        {/* TAB 1: RECOMMENDED PRACTICE CARDS */}
        {activeTab === 'recommended' && (
          <div className="space-y-8">
            {cardsError && (
              <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    Məşq planını yükləmək alınmadı
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 break-words">
                    {cardsError}
                  </p>
                </div>
              </div>
            )}

            {cardsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-surface-dark rounded-[20px] p-7 border border-slate-200 dark:border-slate-800 shadow-calm animate-pulse flex flex-col justify-between h-64"
                  >
                    <div className="space-y-2">
                      <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-5 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800 mt-3" />
                    </div>
                    <div className="h-12 w-full rounded-[12px] bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : cardsEmpty ? (
              <div className="bg-white dark:bg-surface-dark rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-calm text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-soft dark:bg-blue-950/60 flex items-center justify-center text-brand dark:text-blue-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-navy dark:text-white">
                  Hələ fərdi məşq planın yoxdur
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Sistem zəif mövzularını aşkarlamaq üçün əvvəlcə bir neçə
                  sınaq nəticəsinə ehtiyac duyur. İlk sınağını ver, sonra fərdi
                  məşq planın yaransın.
                </p>
                <button
                  onClick={() => onSelectScreen('subjects')}
                  className="mt-6 h-12 px-6 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-sm inline-flex items-center gap-2"
                >
                  <span>Sınağa başla</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => {
                  const difficultyColor =
                    card.difficulty === 'Çətin'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200/60 dark:border-red-900/60'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60';

                  return (
                    <div
                      key={card.id}
                      className="bg-white dark:bg-surface-dark rounded-[20px] p-7 border border-slate-200 dark:border-slate-800 shadow-calm hover:shadow-calm-lg transition-all duration-200 flex flex-col justify-between min-w-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-4 gap-3">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 break-words min-w-0">
                            {card.subject}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${difficultyColor}`}
                          >
                            {card.difficulty} səviyyə
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-navy dark:text-white mb-2 break-words">
                          {card.topic}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 break-words">
                          {card.description}
                        </p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-8 min-w-0">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium gap-3">
                          <span className="flex items-center gap-1.5 shrink-0">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{card.questions_count} sual</span>
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>~{card.estimated_time}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => onStartPractice(card)}
                          className="w-full h-12 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                        >
                          <span>Məşqə başla</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AFTER-PRACTICE BANNER */}
            <div className="bg-brand-soft dark:bg-surface-dark rounded-[20px] p-6 sm:p-8 border border-blue-200/80 dark:border-blue-900/60 shadow-calm flex flex-col md:flex-row items-center justify-between gap-6 min-w-0">
              <div className="space-y-1.5 text-center md:text-left min-w-0">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand dark:text-blue-400 uppercase tracking-wider">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>İnkişafın təsdiqi</span>
                </div>
                <h3 className="text-2xl font-extrabold text-navy dark:text-white break-words">
                  Yenidən test ver
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl break-words">
                  Məşqi bitirdikdən sonra yeni sınaq verərək nəticəni əvvəlki
                  sınaqla müqayisə et və real artımı qeydə al.
                </p>
              </div>

              <button
                onClick={() => onSelectScreen('test')}
                className="h-12 px-7 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-calm shrink-0 flex items-center gap-2"
              >
                <span>Sınağa keç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SAXLANMIŞ SƏHVLƏR */}
        {activeTab === 'saved' && (
          <div className="bg-white dark:bg-surface-dark rounded-[20px] p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-navy dark:text-white">Səhvlər bankı</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                  Buraxılış sınaqlarında yol verdiyin səhvlərin xüsusi arxivi
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button className="p-1.5 text-slate-400">
                  <RotateCcw className="w-4 h-4" />
                </button>
                {(['Hamısı', 'Yeni', 'Təkrar et', 'Düzəldildi'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setMistakeFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      mistakeFilter === st
                        ? 'bg-brand text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredMistakes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                {savedMistakes.length === 0
                  ? 'Hələ saxlanmış səhv yoxdur. Sınaq verərək səhvlərini burada topla.'
                  : 'Bu filtrə uyğun səhv tapılmadı.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMistakes.map((m) => {
                  const status = (m.status as 'Yeni' | 'Təkrar et' | 'Düzəldildi') || 'Yeni';
                  const statusStyle =
                    status === 'Yeni'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900'
                      : status === 'Təkrar et'
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                        : 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-900';

                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 min-w-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-brand dark:text-blue-400 break-words min-w-0">
                            {m.subject} · {m.topic}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusStyle}`}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 break-words">
                          "{m.question_preview}"
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-red-500 break-words">Sənin: {m.user_answer}</span>
                          <span className="text-teal-600 font-semibold break-words">
                            Doğru: {m.correct_answer}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px] shrink-0">{m.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
