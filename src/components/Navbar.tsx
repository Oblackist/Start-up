import React from 'react';
import { AuthUser, ScreenType } from '../types';
import { LogOut, Moon, Monitor, Smartphone, Sun } from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  isDark: boolean;
  onSetDark: (dark: boolean) => void;
  user: AuthUser | null;
  onLogout: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

const getInitials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  isDark,
  onSetDark,
  user,
  onLogout,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  const scrollToSection = (id: string) => {
    if (currentScreen !== 'landing') {
      onSelectScreen('landing');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const linkClass = (active: boolean) =>
    `hover:text-brand-fg transition-colors whitespace-nowrap ${
      active ? 'text-brand-fg font-semibold' : ''
    }`;

  const themeButtonClass = (active: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
      active
        ? 'bg-brand text-white dark:bg-brand-400 dark:text-ink'
        : 'text-stone-500 dark:text-stone-400 hover:text-ink dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-surface/90 dark:bg-nav-dark/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brend */}
        <button
          onClick={() => onSelectScreen('landing')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-10 h-10 rounded-[12px] bg-brand text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-brand-700 transition-colors">
            CA
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-ink dark:text-white leading-none">
                Career Arena
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-fg px-1.5 py-0.5 rounded">
                Exam Arena
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Buraxılış imtahanları
            </span>
          </div>
        </button>

        {/* Naviqasiya */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          <button
            onClick={() => onSelectScreen('subjects')}
            className={linkClass(currentScreen === 'subjects')}
          >
            Fənnlər
          </button>
          <button onClick={() => scrollToSection('how-it-works')} className={linkClass(false)}>
            Necə işləyir
          </button>
          <button onClick={() => scrollToSection('pricing')} className={linkClass(false)}>
            Qiymətlər
          </button>
          <button
            onClick={() => onSelectScreen('dashboard')}
            className={linkClass(currentScreen === 'dashboard')}
          >
            İnkişaf paneli
          </button>
          <span className="hidden xl:flex text-xs text-stone-400 dark:text-stone-500 items-center gap-1.5 cursor-not-allowed select-none whitespace-nowrap">
            <span>Interview Arena</span>
            <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 px-1.5 py-0.5 rounded font-medium">
              Tezliklə
            </span>
          </span>
        </nav>

        {/* Hərəkətlər */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobil çərçivə simulyatoru: yalnız `npm run dev` zamanı görünür */}
          {import.meta.env.DEV && (
            <button
              onClick={onToggleMobileFrame}
              title={isMobileFrame ? 'Masaüstü rejiminə qayıt' : '390px mobil simulyasiyanı aç'}
              aria-label="Mobil simulyasiya"
              className={`hidden md:flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                isMobileFrame
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface dark:bg-surface-dark text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:text-brand-fg'
              }`}
            >
              {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}

          {/* İşıqlı / Qaranlıq rejim: günəş = light, ay = dark */}
          <div
            role="group"
            aria-label="Rəng rejimi"
            className="flex items-center gap-0.5 rounded-full border border-stone-200 dark:border-stone-800 bg-surface dark:bg-surface-dark p-0.5"
          >
            <button
              type="button"
              onClick={() => onSetDark(false)}
              aria-pressed={!isDark}
              aria-label="İşıqlı rejim"
              title="İşıqlı rejim"
              className={themeButtonClass(!isDark)}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSetDark(true)}
              aria-pressed={isDark}
              aria-label="Qaranlıq rejim"
              title="Qaranlıq rejim"
              className={themeButtonClass(isDark)}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {user ? (
            <>
              <button
                onClick={() => onSelectScreen('dashboard')}
                title={user.fullName}
                className="flex items-center gap-2.5 rounded-[12px] pl-1 pr-1 sm:pr-3 py-1 hover:bg-stone-100 dark:hover:bg-surface-dark transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-soft dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/60 text-sm font-bold text-brand-fg">
                  {getInitials(user.fullName)}
                </span>
                <span className="hidden sm:block text-sm font-semibold text-ink dark:text-white max-w-[140px] truncate">
                  {user.fullName}
                </span>
              </button>
              <button
                onClick={onLogout}
                aria-label="Çıxış"
                title="Çıxış"
                className="flex h-9 items-center gap-1.5 rounded-[12px] px-2.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-brand-fg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Çıxış</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectScreen('login')}
                className={`h-10 px-3 sm:px-4 rounded-[12px] text-sm font-semibold transition-colors whitespace-nowrap ${
                  currentScreen === 'login'
                    ? 'text-brand-fg'
                    : 'text-stone-700 dark:text-stone-200 hover:text-brand-fg'
                }`}
              >
                Daxil ol
              </button>
              <button
                onClick={() => onSelectScreen('register')}
                className="h-10 px-3.5 sm:px-5 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink active:scale-[0.98] text-white text-sm font-semibold transition-all duration-150 shadow-sm flex items-center justify-center whitespace-nowrap"
              >
                <span className="hidden sm:inline">Qeydiyyatdan keç</span>
                <span className="sm:hidden">Qeydiyyat</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
