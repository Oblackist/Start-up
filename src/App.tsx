import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { MailWarning } from 'lucide-react';
import type { AuthUser, ScreenType } from './types';
import { SCREEN_PATHS, SCREEN_TITLES, pathToScreen } from './routes';
import { useTheme } from './hooks/useTheme';
import { getSession, logout } from './services/authService';
import { useExam } from './context/ExamContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BackBar } from './components/BackBar';
import { MobileTabBar } from './components/MobileTabBar';
import { LandingScreen } from './screens/LandingScreen';

const SubjectsScreen = lazy(() =>
  import('./screens/SubjectsScreen').then((m) => ({ default: m.SubjectsScreen })),
);
const SectionsScreen = lazy(() =>
  import('./screens/SectionsScreen').then((m) => ({ default: m.SectionsScreen })),
);
const TopicsScreen = lazy(() =>
  import('./screens/TopicsScreen').then((m) => ({ default: m.TopicsScreen })),
);
const ExamInfoScreen = lazy(() =>
  import('./screens/ExamInfoScreen').then((m) => ({ default: m.ExamInfoScreen })),
);
const ExamScreen = lazy(() =>
  import('./screens/ExamScreen').then((m) => ({ default: m.ExamScreen })),
);
const ResultScreen = lazy(() =>
  import('./screens/ResultScreen').then((m) => ({ default: m.ResultScreen })),
);
const PracticeScreen = lazy(() =>
  import('./screens/PracticeScreen').then((m) => ({ default: m.PracticeScreen })),
);
const DashboardScreen = lazy(() =>
  import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })),
);
const AuthScreen = lazy(() =>
  import('./screens/AuthScreen').then((m) => ({ default: m.AuthScreen })),
);
const VerifyEmailScreen = lazy(() =>
  import('./screens/VerifyEmailScreen').then((m) => ({ default: m.VerifyEmailScreen })),
);
const ProfileScreen = lazy(() =>
  import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const RankingScreen = lazy(() =>
  import('./screens/RankingScreen').then((m) => ({ default: m.RankingScreen })),
);
const PackagesScreen = lazy(() =>
  import('./screens/PackagesScreen').then((m) => ({ default: m.PackagesScreen })),
);
const InfoScreen = lazy(() =>
  import('./screens/InfoScreen').then((m) => ({ default: m.InfoScreen })),
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, setTheme } = useTheme();
  const { startExam } = useExam();
  const [user, setUser] = useState<AuthUser | null>(getSession);

  const screen: ScreenType = pathToScreen(location.pathname) ?? 'landing';
  const isExam = screen === 'test';

  /** Ekranlar arası keçid. "test" həmişə əvvəlcə imtahan məlumat səhifəsinə aparır. */
  const go = useCallback(
    (target: ScreenType) => navigate(SCREEN_PATHS[target === 'test' ? 'exam-info' : target]),
    [navigate],
  );

  // Səhifənin yuxarısına qayıt və başlığı yenilə
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `${SCREEN_TITLES[screen]} · Career Arena`;
  }, [screen]);

  const handleAuthSuccess = (authUser: AuthUser, isNewAccount: boolean) => {
    setUser(authUser);
    go(isNewAccount ? 'verify-email' : 'dashboard');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    go('landing');
  };

  const handleStartExam = () => {
    startExam();
    navigate(SCREEN_PATHS.test);
  };

  const showVerifyBanner = !!user && !user.emailVerified && screen !== 'verify-email' && !isExam;

  return (
    <div className="min-h-screen flex flex-col bg-canvas dark:bg-canvas-dark text-ink dark:text-paper transition-colors">
      {!isExam && (
        <Navbar
          currentScreen={screen}
          isDark={isDark}
          onSetDark={(dark) => setTheme(dark ? 'dark' : 'light')}
          user={user}
          onLogout={handleLogout}
        />
      )}

      {showVerifyBanner && (
        <div
          role="status"
          className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-sm"
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <MailWarning className="w-4 h-4 shrink-0" /> E-poçtun hələ təsdiqlənməyib.
            </span>
            <button
              onClick={() => go('verify-email')}
              className="font-semibold underline underline-offset-2 shrink-0"
            >
              İndi təsdiqlə
            </button>
          </div>
        </div>
      )}

      {!isExam && screen !== 'landing' && <BackBar screen={screen} />}

      <main className={`flex-1 flex flex-col ${isExam ? '' : 'pb-16 md:pb-0'}`}>
        <Suspense fallback={<div className="flex-1" aria-busy="true" />}>
          <Routes>
            <Route path={SCREEN_PATHS.landing} element={<LandingScreen onSelectScreen={go} />} />
            <Route path={SCREEN_PATHS.subjects} element={<SubjectsScreen onSelectScreen={go} />} />
            <Route path={SCREEN_PATHS.sections} element={<SectionsScreen onSelectScreen={go} />} />
            <Route path={SCREEN_PATHS.topics} element={<TopicsScreen onSelectScreen={go} />} />
            <Route
              path={SCREEN_PATHS['exam-info']}
              element={
                <ExamInfoScreen
                  onSelectScreen={(s) => navigate(SCREEN_PATHS[s])}
                  onStartExam={handleStartExam}
                />
              }
            />
            <Route
              path={SCREEN_PATHS.test}
              element={
                <ExamScreen onSelectScreen={(s) => navigate(SCREEN_PATHS[s], { replace: true })} />
              }
            />
            <Route path={SCREEN_PATHS.result} element={<ResultScreen onSelectScreen={go} />} />
            <Route path={SCREEN_PATHS.practice} element={<PracticeScreen onSelectScreen={go} />} />
            <Route
              path={SCREEN_PATHS.dashboard}
              element={<DashboardScreen onSelectScreen={go} user={user} />}
            />
            <Route
              path={SCREEN_PATHS.login}
              element={
                <AuthScreen
                  key="login"
                  mode="login"
                  onSelectScreen={go}
                  onAuthSuccess={handleAuthSuccess}
                />
              }
            />
            <Route
              path={SCREEN_PATHS.register}
              element={
                <AuthScreen
                  key="register"
                  mode="register"
                  onSelectScreen={go}
                  onAuthSuccess={handleAuthSuccess}
                />
              }
            />
            <Route
              path={SCREEN_PATHS['verify-email']}
              element={<VerifyEmailScreen user={user} onVerified={setUser} onSelectScreen={go} />}
            />
            <Route
              path={SCREEN_PATHS.profile}
              element={<ProfileScreen user={user} onUserChange={setUser} onSelectScreen={go} />}
            />
            <Route
              path={SCREEN_PATHS.ranking}
              element={<RankingScreen user={user} onSelectScreen={go} />}
            />
            <Route path={SCREEN_PATHS.packages} element={<PackagesScreen onSelectScreen={go} />} />
            <Route
              path={SCREEN_PATHS.about}
              element={<InfoScreen page="about" onSelectScreen={go} />}
            />
            <Route
              path={SCREEN_PATHS.contact}
              element={<InfoScreen page="contact" onSelectScreen={go} />}
            />
            <Route
              path={SCREEN_PATHS.privacy}
              element={<InfoScreen page="privacy" onSelectScreen={go} />}
            />
            <Route
              path={SCREEN_PATHS.terms}
              element={<InfoScreen page="terms" onSelectScreen={go} />}
            />
            <Route path="*" element={<Navigate to={SCREEN_PATHS.landing} replace />} />
          </Routes>
        </Suspense>
      </main>

      {!isExam && <Footer />}
      {!isExam && <MobileTabBar currentScreen={screen} isLoggedIn={!!user} />}
    </div>
  );
}
