import { useState, useEffect } from 'react';
import { AuthUser, ScreenType, SubjectId } from './types';
import { Navbar } from './components/Navbar';
import { MobileTabBar } from './components/MobileTabBar';
import { LandingScreen } from './screens/LandingScreen';
import { SubjectsScreen } from './screens/SubjectsScreen';
import { TestScreen } from './screens/TestScreen';
import { ResultScreen } from './screens/ResultScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import { useTheme } from './hooks/useTheme';
import { getSession, logout } from './services/authService';
import { Smartphone, Monitor } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const { isDark, setTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(getSession);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  // TODO: seçilmiş fənni TestScreen-ə ötürmək (hazırda test sualları statikdir)
  const [, setActiveSubject] = useState<SubjectId>('math');

  // Ekran dəyişəndə səhifənin yuxarısına qayıt
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentScreen]);

  const handleAuthSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setCurrentScreen('landing');
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
        return <DashboardScreen onSelectScreen={setCurrentScreen} user={user} />;
      case 'login':
      case 'register':
        return (
          <AuthScreen
            key={currentScreen}
            mode={currentScreen}
            onSelectScreen={setCurrentScreen}
            onAuthSuccess={handleAuthSuccess}
          />
        );
      default:
        return <LandingScreen onSelectScreen={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-paper flex flex-col transition-colors selection:bg-brand-100 dark:selection:bg-brand-900">
      {/* Top Navigation Bar */}
      <Navbar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        isDark={isDark}
        onSetDark={(dark) => setTheme(dark ? 'dark' : 'light')}
        user={user}
        onLogout={handleLogout}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={handleToggleMobileFrame}
      />

      {/* Main View Area: either 1440px Desktop or 390px Mobile Frame Simulator */}
      {isMobileFrame ? (
        <div className="flex-1 py-8 px-4 flex flex-col items-center justify-start bg-stone-200/70 dark:bg-black">
          {/* Mobile frame header controls */}
          <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-stone-600 dark:text-stone-400">
            <span className="flex items-center gap-1.5 bg-surface dark:bg-surface-dark px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-800 shadow-xs">
              <Smartphone className="w-3.5 h-3.5 text-brand-fg" />
              <span>Mobil Simulyasiya: 390px × 844px (iPhone 14/15)</span>
            </span>
            <button
              onClick={() => setIsMobileFrame(false)}
              className="text-brand-fg dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>1440px rejimə keç</span>
            </button>
          </div>

          {/* 390px Mobile Viewport Container */}
          <div className="w-[390px] h-[844px] bg-canvas dark:bg-canvas-dark rounded-[44px] border-[10px] border-stone-800 dark:border-stone-700 shadow-2xl overflow-hidden relative flex flex-col">
            {/* Dynamic Island / Speaker notch simulation */}
            <div className="h-7 w-full bg-stone-800 dark:bg-stone-700 flex items-center justify-center shrink-0">
              <div className="w-24 h-4 bg-black rounded-full" />
            </div>

            {/* Scrollable screen content */}
            <div className="flex-1 overflow-y-auto pb-16">{renderScreen()}</div>

            {/* Mobile Bottom Tab Bar with 48px touch targets */}
            <div className="absolute bottom-0 left-0 right-0">
              <MobileTabBar
                currentScreen={currentScreen}
                onSelectScreen={setCurrentScreen}
                isLoggedIn={!!user}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Standard 1440px Desktop Baseline */
        <div className="flex-1 flex flex-col pb-16 md:pb-0">
          {renderScreen()}

          {/* For real mobile viewports, show bottom tab bar on small screens (< 768px) */}
          <div className="block md:hidden">
            <MobileTabBar
              currentScreen={currentScreen}
              onSelectScreen={setCurrentScreen}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      )}
    </div>
  );
}
