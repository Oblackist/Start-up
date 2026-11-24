import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { BackBar } from './components/BackBar';
import { Footer } from './components/Footer';
import { MobileTabBar } from './components/MobileTabBar';
import { Navbar } from './components/Navbar';
import { useTheme } from './hooks/useTheme';
import { startTest } from './lib/api';
import { AuthProvider, useAuth } from './lib/auth';
import { useLocation, useNavigate } from './lib/navigation';
import { pathToScreen, SCREEN_PATHS, SCREEN_TITLES } from './routes';
import { LandingScreen } from './screens/LandingScreen';
import type { ScreenType, TestQuestion } from './types';

const Subjects = lazy(() =>
  import('./screens/SubjectBrowser').then((m) => ({ default: m.SubjectsScreen })),
);
const Sections = lazy(() =>
  import('./screens/SubjectBrowser').then((m) => ({ default: m.SectionsScreen })),
);
const Topics = lazy(() =>
  import('./screens/SubjectBrowser').then((m) => ({ default: m.TopicsScreen })),
);
const ExamInfo = lazy(() =>
  import('./screens/CatalogScreens').then((m) => ({ default: m.ExamInfoScreen })),
);
const Exam = lazy(() => import('./screens/ExamScreen').then((m) => ({ default: m.ExamScreen })));
const Result = lazy(() =>
  import('./screens/ResultScreen').then((m) => ({ default: m.ResultScreen })),
);
const Practice = lazy(() =>
  import('./screens/PracticeScreen').then((m) => ({ default: m.PracticeScreen })),
);
const Dashboard = lazy(() =>
  import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })),
);
const Profile = lazy(() =>
  import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
const Ranking = lazy(() =>
  import('./screens/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);
const Auth = lazy(() => import('./screens/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const Verify = lazy(() =>
  import('./screens/VerifyEmailScreen').then((m) => ({ default: m.VerifyEmailScreen })),
);
const PasswordReset = lazy(() =>
  import('./screens/PasswordResetScreen').then((m) => ({ default: m.PasswordResetScreen })),
);
const Packages = lazy(() =>
  import('./screens/PackagesScreen').then((m) => ({ default: m.PackagesScreen })),
);
const Info = lazy(() => import('./screens/InfoScreen').then((m) => ({ default: m.InfoScreen })));
const Admin = lazy(() => import('./screens/AdminScreen'));

const PROTECTED = new Set<ScreenType>([
  'exam-info',
  'test',
  'result',
  'practice',
  'dashboard',
  'profile',
]);
const PENDING_EMAIL = 'ca-pending-email';
const ACTIVE_EXAM = 'ca-active-exam-v2';
const LAST_RESULT = 'ca-last-result-v2';

export interface ActiveExam {
  attemptId: number;
  userId: number;
  subjectName: string;
  subjectId?: string;
  questions: TestQuestion[];
  startedAt: number;
  answers: Record<string, string | null>;
  writtenAnswers?: Record<string, string | null>;
  flagged: number[];
  violations: number;
}

function readSession<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* The current route also works without storage. */
  }
}

function Redirect({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace: true }), [navigate, to]);
  return null;
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, setTheme } = useTheme();
  const { user, loading, logout } = useAuth();
  const [verificationError, setVerificationError] = useState('');
  const screen = pathToScreen(location.pathname) ?? 'landing';
  const inAdmin = location.pathname.replace(/\/+$/, '') === '/admin';
  const selectedSubject = location.searchParams.get('subject');
  const selectedTopic = location.searchParams.get('topic');
  const selectedSection = location.searchParams.get('section');
  const gradeParam = Number(location.searchParams.get('grade'));
  const grade = gradeParam === 9 || gradeParam === 10 || gradeParam === 11 ? gradeParam : undefined;
  const quizParam = Number(location.searchParams.get('quiz'));
  const quiz = Number.isInteger(quizParam) && quizParam >= 1 && quizParam <= 10 ? quizParam : undefined;
  const returnTo = location.searchParams.get('next');
  const returnPath =
    returnTo?.startsWith('/') &&
    !returnTo.startsWith('//') &&
    !returnTo.includes(String.fromCharCode(92))
      ? new URL(returnTo, window.location.origin)
      : null;
  const returnScreen = returnPath ? pathToScreen(returnPath.pathname) : null;
  const returnsToSubject = returnScreen === 'topics' &&
    ['math', 'aze', 'eng'].includes(returnPath?.searchParams.get('subject') ?? '') &&
    ['9', '10', '11'].includes(returnPath?.searchParams.get('grade') ?? '');
  const loginTarget =
    returnPath?.origin === window.location.origin &&
    ((returnScreen && PROTECTED.has(returnScreen)) || returnsToSubject)
      ? returnPath.pathname + returnPath.search
      : SCREEN_PATHS.dashboard;
  const [storedExam, setStoredExam] = useState(() => readSession<ActiveExam>(ACTIVE_EXAM));
  const exam = storedExam?.userId === user?.id ? storedExam : null;
  const saveExam = useCallback((value: ActiveExam | null) => {
    setStoredExam(value);
    writeSession(ACTIVE_EXAM, value);
  }, []);
  const go = useCallback(
    (target: ScreenType) => {
      navigate(SCREEN_PATHS[target === 'test' ? 'subjects' : target]);
    },
    [navigate],
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = (inAdmin ? 'Admin paneli' : SCREEN_TITLES[screen]) + ' · Career Arena';
  }, [screen, location.search, inAdmin]);

  const onAuthSuccess = (email?: string, deliveryError = '') => {
    setVerificationError(deliveryError);
    if (email) {
      writeSession(PENDING_EMAIL, email);
      navigate('/verify-email?next=' + encodeURIComponent(loginTarget));
      return;
    }
    writeSession(PENDING_EMAIL, null);
    navigate(loginTarget, { replace: true });
  };

  const render = () => {
    if (location.pathname === '/leaderboard') return <Redirect to="/ranking" />;
    if (PROTECTED.has(screen)) {
      if (loading)
        return (
          <p className="m-8" role="status">
            Sessiya yoxlanılır…
          </p>
        );
      if (!user)
        return (
          <Redirect to={'/login?next=' + encodeURIComponent(location.pathname + location.search)} />
        );
    }
    switch (screen) {
      case 'landing':
        return <LandingScreen onSelectScreen={go} />;
      case 'subjects':
        return <Subjects />;
      case 'sections':
        return selectedSubject ? <Sections subjectId={selectedSubject} /> : <Redirect to="/subjects" />;
      case 'topics':
        return selectedSubject ? (
          <Topics key={selectedSubject} subjectId={selectedSubject} sectionId={selectedSection} />
        ) : (
          <Redirect to="/subjects" />
        );
      case 'exam-info':
        return selectedSubject && user ? (
          <ExamInfo
            key={location.search}
            subjectId={selectedSubject}
            topicId={selectedTopic}
            grade={grade}
            quiz={quiz}
            onStart={async (input, subjectName) => {
              const attempt = await startTest(input);
              saveExam({
                attemptId: attempt.attempt_id,
                userId: user.id,
                subjectName,
                subjectId: input.subject_id,
                questions: attempt.questions,
                startedAt: Date.now(),
                answers: {},
                flagged: [],
                violations: 0,
              });
              if (window.location.pathname === '/exam-info') navigate('/exam');
            }}
          />
        ) : (
          <Redirect to="/subjects" />
        );
      case 'test':
        return exam ? (
          <Exam
            key={exam.attemptId}
            exam={exam}
            onChange={saveExam}
            onExit={() => {
              saveExam(null);
              navigate('/subjects', { replace: true });
            }}
            onSubmitted={(attemptId) => {
              writeSession(LAST_RESULT, { userId: exam.userId, attemptId });
              saveExam(null);
              navigate('/result?id=' + attemptId, { replace: true });
            }}
          />
        ) : (
          <Redirect to="/subjects" />
        );
      case 'result': {
        const recent = readSession<{ userId: number; attemptId: number }>(LAST_RESULT);
        const id = location.searchParams.get('id');
        const attemptId =
          id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))
            ? Number(id)
            : recent && recent.userId === user?.id
              ? recent.attemptId
              : null;
        return <Result key={attemptId ?? 'empty'} attemptId={attemptId} onSelectScreen={go} />;
      }
      case 'practice':
        return (
          <Practice
            onSelectScreen={go}
            onStartPractice={(card) => {
              const query = new URLSearchParams({ subject: card.subject_id, topic: card.topic_id });
              navigate('/exam-info?' + query);
            }}
          />
        );
      case 'dashboard':
        return <Dashboard onSelectScreen={go} />;
      case 'profile':
        return <Profile />;
      case 'ranking':
        return <Ranking onSelectScreen={go} />;
      case 'login':
      case 'register':
        return (
          <Auth
            key={screen}
            mode={screen}
            onSelectScreen={(target) => {
              if (target === 'login' || target === 'register' || target === 'verify-email') {
                navigate(SCREEN_PATHS[target] + '?next=' + encodeURIComponent(loginTarget));
              } else go(target);
            }}
            onAuthSuccess={onAuthSuccess}
          />
        );
      case 'verify-email':
        return (
          <Verify
            initialEmail={readSession<string>(PENDING_EMAIL) ?? ''}
            initialError={verificationError}
            isDark={isDark}
            onSetDark={(dark) => setTheme(dark ? 'dark' : 'light')}
            onEditEmail={() => {
              writeSession(PENDING_EMAIL, null);
              setVerificationError('');
              navigate('/register?next=' + encodeURIComponent(loginTarget));
            }}
            onVerified={() => onAuthSuccess()}
          />
        );
      case 'password-reset':
        return <PasswordReset initialToken={new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') ?? ''} />;
      case 'packages':
        return <Packages onSelectScreen={go} />;
      default:
        return <Info page={screen} onSelectScreen={go} />;
    }
  };

  const inExam = screen === 'test';
  const standaloneScreen = inExam || screen === 'verify-email';
  const animateEntry = screen === 'landing' || screen === 'subjects' || screen === 'topics' || screen === 'register';
  if (inAdmin) {
    return (
      <main className="min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-paper">
        <Suspense fallback={<p className="p-6" role="status">Yüklənir…</p>}>
          <Admin />
        </Suspense>
      </main>
    );
  }
  return (
    <div className={
      'min-h-screen flex flex-col bg-canvas dark:bg-canvas-dark text-ink dark:text-paper transition-colors' +
      (standaloneScreen ? '' : ' pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0')
    }>
      {!standaloneScreen && (
        <Navbar
          currentScreen={screen}
          isDark={isDark}
          onSetDark={(dark) => setTheme(dark ? 'dark' : 'light')}
          user={user}
          onLogout={async () => {
            await logout();
            saveExam(null);
            writeSession(LAST_RESULT, null);
            go('landing');
          }}
        />
      )}
      {!standaloneScreen && screen !== 'landing' && <BackBar screen={screen} />}
      {exam && !standaloneScreen && (
        <button className="mx-auto mt-4 font-bold text-brand-fg" onClick={() => navigate('/exam')}>
          Davam edən imtahana qayıt
        </button>
      )}
      <main className="flex-1 flex flex-col">
        <Suspense
          fallback={
            <p className="m-8" role="status">
              Yüklənir…
            </p>
          }
        >
          {animateEntry ? (
            <div key={screen} className="career-page-entry flex min-w-0 flex-1 flex-col">
              {render()}
            </div>
          ) : render()}
        </Suspense>
      </main>
      {!standaloneScreen && <Footer />}
      {!standaloneScreen && <MobileTabBar currentScreen={screen} isLoggedIn={Boolean(user)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
