import type { BankQuestion, ExamSession, ExamSetup, OptionKey } from '../types';
import { QUESTION_BANK, getQuestion } from '../data/questionBank';

/** İmtahan müddəti (dəqiqə) = sual sayı × 1,5. 30 sual → 45 dəqiqə. */
export const MINUTES_PER_QUESTION = 1.5;
export const MAX_VIOLATIONS = 3;
export const QUESTION_COUNT_OPTIONS = [10, 20, 30] as const;

export const examDurationMinutes = (questionCount: number) => questionCount * MINUTES_PER_QUESTION;
export const examDurationSec = (questionCount: number) =>
  Math.round(examDurationMinutes(questionCount) * 60);

export const formatMinutes = (minutes: number) =>
  Number.isInteger(minutes) ? `${minutes}` : minutes.toFixed(1).replace('.', ',');

export const formatClock = (totalSec: number) => {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const DEFAULT_SETUP: ExamSetup = {
  subjectId: 'math',
  sectionId: undefined,
  topicIds: [],
  difficulty: 'mixed',
  questionCount: 30,
};

/**
 * Seçilmiş mövzu və çətinliyə görə sualları seçir. Seçim kifayət etməzsə, qalanı bankdan tamamlanır.
 * Nümunə bank yalnız Riyaziyyat üçündür, ona görə digər fənlər də həmin suallarla göstərilir.
 */
export function pickQuestions(setup: ExamSetup): BankQuestion[] {
  const matches = (q: BankQuestion) =>
    (setup.topicIds.length === 0 || setup.topicIds.includes(q.topicId)) &&
    (setup.difficulty === 'mixed' || q.difficulty === setup.difficulty);

  const primary = QUESTION_BANK.filter(matches);
  const rest = QUESTION_BANK.filter((q) => !primary.includes(q));
  return [...primary, ...rest].slice(0, setup.questionCount);
}

export type AnswerStatus = 'correct' | 'wrong' | 'blank';

export interface EvaluatedQuestion {
  index: number;
  question: BankQuestion;
  chosen?: OptionKey;
  status: AnswerStatus;
  flagged: boolean;
}

export interface Evaluation {
  items: EvaluatedQuestion[];
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
  usedSec: number;
  weakTopics: { topicId: string; topic: string; wrong: number; total: number }[];
}

export function evaluate(session: ExamSession): Evaluation {
  const items: EvaluatedQuestion[] = [];
  session.questionIds.forEach((id, index) => {
    const question = getQuestion(id);
    if (!question) return;
    const chosen = session.answers[id];
    const status: AnswerStatus = !chosen
      ? 'blank'
      : chosen === question.correctAnswer
        ? 'correct'
        : 'wrong';
    items.push({ index, question, chosen, status, flagged: session.flagged.includes(id) });
  });

  const correct = items.filter((i) => i.status === 'correct').length;
  const wrong = items.filter((i) => i.status === 'wrong').length;
  const blank = items.filter((i) => i.status === 'blank').length;
  const total = items.length;

  const byTopic = new Map<string, { topic: string; wrong: number; total: number }>();
  items.forEach((i) => {
    const row = byTopic.get(i.question.topicId) ?? { topic: i.question.topic, wrong: 0, total: 0 };
    row.total += 1;
    if (i.status !== 'correct') row.wrong += 1;
    byTopic.set(i.question.topicId, row);
  });

  const end = session.finishedAt ?? Date.now();
  const usedSec = Math.min(
    session.durationSec,
    Math.max(0, Math.round((end - session.startedAt) / 1000)),
  );

  return {
    items,
    total,
    correct,
    wrong,
    blank,
    percent: total ? Math.round((correct / total) * 100) : 0,
    usedSec,
    weakTopics: [...byTopic.entries()]
      .map(([topicId, v]) => ({ topicId, ...v }))
      .filter((v) => v.wrong > 0)
      .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.wrong - a.wrong),
  };
}

/** Nəticə ekranını nümunə ilə göstərmək üçün (imtahan verilməyibsə) */
export function buildDemoSession(): ExamSession {
  const setup: ExamSetup = { ...DEFAULT_SETUP };
  const questions = pickQuestions(setup);
  const answers: Record<number, OptionKey> = {};
  const keys: OptionKey[] = ['A', 'B', 'C', 'D'];
  questions.forEach((q, i) => {
    if (i % 7 === 6) return; // boş
    if (i % 4 === 3) {
      answers[q.id] = keys.find((k) => k !== q.correctAnswer) ?? 'A'; // yanlış
      return;
    }
    answers[q.id] = q.correctAnswer; // doğru
  });
  const durationSec = examDurationSec(setup.questionCount);
  const startedAt = Date.now() - 38 * 60 * 1000;
  return {
    id: 'demo',
    setup,
    questionIds: questions.map((q) => q.id),
    startedAt,
    durationSec,
    answers,
    flagged: [],
    violations: [startedAt + 12 * 60 * 1000],
    status: 'finished',
    endReason: 'manual',
    finishedAt: startedAt + 38 * 60 * 1000,
    isDemo: true,
  };
}
