import React, { useState } from 'react';
import { ScreenType } from '../types';
import { PRACTICE_CARDS_DATA, SAVED_MISTAKES_DATA } from '../data/examData';
import {
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Filter,
  Play,
  X,
} from 'lucide-react';

interface PracticeScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onSelectScreen }) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'saved'>('recommended');
  const [mistakeFilter, setMistakeFilter] = useState<
    'Hamısı' | 'Yeni' | 'Təkrar et' | 'Düzəldildi'
  >('Hamısı');
  const [activeDrill, setActiveDrill] = useState<any | null>(null);
  const [drillAnswer, setDrillAnswer] = useState<string | null>(null);
  const [drillSubmitted, setDrillSubmitted] = useState<boolean>(false);

  const filteredMistakes = SAVED_MISTAKES_DATA.filter((m) => {
    if (mistakeFilter === 'Hamısı') return true;
    return m.status === mistakeFilter;
  });

  const handleStartDrill = (card: any) => {
    setActiveDrill(card);
    setDrillAnswer(null);
    setDrillSubmitted(false);
  };

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-10">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="text-xs font-semibold text-brand-fg dark:text-brand-400 tracking-wider uppercase mb-1">
              Fərdiləşdirilmiş Hazırlıq
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
              Sənin məşq planın
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              Hədəflənən zəif mövzular:{' '}
              <span className="font-semibold text-stone-700 dark:text-stone-300">
                Tənliklər sistemi · Faiz və nisbət · Həndəsə medianları
              </span>
            </p>
          </div>

          {/* Tab selector */}
          <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-surface-dark border border-stone-200 dark:border-stone-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'recommended'
                  ? 'bg-surface dark:bg-raised-dark text-brand-fg dark:text-brand-400 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Tövsiyə olunan məşqlər (3)
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'saved'
                  ? 'bg-surface dark:bg-raised-dark text-brand-fg dark:text-brand-400 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Saxlanmış səhvlər ({SAVED_MISTAKES_DATA.length})
            </button>
          </div>
        </div>

        {/* TAB 1: RECOMMENDED PRACTICE CARDS */}
        {activeTab === 'recommended' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRACTICE_CARDS_DATA.map((card) => {
                const difficultyColor =
                  card.difficulty === 'Çətin'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200/60 dark:border-red-900/60'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60';

                return (
                  <div
                    key={card.id}
                    className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm hover:shadow-calm-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Chips */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                          {card.subject}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${difficultyColor}`}
                        >
                          {card.difficulty} səviyyə
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-ink dark:text-white mb-2">
                        {card.topic}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                        {card.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>{card.questionsCount} sual</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>~{card.estimatedTime}</span>
                        </span>
                      </div>

                      {/* Button: "Başla" */}
                      <button
                        onClick={() => handleStartDrill(card)}
                        className="w-full h-12 rounded-[12px] bg-brand hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Məşqə başla</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AFTER-PRACTICE BANNER: "Yenidən test ver" */}
            <div className="bg-brand-soft dark:bg-surface-dark rounded-[20px] p-8 border border-brand-200/80 dark:border-brand-900/60 shadow-calm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-fg dark:text-brand-400 uppercase tracking-wider">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>İnkişafın təsdiqi</span>
                </div>
                <h3 className="text-2xl font-extrabold text-ink dark:text-white">
                  Yenidən test ver
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-300 max-w-xl">
                  Məşqi bitirdikdən sonra yeni sınaq verərək nəticəni əvvəlki 85% ilə müqayisə et və
                  real artımı qeydə al.
                </p>
              </div>

              <button
                onClick={() => onSelectScreen('test')}
                className="h-12 px-7 rounded-[12px] bg-brand hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-calm shrink-0 flex items-center gap-2"
              >
                <span>Sınağa keç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SAXLANMIŞ SƏHVLƏR */}
        {activeTab === 'saved' && (
          <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-8 border border-stone-200 dark:border-stone-800 shadow-calm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-lg font-bold text-ink dark:text-white">Səhvlər bankı</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Buraxılış sınaqlarında yol verdiyin səhvlərin xüsusi arxivi
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-stone-400" />
                {(['Hamısı', 'Yeni', 'Təkrar et', 'Düzəldildi'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setMistakeFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      mistakeFilter === st
                        ? 'bg-brand text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Mistake Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMistakes.map((m) => {
                const statusStyle =
                  m.status === 'Yeni'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-900'
                    : m.status === 'Təkrar et'
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      : 'bg-sage-50 text-sage-700 dark:bg-sage-950 dark:text-sage-300 border-sage-200 dark:border-sage-900';

                return (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-stone-50 dark:bg-inset-dark border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-brand-fg dark:text-brand-400">
                          {m.subject} · {m.topic}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusStyle}`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 line-clamp-2">
                        "{m.questionPreview}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-red-500">Sənin: {m.userAnswer}</span>
                        <span className="text-sage-600 font-semibold">
                          Doğru: {m.correctAnswer}
                        </span>
                      </div>
                      <span className="text-stone-400 text-[11px]">{m.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* INTERACTIVE DRILL MODAL */}
      {activeDrill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-calm-lg space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-fg uppercase">
                  {activeDrill.subject} · Hədəfli məşq
                </span>
                <h3 className="text-lg font-bold text-ink dark:text-white">{activeDrill.topic}</h3>
              </div>
              <button
                onClick={() => setActiveDrill(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 text-sm">
              <span className="text-xs font-bold text-stone-400 block mb-1">
                Məşq sualı 1 / {activeDrill.questionsCount}:
              </span>
              <p className="font-semibold text-stone-900 dark:text-white">
                İki ədədin cəmi 40, fərqi 10-dur. Bu ədədlərdən kiçiyini tapın.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { key: 'A', text: '10' },
                { key: 'B', text: '15' },
                { key: 'C', text: '20' },
                { key: 'D', text: '25' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDrillAnswer(opt.key)}
                  className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-colors flex items-center gap-3 ${
                    drillAnswer === opt.key
                      ? 'border-brand-fg bg-brand-50 dark:bg-brand-950 text-brand-fg dark:text-brand-300 font-bold'
                      : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-surface-dark-alt'
                  }`}
                >
                  <span className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xs font-bold">
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>

            {drillSubmitted && (
              <div className="p-3.5 rounded-xl bg-sage-50 dark:bg-sage-950/40 border border-sage-200 dark:border-sage-900/60 text-xs text-sage-800 dark:text-sage-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sage-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Əla nəticə! Düzgün cavab B) 15-dir.</span>
                  <p className="mt-0.5 text-stone-600 dark:text-stone-300">
                    Kiçik ədəd = (40 - 10) / 2 = 15. Bu mövzu üzrə dəqiqliyin 72%-ə yüksəldi!
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {!drillSubmitted ? (
                <button
                  disabled={!drillAnswer}
                  onClick={() => setDrillSubmitted(true)}
                  className="h-11 px-6 rounded-[12px] bg-brand disabled:opacity-50 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Yoxla
                </button>
              ) : (
                <button
                  onClick={() => setActiveDrill(null)}
                  className="h-11 px-6 rounded-[12px] bg-stone-900 dark:bg-surface text-white dark:text-stone-900 font-semibold text-xs transition-colors shadow-sm"
                >
                  Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
