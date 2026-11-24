import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TestResultItem } from '../types';
import { MathText } from './MathText';
import { QuestionDiagram } from './QuestionDiagram';

export function AnswerReview({ results, isMath }: { results: TestResultItem[]; isMath: boolean }) {
  const [mistakesOnly, setMistakesOnly] = useState(false);
  const mistakes = results.filter((item) => !item.is_correct).length;
  return (
    <section className="bg-surface dark:bg-surface-dark rounded-[20px] p-5 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-calm space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Sualların cavabları və izahları</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Cavabına və izaha baxmaq üçün sualı aç.
          </p>
        </div>
        <div
          role="group"
          aria-label="Cavabları süzgəcdən keçir"
          className="flex gap-1 rounded-full bg-stone-100 dark:bg-inset-dark p-1"
        >
          {[false, true].map((filtered) => (
            <button
              key={String(filtered)}
              type="button"
              aria-pressed={mistakesOnly === filtered}
              onClick={() => setMistakesOnly(filtered)}
              className={
                'rounded-full px-3 py-2 text-sm font-semibold ' +
                (mistakesOnly === filtered
                  ? 'bg-brand text-white dark:bg-brand-400 dark:text-ink'
                  : 'text-stone-600 dark:text-stone-300')
              }
            >
              {filtered ? `Səhv və cavabsız (${mistakes})` : `Hamısı (${results.length})`}
            </button>
          ))}
        </div>
      </header>
      {mistakesOnly && mistakes === 0 && <p>Bu sınaqda səhv və cavabsız sual yoxdur.</p>}
      {results.map((item, index) => {
        if (mistakesOnly && item.is_correct) return null;
        const correct = item.options?.find((option) => option.key === item.correct_answer);
        const answer = item.is_written
          ? undefined
          : item.options?.find((option) => option.key === item.user_answer);
        const feedback = item.explanation;
        const tip = feedback?.rule || feedback?.tip;
        const status = item.is_correct ? 'Düzgün' : item.user_answer === null ? 'Cavabsız' : 'Səhv';
        return (
          <details
            key={item.question_id}
            className="group rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 list-none bg-stone-50 dark:bg-inset-dark [&::-webkit-details-marker]:hidden">
              <span className="min-w-0">
                <span className="block font-bold">
                  Sual {index + 1}{' '}
                  <span className="font-normal text-stone-500 dark:text-stone-400">
                    · {item.topic}
                  </span>
                </span>
                <span className="block mt-1 text-sm text-brand-fg font-semibold break-words">
                  Düzgün cavab&nbsp;{correct && <>{correct.key} · </>}
                  <MathText enabled={isMath} text={correct?.text ?? item.correct_answer} />
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={
                    'font-semibold text-xs ' +
                    (item.is_correct ? 'text-brand-fg' : 'text-amber-700 dark:text-amber-300')
                  }
                >
                  {status}
                </span>
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </span>
            </summary>
            <div className="border-t border-stone-200 dark:border-stone-800 p-4 sm:p-5 space-y-4 break-words">
              {item.passage && (
                <p className="whitespace-pre-wrap rounded-xl bg-stone-100 dark:bg-inset-dark p-4">
                  {item.passage}
                </p>
              )}
              <p className="font-semibold leading-relaxed whitespace-pre-wrap">
                <MathText enabled={isMath} text={item.text} />
              </p>
              {item.image_svg && <QuestionDiagram svg={item.image_svg} />}
              {item.options?.length ? (
                <ul aria-label="Cavab variantları" className="grid gap-2 sm:grid-cols-2">
                  {item.options.map((option) => {
                    const isCorrect = option.key === item.correct_answer;
                    const isSelected = option.key === answer?.key;
                    return (
                      <li
                        key={option.key}
                        className={
                          'min-w-0 rounded-lg border px-3 py-2 ' +
                          (isCorrect
                            ? 'bg-brand-soft dark:bg-brand-950/40 border-brand-fg'
                            : isSelected
                              ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                              : 'border-stone-200 dark:border-stone-800')
                        }
                      >
                        <strong className="mr-2">{option.key}</strong>
                        <MathText enabled={isMath} text={option.text} />
                        {(isCorrect || isSelected) && (
                          <span className="block mt-1 text-xs font-semibold">
                            {isCorrect && isSelected
                              ? 'Düzgün · sənin cavabın'
                              : isCorrect
                                ? 'Düzgün cavab'
                                : 'Sənin cavabın'}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {(!answer || item.user_answer === null) && (
                <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">
                  Sənin cavabın&nbsp;
                  <MathText enabled={isMath} text={item.user_answer ?? 'Cavab verilməyib'} />
                </p>
              )}
              {feedback && (feedback.summary || feedback.steps?.length || tip) && (
                <div className="rounded-xl bg-brand-soft p-4 dark:bg-brand-950/35 space-y-2">
                  <h4 className="font-bold">İzah</h4>
                  {feedback.summary && (
                    <p className="leading-relaxed">
                      <MathText enabled={isMath} text={feedback.summary} />
                    </p>
                  )}
                  {feedback.steps?.length ? (
                    <ol className="list-decimal pl-5 space-y-2">
                      {feedback.steps.map((step, i) => (
                        <li key={i}>
                          <MathText enabled={isMath} text={step} />
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {tip && (
                    <p>
                      <MathText enabled={isMath} text={tip} />
                    </p>
                  )}
                </div>
              )}
            </div>
          </details>
        );
      })}
    </section>
  );
}
