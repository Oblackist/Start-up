import React from 'react';
import { ArrowRight, Shuffle } from 'lucide-react';
import type { Difficulty, ScreenType, SubjectId } from '../types';
import { SUBJECTS_DATA } from '../data/examData';
import { CATALOG_TOPICS, DIFFICULTY_META, sectionsOf, topicsOf } from '../data/catalog';
import { useExam } from '../context/ExamContext';

interface SectionsScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

export const SectionsScreen: React.FC<SectionsScreenProps> = ({ onSelectScreen }) => {
  const { setup, updateSetup } = useExam();
  const subject = SUBJECTS_DATA.find((s) => s.id === setup.subjectId) ?? SUBJECTS_DATA[0];
  const sections = sectionsOf(subject.id);

  const switchSubject = (subjectId: SubjectId) =>
    updateSetup({ subjectId, sectionId: undefined, topicIds: [] });

  const openSection = (sectionId: string) => {
    updateSetup({ sectionId, topicIds: [] });
    onSelectScreen('topics');
  };

  const mixedExam = () => {
    updateSetup({ sectionId: undefined, topicIds: [] });
    onSelectScreen('exam-info');
  };

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className="space-y-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase">
            Addım 2 · Bölmə seçimi
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
            {subject.name}: bölmələr
          </h1>
          <div role="tablist" aria-label="Fənn" className="flex flex-wrap gap-2">
            {SUBJECTS_DATA.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={s.id === subject.id}
                onClick={() => switchSubject(s.id)}
                className={`h-9 px-4 rounded-full text-sm font-semibold border transition-colors ${
                  s.id === subject.id
                    ? 'bg-brand text-white border-brand dark:bg-brand-400 dark:text-ink dark:border-brand-400'
                    : 'bg-surface dark:bg-surface-dark border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:border-brand-fg'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const topics = topicsOf(section.id);
            const avg = Math.round(topics.reduce((sum, t) => sum + t.mastery, 0) / topics.length);
            const counts = (['easy', 'medium', 'hard'] as Difficulty[]).map((d) => ({
              d,
              n: topics.filter((t) => t.difficulty === d).length,
            }));
            return (
              <article
                key={section.id}
                className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm hover:border-brand-fg hover:shadow-calm-lg transition-all flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-white">{section.name}</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5">
                      {section.description}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 dark:text-stone-400">
                        Bilik səviyyəsi · {topics.length} mövzu
                      </span>
                      <span className="font-bold text-ink dark:text-white">{avg}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 dark:bg-inset-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-fg"
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                    {counts
                      .filter((c) => c.n > 0)
                      .map((c) => (
                        <span
                          key={c.d}
                          className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-inset-dark border border-stone-200 dark:border-stone-800"
                        >
                          {DIFFICULTY_META[c.d].label}: {c.n}
                        </span>
                      ))}
                  </div>
                </div>
                <button
                  onClick={() => openSection(section.id)}
                  className="h-11 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Mövzuları seç
                  <ArrowRight className="w-4 h-4" />
                </button>
              </article>
            );
          })}
        </div>

        <div className="rounded-[20px] border border-dashed border-stone-300 dark:border-stone-700 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Shuffle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-ink dark:text-white">
                Bütün bölmələrdən qarışıq imtahan
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                {CATALOG_TOPICS.filter((t) => t.subjectId === subject.id).length} mövzu üzrə suallar
                təsadüfi seçilir.
              </p>
            </div>
          </div>
          <button
            onClick={mixedExam}
            className="h-11 px-6 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold text-ink dark:text-white hover:border-brand-fg hover:text-brand-fg transition-colors shrink-0"
          >
            Qarışıq imtahana keç
          </button>
        </div>
      </div>
    </div>
  );
};
