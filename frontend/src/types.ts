// Navigation ----------------------------------------------------------------
export type ScreenType =
  | 'landing'
  | 'subjects'
  | 'sections'
  | 'test'
  | 'result'
  | 'practice'
  | 'dashboard'
  | 'ranking'
  | 'topics'
  | 'exam-info'
  | 'verify-email'
  | 'password-reset'
  | 'packages'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'login'
  | 'register'
  | 'profile';

// Subjects are keyed by a string slug from the backend (math/aze/eng) but
// the legacy UI often compares against a fixed union — keep the union around
// for the existing helper components while allowing arbitrary ids in new code.
export type SubjectId = 'math' | 'aze' | 'eng';
export type Grade = 9 | 10 | 11;

// API / domain models (mirror of docs/CONTRACT.md) -------------------------
export interface User {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  mfa_enabled?: boolean;
  created_at: string | null;
  last_login_at: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
  status?: number;
}

export interface SubjectSummary {
  id: string;
  name: string;
  short_desc: string;
  icon_name: string;
  topic_count: number;
  question_count: number;
  grade_question_counts?: Record<Grade, number>;
}

export interface SubjectDetail {
  id: string;
  name: string;
  short_desc: string;
  icon_name: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  question_count: number;
  grade: Grade | null;
  quizzes?: { number: number; question_count: number }[];
}

export interface TestQuestion {
  id: number;
  topic: string;
  text: string;
  kind?: 'open';
  accepts_written_answer?: boolean;
  passage?: string;
  image_svg?: string;
  options: { key: string; text: string }[];
}

export interface TestStart {
  attempt_id: number;
  questions: TestQuestion[];
}

export interface TestResultExplanation {
  summary: string;
  steps: string[];
  rule?: string;
  tip?: string;
}

export interface TestResultItem {
  question_id: number;
  topic: string;
  text: string;
  options?: TestQuestion['options'];
  passage?: string;
  image_svg?: string;
  user_answer: string | null;
  is_written?: true;
  correct_answer: string;
  is_correct: boolean;
  explanation: TestResultExplanation | null;
}

export interface TestSubmitResult {
  attempt_id: number;
  subject_id: string;
  subject_name: string;
  score: number;
  total: number;
  started_at: string;
  submitted_at: string;
  results: TestResultItem[];
}

export interface AttemptSummary {
  attempt_id: number;
  subject_id: string;
  subject_name: string;
  score: number;
  total: number;
  submitted_at: string;
}

export interface AttemptsPage {
  items: AttemptSummary[];
  page: number;
  per_page: number;
  total: number;
}

export interface ProgressSubject {
  id: string;
  name: string;
  total_questions: number;
  completed_questions: number;
  readiness_score: number;
  last_score: string;
  last_date: string;
}

export interface ProgressWeakTopic {
  id: string;
  subject: string;
  name: string;
  accuracy: number;
  mistake_count: number;
  question_count: number;
}

export interface ProgressSavedMistake {
  id: string;
  subject: string;
  topic: string;
  question_preview: string;
  user_answer: string;
  correct_answer: string;
  date: string;
  status: string;
}

export interface ProgressChartPoint {
  date: string;
  score: number;
  tests: number;
}

export interface Progress {
  subjects: ProgressSubject[];
  weak_topics: ProgressWeakTopic[];
  saved_mistakes: ProgressSavedMistake[];
  progress_chart: ProgressChartPoint[];
}

export interface PracticeCard {
  id: string;
  subject_id: string;
  topic_id: string;
  topic: string;
  subject: string;
  questions_count: number;
  estimated_time: string;
  difficulty: string;
  description: string;
}

// Leaderboard (server-computed ranking over submitted test attempts) --------
export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  tests_completed: number;
  total_score: number;
  total_questions: number;
  accuracy: number; // 0..100, one decimal
  best_score: number;
  last_activity: string | null;
}

export interface LeaderboardPage {
  entries: LeaderboardEntry[];
  page: number;
  per_page: number;
  total: number;
  /** The current user's own row (any rank) — null when anonymous / no attempts. */
  me: LeaderboardEntry | null;
}

// Legacy UI helper models (used by existing screens as input shapes) -------
export interface SubjectInfo {
  id: SubjectId;
  name: string;
  shortDesc: string;
  iconName: string;
  totalQuestions: number;
  completedQuestions: number;
  readinessScore: number;
  lastScore: string;
  lastDate: string;
  topicCount: number;
}

export interface TopicItem {
  id: string;
  subjectId: SubjectId;
  name: string;
  questionCount: number;
  masteryPercentage: number;
  status: 'mastered' | 'learning' | 'weak';
}

export interface TestQuestionLegacy {
  id: number;
  subject: string;
  topic: string;
  text: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: {
    summary: string;
    steps: string[];
    rule: string;
  };
}

export interface WeakTopic {
  id: string;
  subject: string;
  name: string;
  accuracy: number;
  mistakeCount: number;
  urgency: 'high' | 'medium';
  estimatedTime: string;
  questionCount: number;
  difficulty: 'Asan' | 'Orta' | 'Çətin';
}

export interface SavedMistake {
  id: string;
  subject: string;
  topic: string;
  questionPreview: string;
  userAnswer: string;
  correctAnswer: string;
  date: string;
  status: 'Yeni' | 'Təkrar et' | 'Düzəldildi';
}

export interface PracticeCardLegacy {
  id: string;
  topic: string;
  subject: string;
  questionsCount: number;
  estimatedTime: string;
  difficulty: 'Orta' | 'Çətin' | 'Baza';
  description: string;
}

export interface ResultMistake {
  id: number;
  questionNumber: number;
  topic: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  aiExplanation: {
    summary: string;
    steps: string[];
    tip: string;
  };
}
