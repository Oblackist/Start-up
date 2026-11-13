import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ExamEndReason, ExamSession, ExamSetup, OptionKey } from '../types';
import { DEFAULT_SETUP, examDurationSec, pickQuestions } from '../utils/exam';

const SETUP_KEY = 'ca-exam-setup';
const SESSION_KEY = 'ca-exam-session';

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage əlçatmazdırsa səssiz keç */
  }
}

interface ExamContextValue {
  setup: ExamSetup;
  updateSetup: (patch: Partial<ExamSetup>) => void;
  session: ExamSession | null;
  startExam: () => void;
  answer: (questionId: number, key: OptionKey | null) => void;
  toggleFlag: (questionId: number) => void;
  /** Pəncərədən çıxışı qeyd edir (say: session.violations.length) */
  addViolation: () => void;
  finishExam: (reason: ExamEndReason) => void;
  abandonExam: () => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [setup, setSetup] = useState<ExamSetup>(() => read<ExamSetup>(SETUP_KEY) ?? DEFAULT_SETUP);
  const [session, setSession] = useState<ExamSession | null>(() => read<ExamSession>(SESSION_KEY));

  useEffect(() => write(SETUP_KEY, setup), [setup]);
  useEffect(() => write(SESSION_KEY, session), [session]);

  const updateSetup = useCallback(
    (patch: Partial<ExamSetup>) => setSetup((prev) => ({ ...prev, ...patch })),
    [],
  );

  const startExam = useCallback(() => {
    const questions = pickQuestions(setup);
    setSession({
      id: crypto.randomUUID(),
      setup,
      questionIds: questions.map((q) => q.id),
      startedAt: Date.now(),
      durationSec: examDurationSec(setup.questionCount),
      answers: {},
      flagged: [],
      violations: [],
      status: 'running',
    });
  }, [setup]);

  const answer = useCallback((questionId: number, key: OptionKey | null) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'running') return prev;
      const answers = { ...prev.answers };
      if (key === null) delete answers[questionId];
      else answers[questionId] = key;
      return { ...prev, answers };
    });
  }, []);

  const toggleFlag = useCallback((questionId: number) => {
    setSession((prev) => {
      if (!prev || prev.status !== 'running') return prev;
      const flagged = prev.flagged.includes(questionId)
        ? prev.flagged.filter((id) => id !== questionId)
        : [...prev.flagged, questionId];
      return { ...prev, flagged };
    });
  }, []);

  const addViolation = useCallback(() => {
    setSession((prev) =>
      prev && prev.status === 'running'
        ? { ...prev, violations: [...prev.violations, Date.now()] }
        : prev,
    );
  }, []);

  const finishExam = useCallback((reason: ExamEndReason) => {
    setSession((prev) =>
      prev && prev.status === 'running'
        ? { ...prev, status: 'finished', endReason: reason, finishedAt: Date.now() }
        : prev,
    );
  }, []);

  const abandonExam = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({
      setup,
      updateSetup,
      session,
      startExam,
      answer,
      toggleFlag,
      addViolation,
      finishExam,
      abandonExam,
    }),
    [
      setup,
      updateSetup,
      session,
      startExam,
      answer,
      toggleFlag,
      addViolation,
      finishExam,
      abandonExam,
    ],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam yalnız ExamProvider daxilində istifadə olunmalıdır');
  return ctx;
}
