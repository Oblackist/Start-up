import React from 'react';
import { ScreenType } from '../types';
import { Moon, Sun, Monitor, Smartphone, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  isDark: boolean;
  onToggleDark: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onOpenDesignSystem?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  isDark,
  onToggleDark,
  isMobileFrame,
  onToggleMobileFrame,
  onOpenDesignSystem,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B1220]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Zone 1: Brand & Current Module */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectScreen('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-[12px] bg-brand text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-blue-700 transition-colors">
              CA
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-navy dark:text-white leading-none">
                  Career Arena
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-brand dark:text-blue-400 px-1.5 py-0.5 rounded">
                  Exam Arena
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Buraxılış imtahanları
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onSelectScreen('subjects')}
            className={`hover:text-brand dark:hover:text-blue-400 transition-colors whitespace-nowrap ${
              currentScreen === 'subjects' ? 'text-brand dark:text-blue-400 font-semibold' : ''
            }`}
          >
            Fənnlər
          </button>

          <button
            onClick={() => {
              if (currentScreen !== 'landing') {
                onSelectScreen('landing');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="hover:text-brand dark:hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            Necə işləyir
          </button>

          <button
            onClick={() => {
              if (currentScreen !== 'landing') {
                onSelectScreen('landing');
                setTimeout(() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              } else {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="hover:text-brand dark:hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            Qiymətlər
          </button>

          <button
            onClick={() => onSelectScreen('dashboard')}
            className={`hover:text-brand dark:hover:text-blue-400 transition-colors whitespace-nowrap ${
              currentScreen === 'dashboard' ? 'text-brand dark:text-blue-400 font-semibold' : ''
            }`}
          >
            İnkişaf paneli
          </button>

          {/* Future module muted item */}
          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 cursor-not-allowed select-none">
            <span>Interview Arena</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded font-medium">
              Tezliklə
            </span>
          </span>
        </nav>

        {/* Zone 3: Actions & Quick Screen Navigation Controller */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Screen quick switcher (to easily navigate all 6 screens) */}
          <div className="hidden xl:flex items-center bg-slate-100 dark:bg-surface-dark p-1 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => onSelectScreen('landing')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                currentScreen === 'landing'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              1. Landing
            </button>
            <button
              onClick={() => onSelectScreen('subjects')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                currentScreen === 'subjects'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              2. Fənnlər
            </button>
            <button
              onClick={() => onSelectScreen('test')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                currentScreen === 'test'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              3. Sınaq (Test)
            </button>
            <button
              onClick={() => onSelectScreen('result')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                currentScreen === 'result'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              4. Nəticə
            </button>
            <button
              onClick={() => onSelectScreen('practice')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                currentScreen === 'practice'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              5. Məşq
            </button>
            <button
              onClick={() => onSelectScreen('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                currentScreen === 'dashboard'
                  ? 'bg-white dark:bg-[#1E293B] text-brand dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              6. Panel
            </button>
          </div>

          {/* Mobile 390px frame inspector toggle */}
          <button
            onClick={onToggleMobileFrame}
            title={
              isMobileFrame
                ? '1440px Masaüstü rejiminə qayıt'
                : '390px Mobil simulyasiya çərçivəsini aç'
            }
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isMobileFrame
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">1440px Masaüstü</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">390px Mobil</span>
              </>
            )}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            aria-label="Qaranlıq rejim"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Design system gallery modal toggle */}
          {onOpenDesignSystem && (
            <button
              onClick={onOpenDesignSystem}
              title="Dizayn sistemini göstər (Komponentlər və vəziyyətlər)"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-slate-600 dark:text-slate-300 hover:text-brand transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Auth buttons */}
          <button
            onClick={() => onSelectScreen('dashboard')}
            className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand dark:hover:text-blue-400 px-3 py-2 rounded-[12px] transition-colors"
          >
            Daxil ol
          </button>

          <button
            onClick={() => onSelectScreen('test')}
            className="h-11 px-5 rounded-[12px] bg-brand hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-150 shadow-sm flex items-center justify-center whitespace-nowrap"
          >
            Pulsuz başla
          </button>
        </div>
      </div>
    </header>
  );
};
