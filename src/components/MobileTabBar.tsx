import React from 'react';
import { Home, BookOpen, Target, User } from 'lucide-react';
import { ScreenType } from '../types';

interface MobileTabBarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  isLoggedIn?: boolean;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentScreen,
  onSelectScreen,
  isLoggedIn = false,
}) => {
  const tabs = [
    { id: 'landing' as ScreenType, label: 'Ana səhifə', icon: Home },
    { id: 'subjects' as ScreenType, label: 'Fənnlər', icon: BookOpen },
    { id: 'practice' as ScreenType, label: 'Məşq', icon: Target },
    isLoggedIn
      ? { id: 'dashboard' as ScreenType, label: 'Profil', icon: User }
      : { id: 'login' as ScreenType, label: 'Daxil ol', icon: User },
  ];

  return (
    <nav
      aria-label="Mobil naviqasiya paneli"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 dark:bg-nav-dark/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 shadow-calm"
    >
      <div className="max-w-[420px] mx-auto grid grid-cols-4 px-2 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectScreen(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors duration-150 rounded-xl ${
                isActive
                  ? 'text-brand-fg dark:text-brand-400 font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              <span className="text-[11px] leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
