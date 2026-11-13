import React from 'react';
import { BookOpen, Calculator, Globe, Layers, Play } from 'lucide-react';
import type { ScreenType, SubjectId } from '../types';
import { SUBJECTS_DATA } from '../data/examData';
import { ProgressRing } from '../components/ProgressRing';
import { useExam } from '../context/ExamContext';

interface SubjectsScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

const ICONS = { math: Calculator, aze: BookOpen, eng: Globe } as const;

export const SubjectsScreen: React.FC<SubjectsScreenProps> = ({ onSelectScreen }) => {
  const { updateSetup } = useExam();

  const choose = (subjectId: SubjectId, next: ScreenType) => {
    updateSetup({ subjectId, sectionId: undefined, topicIds: [] });
    onSelectScreen(next);
  };

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase mb-1">
              Addım 1 · Fənn seçimi
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
              Fənnlər
            </h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md">
            Fənni seç, sonra bölmə və mövzuları müəyyən et. İstəsən, dərhal sürətli sınaq imtahanı
            da verə bilərsən.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBJECTS_DATA.map((subject) => {
            const Icon = ICONS[subject.id];
            return (
              <article
                key={subject.id}
                className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm hover:shadow-calm-lg hover:border-brand-fg transition-all flex flex-col justify-between gap-6"
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-brand-soft dark:bg-brand-950/60 text-brand-fg flex items-center justify-center">
                      <Icon className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <ProgressRing
                      progress={subject.readinessScore}
                      size={72}
                      strokeWidth={7}
                      sublabel="hazırlıq"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-white">{subject.name}</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                      {subject.shortDesc}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 p-3">
                      <dt className="text-stone-500 dark:text-stone-400">Həll olunan</dt>
                      <dd className="font-bold text-ink dark:text-white mt-0.5">
                        {subject.completedQuestions} / {subject.totalQuestions}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 p-3">
                      <dt className="text-stone-500 dark:text-stone-400">Son nəticə</dt>
                      <dd className="font-bold text-ink dark:text-white mt-0.5">
                        {subject.lastScore}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => choose(subject.id, 'sections')}
                    className="flex-1 h-11 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    Bölmələr
                  </button>
                  <button
                    onClick={() => choose(subject.id, 'exam-info')}
                    className="flex-1 h-11 rounded-[12px] border border-stone-300 dark:border-stone-700 text-ink dark:text-white text-sm font-semibold hover:border-brand-fg hover:text-brand-fg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Sürətli sınaq
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
