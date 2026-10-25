import React from 'react';
import { Home, BookOpen, Target, User } from 'lucide-react';
import { ScreenType } from '../types';

interface MobileTabBarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentScreen, onSelectScreen }) => {
  const tabs = [
    { id: 'landing' as ScreenType, label: 'Ana səhifə', icon: Home },
    { id: 'subjects' as ScreenType, label: 'Fənnlər', icon: BookOpen },
    { id: 'practice' as ScreenType, label: 'Məşq', icon: Target },
    { id: 'dashboard' as ScreenType, label: 'Profil', icon: User },
  ];

  return (
    <nav
      aria-label="Mobil naviqasiya paneli"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-calm"
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
                  ? 'text-brand dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
