import { useState, useEffect } from 'react';
import { ScreenType, SubjectId } from './types';
import { Navbar } from './components/Navbar';
import { MobileTabBar } from './components/MobileTabBar';
import { DesignSystemShowcase } from './components/DesignSystemShowcase';
import { LandingScreen } from './screens/LandingScreen';
import { SubjectsScreen } from './screens/SubjectsScreen';
import { TestScreen } from './screens/TestScreen';
import { ResultScreen } from './screens/ResultScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [showDesignSystem, setShowDesignSystem] = useState<boolean>(false);
  // TODO: seçilmiş fənni TestScreen-ə ötürmək (hazırda test sualları statikdir)
  const [, setActiveSubject] = useState<SubjectId>('math');

  // Sync dark class on root document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  const handleToggleMobileFrame = () => {
    setIsMobileFrame((prev) => !prev);
  };

  const handleStartSubjectTest = (subjectId: SubjectId) => {
    setActiveSubject(subjectId);
    setCurrentScreen('test');
  };

  // Render the active screen content
  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <LandingScreen onSelectScreen={setCurrentScreen} />;
      case 'subjects':
        return (
          <SubjectsScreen
            onSelectScreen={setCurrentScreen}
            onStartSubjectTest={handleStartSubjectTest}
          />
        );
      case 'test':
        return <TestScreen onSelectScreen={setCurrentScreen} />;
      case 'result':
        return <ResultScreen onSelectScreen={setCurrentScreen} />;
      case 'practice':
        return <PracticeScreen onSelectScreen={setCurrentScreen} />;
      case 'dashboard':
        return <DashboardScreen onSelectScreen={setCurrentScreen} />;
      default:
        return <LandingScreen onSelectScreen={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-[#0F172A] dark:text-[#E2E8F0] flex flex-col transition-colors selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        isDark={isDark}
        onToggleDark={handleToggleDark}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={handleToggleMobileFrame}
        onOpenDesignSystem={() => setShowDesignSystem(true)}
      />

      {/* Main View Area: either 1440px Desktop or 390px Mobile Frame Simulator */}
      {isMobileFrame ? (
        <div className="flex-1 py-8 px-4 flex flex-col items-center justify-start bg-slate-200/70 dark:bg-[#050912]">
          {/* Mobile frame header controls */}
          <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 bg-white dark:bg-surface-dark px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-800 shadow-xs">
              <Smartphone className="w-3.5 h-3.5 text-brand" />
              <span>Mobil Simulyasiya: 390px × 844px (iPhone 14/15)</span>
            </span>
            <button
              onClick={() => setIsMobileFrame(false)}
              className="text-brand dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>1440px rejimə keç</span>
            </button>
          </div>

          {/* 390px Mobile Viewport Container */}
          <div className="w-[390px] h-[844px] bg-canvas dark:bg-canvas-dark rounded-[44px] border-[10px] border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden relative flex flex-col">
            {/* Dynamic Island / Speaker notch simulation */}
            <div className="h-7 w-full bg-slate-800 dark:bg-slate-700 flex items-center justify-center shrink-0">
              <div className="w-24 h-4 bg-black rounded-full" />
            </div>

            {/* Scrollable screen content */}
            <div className="flex-1 overflow-y-auto pb-16">{renderScreen()}</div>

            {/* Mobile Bottom Tab Bar with 48px touch targets */}
            <div className="absolute bottom-0 left-0 right-0">
              <MobileTabBar currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />
            </div>
          </div>
        </div>
      ) : (
        /* Standard 1440px Desktop Baseline */
        <div className="flex-1 flex flex-col">
          {renderScreen()}

          {/* For real mobile viewports, show bottom tab bar on small screens (< 768px) */}
          <div className="block md:hidden">
            <MobileTabBar currentScreen={currentScreen} onSelectScreen={setCurrentScreen} />
          </div>
        </div>
      )}

      {/* Design System Gallery Modal */}
      <DesignSystemShowcase isOpen={showDesignSystem} onClose={() => setShowDesignSystem(false)} />
    </div>
  );
}
