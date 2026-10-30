import React, { useState, useEffect } from 'react';
import { ScreenType } from '../types';
import { TEST_QUESTIONS } from '../data/examData';
import { ArrowLeft, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface TestScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
  onFinishTest?: (answers: Record<number, string>) => void;
}

export const TestScreen: React.FC<TestScreenProps> = ({ onSelectScreen, onFinishTest }) => {
  // Initialized to Question 5 (index 4) with option C selected as requested in specifications
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(4);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'B',
    5: 'C', // Selected C for Sual 5
  });

  // Calm timer initialized to 28:14 (1694 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(28 * 60 + 14);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = TEST_QUESTIONS[currentQuestionIndex] || TEST_QUESTIONS[0];
  const selectedOption = userAnswers[currentQ.id];
  const answeredCount = Object.keys(userAnswers).length;
  const progressPct = (answeredCount / TEST_QUESTIONS.length) * 100;

  const handleSelectOption = (key: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: key,
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < TEST_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (onFinishTest) {
      onFinishTest(userAnswers);
    }
    onSelectScreen('result');
  };

  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-paper flex flex-col transition-colors">
      {/* MINIMAL TOP BAR */}
      <header className="sticky top-0 z-40 bg-surface/95 dark:bg-nav-dark/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Back Arrow & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectScreen('subjects')}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Geri qayıt"
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 dark:text-white text-base">
                Riyaziyyat · Sınaq
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">(Buraxılış 1)</span>
            </div>
          </div>

          {/* Timer Pill "28:14" (Blue, no flashing) & Finish Button */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              title={
                isTimerRunning
                  ? 'Taymeri dayandırmaq üçün toxunun'
                  : 'Taymeri davam etdirmək üçün toxunun'
              }
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900/60 text-brand-fg dark:text-brand-400 text-sm font-semibold tracking-wider tabular-nums cursor-pointer select-none"
            >
              <Clock className="w-4 h-4 text-brand-fg dark:text-brand-400" strokeWidth={1.75} />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="h-10 px-4 rounded-[12px] bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-surface dark:text-stone-900 text-white text-xs font-semibold transition-colors"
            >
              Sınağı bitir
            </button>
          </div>
        </div>

        {/* Thin Progress Bar under the bar */}
        <div className="w-full h-1 bg-stone-100 dark:bg-stone-800">
          <div
            className="h-full bg-brand-fg transition-all duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* TEST MAIN CONTAINER */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Compact Grid of Question Numbers 1–20 */}
          <aside className="lg:col-span-3 order-2 lg:order-1 bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800 shadow-calm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Suallar
              </span>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 tabular-nums">
                {answeredCount} / 20 cavablandı
              </span>
            </div>

            {/* Grid 1 to 20 */}
            <div className="grid grid-cols-5 gap-2.5">
              {TEST_QUESTIONS.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = Boolean(userAnswers[q.id]);

                let buttonStyle =
                  'bg-stone-100 dark:bg-surface-dark-alt text-stone-600 dark:text-stone-300 border-transparent hover:bg-stone-200 dark:hover:bg-stone-700'; // unanswered neutral gray
                if (isCurrent) {
                  buttonStyle = 'bg-brand text-white border-brand-fg shadow-sm font-bold'; // current solid blue
                } else if (isAnswered) {
                  buttonStyle =
                    'bg-brand-100 dark:bg-brand-950 text-brand-fg dark:text-brand-300 border-brand-200 dark:border-brand-900 font-semibold'; // answered light blue
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl text-xs flex items-center justify-center transition-all duration-150 border ${buttonStyle}`}
                  >
                    {q.id}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2 text-[11px] text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-brand" />
                <span>Hazırkı sual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-900" />
                <span>Cavablandırılmış</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-stone-100 dark:bg-surface-dark-alt" />
                <span>Cavablandırılmamış</span>
              </div>
            </div>
          </aside>

          {/* CENTER: One Large White Question Card */}
          <div className="lg:col-span-9 order-1 lg:order-2 space-y-6">
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-8 sm:p-10 border border-stone-200 dark:border-stone-800 shadow-calm space-y-8">
              {/* Question Header & Meta */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-fg dark:text-brand-400">
                    Sual {currentQ.id} / 20
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">·</span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                    {currentQ.topic}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  1 bal
                </span>
              </div>

              {/* Question Text */}
              <div className="py-2">
                <p className="text-lg sm:text-xl font-semibold text-ink dark:text-white leading-relaxed">
                  {currentQ.text}
                </p>
              </div>

              {/* 4 Options: A, B, C, D */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOption === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full min-h-[56px] p-4 rounded-xl text-left border transition-all duration-150 flex items-center gap-4 group ${
                        isSelected
                          ? 'border-brand-fg bg-brand-soft dark:bg-brand-950/40 text-ink dark:text-white ring-1 ring-brand-fg'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-stone-50 dark:hover:bg-surface-dark-alt text-stone-800 dark:text-stone-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-brand text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:bg-stone-200'
                        }`}
                      >
                        {opt.key}
                      </div>
                      <span className="text-base font-medium">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Buttons: Əvvəlki (ghost) and Sonrakı (solid) */}
              <div className="pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className={`h-12 px-6 rounded-[12px] text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
                    currentQuestionIndex === 0
                      ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-[0.98]'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Əvvəlki</span>
                </button>

                <div className="flex items-center gap-3">
                  {currentQuestionIndex === TEST_QUESTIONS.length - 1 ? (
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="h-12 px-7 rounded-[12px] bg-accent hover:bg-sage-600 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center gap-2"
                    >
                      <span>Sınağı tamamla</span>
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="h-12 px-7 rounded-[12px] bg-brand hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 shadow-sm flex items-center gap-2"
                    >
                      <span>Sonrakı</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CONFIRMATION SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-calm-lg space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-ink dark:text-white">
              Sınağı tamamlamaq istəyirsən?
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              20 sualdan{' '}
              <span className="font-bold text-stone-900 dark:text-white">{answeredCount}</span>{' '}
              ədədini cavablandırmısan. Qalan vaxtın:{' '}
              <span className="font-mono font-bold text-brand-fg">
                {formatTimer(secondsRemaining)}
              </span>
              .
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="h-11 px-5 rounded-[12px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors"
              >
                Davam et
              </button>
              <button
                onClick={handleSubmit}
                className="h-11 px-6 rounded-[12px] bg-brand hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Nəticəni gör
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
