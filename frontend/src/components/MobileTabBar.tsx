import React from 'react';
import { Link } from '../lib/navigation';
import { BookOpen, Home, Trophy, User } from 'lucide-react';
import type { ScreenType } from '../types';
import { SCREEN_PATHS } from '../routes';

interface MobileTabBarProps {
  currentScreen: ScreenType;
  isLoggedIn?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentScreen,
  isLoggedIn = false,
}) => {
  const tabs: { screen: ScreenType; label: string; icon: typeof Home; match: ScreenType[] }[] = [
    { screen: 'landing', label: 'Ana səhifə', icon: Home, match: ['landing'] },
    {
      screen: 'subjects',
      label: 'Fənlər',
      icon: BookOpen,
      match: ['subjects', 'topics', 'exam-info'],
    },
    { screen: 'ranking', label: 'Reytinq', icon: Trophy, match: ['ranking'] },
    isLoggedIn
      ? { screen: 'profile', label: 'Profil', icon: User, match: ['profile', 'dashboard'] }
      : { screen: 'login', label: 'Daxil ol', icon: User, match: ['login', 'register'] },
  ];

  return (
    <nav
      aria-label="Mobil naviqasiya paneli"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-calm backdrop-blur-md lg:hidden dark:border-stone-800 dark:bg-nav-dark/95"
    >
      <div className="max-w-[420px] mx-auto grid grid-cols-4 px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match.includes(currentScreen);
          return (
            <Link
              key={tab.screen}
              to={SCREEN_PATHS[tab.screen]}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 rounded-xl ${
                isActive
                  ? 'text-brand-fg font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-ink dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[11px] leading-tight">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
