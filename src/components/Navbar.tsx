import React from 'react';
import { Link } from 'react-router';
import { LogOut, Moon, Sun } from 'lucide-react';
import type { AuthUser, ScreenType } from '../types';
import { SCREEN_PATHS } from '../routes';
import { BrandLogo } from './BrandLogo';
import { Avatar } from './Avatar';

interface NavbarProps {
  currentScreen: ScreenType;
  isDark: boolean;
  onSetDark: (dark: boolean) => void;
  user: AuthUser | null;
  onLogout: () => void;
}

const NAV_ITEMS: { screen: ScreenType; label: string; match: ScreenType[] }[] = [
  { screen: 'landing', label: 'Ana səhifə', match: ['landing'] },
  { screen: 'subjects', label: 'Fənnlər', match: ['subjects', 'sections', 'topics', 'exam-info'] },
  { screen: 'ranking', label: 'Reytinq', match: ['ranking'] },
  { screen: 'packages', label: 'Paketlər', match: ['packages'] },
  { screen: 'dashboard', label: 'İnkişaf paneli', match: ['dashboard', 'result', 'practice'] },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  isDark,
  onSetDark,
  user,
  onLogout,
}) => {
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
        <Link to={SCREEN_PATHS.landing} className="flex items-center gap-2.5 shrink-0 group">
          <BrandLogo />
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
        </Link>

        {/* Naviqasiya: aktiv səhifə fərqləndirilir */}
        <nav
          aria-label="Əsas naviqasiya"
          className="hidden lg:flex items-center gap-1 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active = item.match.includes(currentScreen);
            return (
              <Link
                key={item.screen}
                to={SCREEN_PATHS[item.screen]}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3.5 py-2 rounded-[10px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-brand-soft dark:bg-brand-950/50 text-brand-fg font-semibold after:absolute after:left-3.5 after:right-3.5 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-brand-fg'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-dark hover:text-ink dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="hidden 2xl:flex ml-2 text-xs text-stone-400 dark:text-stone-500 items-center gap-1.5 cursor-not-allowed select-none whitespace-nowrap">
            <span>Interview Arena</span>
            <span className="text-[10px] bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-medium">
              Tezliklə
            </span>
          </span>
        </nav>

        {/* Hərəkətlər */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
              <Link
                to={SCREEN_PATHS.profile}
                title="Profil"
                aria-current={currentScreen === 'profile' ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-[12px] pl-1 pr-1 sm:pr-3 py-1 transition-colors ${
                  currentScreen === 'profile'
                    ? 'bg-brand-soft dark:bg-brand-950/50'
                    : 'hover:bg-stone-100 dark:hover:bg-surface-dark'
                }`}
              >
                <Avatar name={user.fullName} src={user.avatarUrl} size={36} />
                <span className="hidden sm:block text-sm font-semibold text-ink dark:text-white max-w-[140px] truncate">
                  {user.fullName}
                </span>
              </Link>
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
              <Link
                to={SCREEN_PATHS.login}
                className={`h-10 px-3 sm:px-4 rounded-[12px] text-sm font-semibold transition-colors whitespace-nowrap flex items-center ${
                  currentScreen === 'login'
                    ? 'text-brand-fg'
                    : 'text-stone-700 dark:text-stone-200 hover:text-brand-fg'
                }`}
              >
                Daxil ol
              </Link>
              <Link
                to={SCREEN_PATHS.register}
                className="h-10 px-3.5 sm:px-5 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink active:scale-[0.98] text-white text-sm font-semibold transition-all duration-150 shadow-sm flex items-center justify-center whitespace-nowrap"
              >
                <span className="hidden sm:inline">Qeydiyyatdan keç</span>
                <span className="sm:hidden">Qeydiyyat</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
