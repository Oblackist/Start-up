import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  /** Verilərsə, ulduzlar seçilə bilən olur */
  onChange?: (value: number) => void;
  size?: number;
  label?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 18, label }) => {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const shown = hover || value;

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={label ?? `${value} / 5 ulduz`}
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(shown);
        const star = (
          <Star
            style={{ width: size, height: size }}
            className={
              filled ? 'fill-gold text-gold' : 'fill-transparent text-stone-300 dark:text-stone-600'
            }
            strokeWidth={1.75}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ulduz`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5 rounded transition-transform hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
};
