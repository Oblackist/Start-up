import { useId } from 'react';
import type { Grade } from '../types';

const GRADES = [9, 10, 11] as const;
export const gradeLabel = (grade: Grade) => `${grade}-${grade === 11 ? 'ci' : 'cu'}`;

export function GradePicker({
  grade,
  onChange,
}: {
  grade: Grade;
  onChange: (value: Grade) => void;
}) {
  const name = useId();
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
        Sinif
      </span>
      <div
        role="radiogroup"
        aria-label="Sinif"
        className="inline-flex rounded-full border border-stone-200 bg-stone-100 p-1 dark:border-stone-800 dark:bg-inset-dark"
      >
        {GRADES.map((value) => (
          <label key={value} className="cursor-pointer">
            <input
              className="peer sr-only"
              type="radio"
              name={name}
              value={value}
              checked={grade === value}
              onChange={() => onChange(value)}
            />
            <span className="flex h-8 items-center rounded-full px-4 text-sm font-semibold text-stone-600 transition-colors hover:text-brand-fg peer-checked:bg-brand peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-fg dark:text-stone-300 dark:peer-checked:bg-brand-400 dark:peer-checked:text-ink">
              {gradeLabel(value)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
