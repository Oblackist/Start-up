import React from 'react';
import type { Difficulty } from '../types';
import { DIFFICULTY_META } from '../data/catalog';

const TONE: Record<Difficulty, { bar: string; text: string; bg: string }> = {
  easy: {
    bar: 'bg-sage-500',
    text: 'text-sage-700 dark:text-sage-300',
    bg: 'bg-sage-50 dark:bg-sage-950/50 border-sage-200 dark:border-sage-900/60',
  },
  medium: {
    bar: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
  },
  hard: {
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50',
  },
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

/** Çətinlik səviyyəsi: 1–3 zolaq və mətn (yalnız rənglə deyil, say ilə də fərqlənir) */
export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className = '' }) => {
  const meta = DIFFICULTY_META[difficulty];
  const tone = TONE[difficulty];
  return (
    <span
      title={meta.description}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.bg} ${tone.text} ${className}`}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`w-1 rounded-sm ${n <= meta.level ? tone.bar : 'bg-stone-300 dark:bg-stone-700'}`}
            style={{ height: 4 + n * 3 }}
          />
        ))}
      </span>
      {meta.label}
    </span>
  );
};
