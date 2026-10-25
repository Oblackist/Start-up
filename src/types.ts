export type ScreenType = 'landing' | 'subjects' | 'test' | 'result' | 'practice' | 'dashboard';

export type SubjectId = 'math' | 'aze' | 'eng';

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

export interface TestQuestion {
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

export interface PracticeCard {
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
