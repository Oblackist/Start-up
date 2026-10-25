import React, { useState } from 'react';
import { ScreenType } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import { RESULT_MISTAKES_DATA } from '../data/examData';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ResultScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ onSelectScreen }) => {
  const mistakes = RESULT_MISTAKES_DATA;
  const [expandedMistakeId, setExpandedMistakeId] = useState<number | null>(1);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-10">
        {/* Title & Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-brand dark:text-blue-400 tracking-wider uppercase mb-1">
              Sınaq İmtahanı Hesabatı
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy dark:text-white tracking-tight">
              Nəticə və Təhlil
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="lg:col-span-7 bg-white dark:bg-surface-dark rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-8">
            {/* Large Readiness Ring 85% */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ümumi Göstərici
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-navy dark:text-white">
                  Hazırlıq səviyyəsi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                  Riyaziyyat fənni üzrə buraxılış imtahanı suallarının 85%-nə hazırsan.
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-accent dark:text-teal-400 text-xs font-bold border border-teal-200/60 dark:border-teal-900/60">
                    +12% əvvəlki testə görə
                  </span>
                </div>
              </div>

              <div className="shrink-0 p-3 bg-slate-50 dark:bg-[#0E172A] rounded-2xl border border-slate-100 dark:border-slate-800">
                <ProgressRing
                  progress={85}
                  size={150}
                  strokeWidth={14}
                  color="#2563EB"
                  trackColor="#E2E8F0"
                  label="Hazırlıq"
                  sublabel="Yüksək nəticə"
                />
              </div>
            </div>

            {/* Four Stat Cards with Different Values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Stat 1: Düzgün 17 */}
              <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Düzgün</span>
                </div>
                <div className="text-2xl font-extrabold text-teal-800 dark:text-teal-300 tabular-nums">
                  17
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  85% dəqiqlik
                </div>
              </div>

              {/* Stat 2: Səhv 2 */}
              <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span>Səhv</span>
                </div>
                <div className="text-2xl font-extrabold text-red-700 dark:text-red-400 tabular-nums">
                  2
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  10% xəta
                </div>
              </div>

              {/* Stat 3: Boş 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark-alt border border-slate-200/80 dark:border-slate-800 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>Boş</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                  1
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  5% cavabsız
                </div>
              </div>

              {/* Stat 4: Sərf olunan vaxt 31:40 */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-brand dark:text-blue-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Sərf vaxtı</span>
                </div>
                <div className="text-2xl font-extrabold text-brand dark:text-blue-300 font-mono tabular-nums">
                  31:40
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Orta 1:35/sual
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: "Zəif mövzular" */}
          <div className="lg:col-span-5 bg-white dark:bg-surface-dark rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-navy dark:text-white">Zəif mövzular</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Prioritet sıra ilə</span>
            </div>

            <div className="space-y-4">
              {/* Topic 1: Tənliklər */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Tənliklər sistemi
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                      Yüksək xəta
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    54% dəqiqlik · 5 səhv
                  </p>
                </div>
                <button
                  onClick={() => onSelectScreen('practice')}
                  className="text-xs font-bold text-brand dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Məşq et</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Topic 2: Faizlər */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Faiz və nisbət
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Orta xəta
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    62% dəqiqlik · 4 səhv
                  </p>
                </div>
                <button
                  onClick={() => onSelectScreen('practice')}
                  className="text-xs font-bold text-brand dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Məşq et</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Topic 3: Həndəsə */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E172A] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Həndəsə: Medianlar
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Orta xəta
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    68% dəqiqlik · 3 səhv
                  </p>
                </div>
                <button
                  onClick={() => onSelectScreen('practice')}
                  className="text-xs font-bold text-brand dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Məşq et</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onSelectScreen('practice')}
                className="w-full h-11 rounded-[12px] bg-brand-soft dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-brand dark:text-blue-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span>Bütün zəif mövzuları məşq et</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* BELOW: "Səhvlərin təhlili" ACCORDION */}
        <div className="bg-white dark:bg-surface-dark rounded-[20px] p-8 border border-slate-200 dark:border-slate-800 shadow-calm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-navy dark:text-white">
                Səhvlərin təhlili və aydın izahlar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Səhv cavab verdiyin sualların addım-addım həlli və qaydaları
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`h-10 px-4 rounded-[12px] border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isSaved
                    ? 'bg-blue-50 border-blue-200 text-brand dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saxlanıldı ✓' : 'Saxla'}</span>
              </button>

              <button
                onClick={() => onSelectScreen('practice')}
                className="h-10 px-5 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Fərdi məşqə keç</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Accordion list */}
          <div className="space-y-4">
            {mistakes.map((m) => {
              const isExpanded = expandedMistakeId === m.id;
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-[#0E172A]/50 transition-all"
                >
                  {/* Header Row */}
                  <div
                    onClick={() => setExpandedMistakeId(isExpanded ? null : m.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 dark:hover:bg-[#14223d]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs">
                        #{m.questionNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-navy dark:text-white">
                            Sual {m.questionNumber}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {m.topic}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {m.questionText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-3 text-xs">
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Sənin: {m.studentAnswer}
                        </span>
                        <span className="text-teal-600 dark:text-teal-400 font-bold">
                          Düzgün: {m.correctAnswer}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Body: Answers + AI İzahı Panel */}
                  {isExpanded && (
                    <div className="p-6 pt-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-surface-dark space-y-6">
                      {/* Answers Compare Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
                            Sənin cavabın:
                          </span>
                          <span className="text-base font-bold text-red-700 dark:text-red-300">
                            {m.studentAnswer} (Səhv)
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/50">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                            Düzgün cavab:
                          </span>
                          <span className="text-base font-bold text-teal-700 dark:text-teal-300">
                            {m.correctAnswer} (Doğru)
                          </span>
                        </div>
                      </div>

                      {/* AI İzahı Panel with Step-by-Step */}
                      <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-[#0E172A] border border-blue-100 dark:border-blue-900/40 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand dark:text-blue-400">
                          <Sparkles className="w-4 h-4" />
                          <span>AI İzahı və Addım-addım həll yolu</span>
                        </div>

                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {m.aiExplanation.summary}
                        </p>

                        <div className="space-y-2 bg-white dark:bg-surface-dark p-4 rounded-xl border border-blue-100/70 dark:border-slate-800">
                          {m.aiExplanation.steps.map((st, i) => (
                            <div
                              key={i}
                              className="text-xs text-slate-700 dark:text-slate-300 font-mono"
                            >
                              {st}
                            </div>
                          ))}
                        </div>

                        <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                          <span className="font-bold mr-1">Qızıl qayda:</span>
                          {m.aiExplanation.tip}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
