import React, { useState } from 'react';
import { ScreenType, SubjectId } from '../types';
import { SUBJECTS_DATA, TOPICS_DATA } from '../data/examData';
import { ProgressRing } from '../components/ProgressRing';
import { Calculator, BookOpen, Globe, ArrowRight, Play } from 'lucide-react';

interface SubjectsScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
  onStartSubjectTest?: (subjectId: SubjectId) => void;
}

export const SubjectsScreen: React.FC<SubjectsScreenProps> = ({
  onSelectScreen,
  onStartSubjectTest,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('math');

  const selectedSubject = SUBJECTS_DATA.find((s) => s.id === selectedSubjectId) || SUBJECTS_DATA[0];
  const subjectTopics = TOPICS_DATA.filter((t) => t.subjectId === selectedSubjectId);

  const handleStart = (subjectId: SubjectId) => {
    if (onStartSubjectTest) {
      onStartSubjectTest(subjectId);
    }
    onSelectScreen('test');
  };

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-brand dark:text-blue-400 tracking-wider uppercase mb-1">
              Buraxılış İmtahanı Proqramı
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy dark:text-white tracking-tight">
              Fənnlər
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Hər bir fənn üzrə bilik səviyyəni sınaqlarla ölç, zəif mövzuları təyin et və xüsusi
            məşqlərlə inkişaf etdir.
          </p>
        </div>

        {/* Three Large Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBJECTS_DATA.map((subject) => {
            const isSelected = subject.id === selectedSubjectId;
            const Icon =
              subject.id === 'math' ? Calculator : subject.id === 'aze' ? BookOpen : Globe;

            return (
              <div
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={`bg-white dark:bg-surface-dark rounded-[20px] p-7 border transition-all duration-200 cursor-pointer shadow-calm flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand ring-2 ring-blue-500/10 dark:ring-blue-500/20 shadow-calm-lg'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar inside card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400 flex items-center justify-center">
                      <Icon className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Son nəticə:{' '}
                      <span className="text-navy dark:text-white font-bold">
                        {subject.lastScore}
                      </span>
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">
                    {subject.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {subject.shortDesc}
                  </p>

                  {/* Circular Progress Ring */}
                  <div className="flex items-center justify-center py-4 bg-slate-50 dark:bg-[#0E172A] rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                    <ProgressRing
                      progress={subject.readinessScore}
                      size={110}
                      strokeWidth={10}
                      color="#2563EB"
                      trackColor="#E2E8F0"
                      label="Hazırlıq"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      {subject.completedQuestions} / {subject.totalQuestions} sual həll edildi
                    </span>
                    <span className="text-slate-400">{subject.lastDate}</span>
                  </div>

                  {/* One button "Başla" */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStart(subject.id);
                    }}
                    className="w-full h-12 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Sınağa Başla</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION: Compact Topic Cards with Segmented Tab */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <h2 className="text-xl font-bold text-navy dark:text-white">Mövzular və sual sayı</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedSubject.name} fənni üzrə proqram bölmələri
              </p>
            </div>

            {/* Segmented Tab */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#0E172A] border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              {SUBJECTS_DATA.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`px-4 py-2 rounded-lg transition-all duration-150 whitespace-nowrap ${
                    selectedSubjectId === s.id
                      ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Compact Topic Cards (Topic name and question count only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectTopics.map((topic) => (
              <div
                key={topic.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/70 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-900/60 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-navy dark:text-white group-hover:text-brand transition-colors">
                      {topic.name}
                    </h3>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {topic.questionCount} sual
                  </span>
                  <button
                    onClick={() => onSelectScreen('practice')}
                    className="text-brand dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Məşq et</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
