import React from 'react';
import { ArrowRight, Check, Clock } from 'lucide-react';
import type { Difficulty, DifficultyChoice, ScreenType } from '../types';
import { DIFFICULTY_META, getSection, masteryStatus, topicsOf } from '../data/catalog';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { useExam } from '../context/ExamContext';
import { QUESTION_COUNT_OPTIONS, examDurationMinutes, formatMinutes } from '../utils/exam';

interface TopicsScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

const STATUS_LABEL = { weak: 'Zəif', learning: 'Öyrənilir', mastered: 'Mənimsənilib' } as const;
const STATUS_CLASS = {
  weak: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50',
  learning:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
  mastered:
    'bg-sage-50 dark:bg-sage-950/50 text-sage-700 dark:text-sage-300 border-sage-200 dark:border-sage-900/60',
} as const;

const DIFFICULTY_CHOICES: DifficultyChoice[] = ['easy', 'medium', 'hard', 'mixed'];

export const TopicsScreen: React.FC<TopicsScreenProps> = ({ onSelectScreen }) => {
  const { setup, updateSetup } = useExam();
  const section = getSection(setup.sectionId);

  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center p-10 text-center bg-canvas dark:bg-canvas-dark">
        <div className="space-y-4">
          <p className="text-stone-600 dark:text-stone-300">Əvvəlcə bölmə seçməlisən.</p>
          <button
            onClick={() => onSelectScreen('sections')}
            className="h-11 px-6 rounded-[12px] bg-brand text-white font-semibold text-sm"
          >
            Bölmələrə keç
          </button>
        </div>
      </div>
    );
  }

  const topics = topicsOf(section.id);
  const selected = new Set(setup.topicIds);
  const allSelected = topics.every((t) => selected.has(t.id));
  const duration = examDurationMinutes(setup.questionCount);

  const toggle = (id: string) =>
    updateSetup({
      topicIds: selected.has(id) ? setup.topicIds.filter((x) => x !== id) : [...setup.topicIds, id],
    });

  const toggleAll = () => updateSetup({ topicIds: allSelected ? [] : topics.map((t) => t.id) });

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase mb-1">
            Addım 3 · Mövzu seçimi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
            {section.name}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">{section.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Mövzu siyahısı */}
          <section aria-label="Mövzular" className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-ink dark:text-white">Mövzular ({topics.length})</h2>
              <button
                onClick={toggleAll}
                className="text-sm font-semibold text-brand-fg hover:underline"
              >
                {allSelected ? 'Seçimi təmizlə' : 'Hamısını seç'}
              </button>
            </div>

            <ul className="space-y-3">
              {topics.map((topic) => {
                const checked = selected.has(topic.id);
                const status = masteryStatus(topic.mastery);
                return (
                  <li key={topic.id}>
                    <label
                      className={`flex items-center gap-4 rounded-[16px] border p-4 sm:p-5 transition-colors ${
                        checked
                          ? 'border-brand-fg bg-brand-soft/60 dark:bg-brand-950/30'
                          : 'border-stone-200 dark:border-stone-800 bg-surface dark:bg-surface-dark hover:border-stone-300 dark:hover:border-stone-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(topic.id)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                          checked
                            ? 'bg-brand border-brand dark:bg-brand-400 dark:border-brand-400 text-white dark:text-ink'
                            : 'border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {checked && <Check className="w-4 h-4" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 min-w-0 space-y-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink dark:text-white">
                            {topic.name}
                          </span>
                          <DifficultyBadge difficulty={topic.difficulty} />
                        </span>
                        <span className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                          <span>{topic.questionCount} sual</span>
                          <span className="flex-1 max-w-[220px] h-1.5 rounded-full bg-stone-100 dark:bg-inset-dark overflow-hidden">
                            <span
                              className="block h-full rounded-full bg-brand-fg"
                              style={{ width: `${topic.mastery}%` }}
                            />
                          </span>
                          <span className="font-semibold">{topic.mastery}%</span>
                        </span>
                      </span>
                      <span
                        className={`hidden sm:inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Quraşdırma paneli */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 space-y-6">
              <div>
                <h2 className="font-bold text-ink dark:text-white mb-3">Çətinlik səviyyəsi</h2>
                <div role="radiogroup" aria-label="Çətinlik" className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_CHOICES.map((choice) => {
                    const active = setup.difficulty === choice;
                    return (
                      <button
                        key={choice}
                        role="radio"
                        aria-checked={active}
                        onClick={() => updateSetup({ difficulty: choice })}
                        className={`h-11 rounded-[12px] border text-sm font-semibold transition-colors flex items-center justify-center ${
                          active
                            ? 'border-brand-fg bg-brand-soft dark:bg-brand-950/50 text-brand-fg'
                            : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
                        }`}
                      >
                        {choice === 'mixed' ? (
                          'Qarışıq'
                        ) : (
                          <DifficultyBadge
                            difficulty={choice as Difficulty}
                            className="border-0 bg-transparent dark:bg-transparent"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-stone-500 dark:text-stone-400">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <li key={d}>
                      <b className="text-stone-700 dark:text-stone-200">
                        {DIFFICULTY_META[d].label}:
                      </b>{' '}
                      {DIFFICULTY_META[d].description}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="font-bold text-ink dark:text-white mb-3">Sual sayı</h2>
                <div role="radiogroup" aria-label="Sual sayı" className="grid grid-cols-3 gap-2">
                  {QUESTION_COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      role="radio"
                      aria-checked={setup.questionCount === n}
                      onClick={() => updateSetup({ questionCount: n })}
                      className={`h-11 rounded-[12px] border text-sm font-semibold transition-colors ${
                        setup.questionCount === n
                          ? 'border-brand-fg bg-brand-soft dark:bg-brand-950/50 text-brand-fg'
                          : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
                      }`}
                    >
                      {n} sual
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500 dark:text-stone-400">Seçilmiş mövzu</span>
                  <b className="text-ink dark:text-white">
                    {selected.size} / {topics.length}
                  </b>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Müddət
                  </span>
                  <b className="text-ink dark:text-white">{formatMinutes(duration)} dəqiqə</b>
                </div>
                <p className="text-[11px] text-stone-400">
                  Müddət = sual sayı × 1,5 dəqiqə ({setup.questionCount} × 1,5)
                </p>
              </div>

              <button
                disabled={selected.size === 0}
                onClick={() => onSelectScreen('exam-info')}
                className="w-full h-12 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Davam et
                <ArrowRight className="w-4 h-4" />
              </button>
              {selected.size === 0 && (
                <p className="text-xs text-center text-stone-500 dark:text-stone-400 -mt-3">
                  Davam etmək üçün ən azı bir mövzu seç.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
