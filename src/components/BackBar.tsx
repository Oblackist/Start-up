import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { ScreenType } from '../types';
import { SCREEN_PARENTS, SCREEN_PATHS, SCREEN_TITLES } from '../routes';

interface BackBarProps {
  screen: ScreenType;
}

/** Brauzer tarixçəsi varsa bir addım geri, yoxsa ana səhifəyə (və ya məntiqi "valideyn" səhifəyə) qaytarır */
export const BackBar: React.FC<BackBarProps> = ({ screen }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    const hasHistory = (window.history.state?.idx ?? 0) > 0;
    if (hasHistory) navigate(-1);
    else navigate(SCREEN_PATHS[SCREEN_PARENTS[screen] ?? 'landing']);
  };

  return (
    <div className="bg-canvas dark:bg-canvas-dark transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-[10px] border border-stone-200 dark:border-stone-800 bg-surface dark:bg-surface-dark text-sm font-semibold text-stone-700 dark:text-stone-200 hover:text-brand-fg hover:border-brand-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri
        </button>
        <span className="text-sm text-stone-400 dark:text-stone-500 truncate">
          {SCREEN_TITLES[screen]}
        </span>
      </div>
    </div>
  );
};
