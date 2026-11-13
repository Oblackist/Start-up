import type { PlanId, SubjectId } from '../types';

/** Reytinq, rəylər və paketlər üçün MOCK data. Backend hazır olanda API ilə əvəz olunacaq. */

export interface LeaderboardEntry {
  id: string;
  name: string;
  school: string;
  points: number;
  tests: number;
  average: number;
  /** Əvvəlki həftəyə nisbətən yer dəyişikliyi (+ yüksəlib, − düşüb) */
  change: number;
}

export const LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'u1',
    name: 'Murad Həsənov',
    school: 'Bakı, 6 saylı lisey',
    points: 2840,
    tests: 41,
    average: 94,
    change: 1,
  },
  {
    id: 'u2',
    name: 'Nərmin Quliyeva',
    school: 'Bakı, 20 saylı gimnaziya',
    points: 2765,
    tests: 39,
    average: 93,
    change: -1,
  },
  {
    id: 'u3',
    name: 'Elvin Məmmədov',
    school: 'Sumqayıt, 3 saylı lisey',
    points: 2690,
    tests: 44,
    average: 91,
    change: 2,
  },
  {
    id: 'u4',
    name: 'Səbinə Əliyeva',
    school: 'Gəncə, 1 saylı gimnaziya',
    points: 2610,
    tests: 37,
    average: 92,
    change: 0,
  },
  {
    id: 'u5',
    name: 'Tural Rzayev',
    school: 'Bakı, 132 saylı məktəb',
    points: 2555,
    tests: 40,
    average: 90,
    change: 3,
  },
  {
    id: 'u6',
    name: 'Leyla Hüseynova',
    school: 'Mingəçevir, 2 saylı lisey',
    points: 2490,
    tests: 36,
    average: 91,
    change: -2,
  },
  {
    id: 'u7',
    name: 'Rəşad Babayev',
    school: 'Bakı, 160 saylı lisey',
    points: 2410,
    tests: 38,
    average: 89,
    change: 1,
  },
  {
    id: 'u8',
    name: 'Günel Cəfərova',
    school: 'Lənkəran, 5 saylı məktəb',
    points: 2360,
    tests: 35,
    average: 90,
    change: 0,
  },
  {
    id: 'u9',
    name: 'Kamran İsmayılov',
    school: 'Şəki, 1 saylı gimnaziya',
    points: 2295,
    tests: 34,
    average: 88,
    change: -1,
  },
  {
    id: 'u10',
    name: 'Aytən Səmədova',
    school: 'Bakı, 23 saylı lisey',
    points: 2240,
    tests: 33,
    average: 88,
    change: 4,
  },
  {
    id: 'u11',
    name: 'Orxan Nəbiyev',
    school: 'Naxçıvan, 1 saylı lisey',
    points: 2175,
    tests: 32,
    average: 87,
    change: -3,
  },
  {
    id: 'u12',
    name: 'Fidan Mustafayeva',
    school: 'Bakı, 6 saylı lisey',
    points: 2110,
    tests: 31,
    average: 86,
    change: 1,
  },
  {
    id: 'u13',
    name: 'Əli Qasımov',
    school: 'Quba, 2 saylı məktəb',
    points: 2050,
    tests: 30,
    average: 85,
    change: 0,
  },
  {
    id: 'u14',
    name: 'Nigar Şükürova',
    school: 'Bakı, 20 saylı gimnaziya',
    points: 1990,
    tests: 29,
    average: 85,
    change: 2,
  },
  {
    id: 'u15',
    name: 'Emil Vəliyev',
    school: 'Sumqayıt, 7 saylı lisey',
    points: 1930,
    tests: 29,
    average: 84,
    change: -1,
  },
  {
    id: 'u16',
    name: 'Sevinc Abbasova',
    school: 'Gəncə, 4 saylı məktəb',
    points: 1870,
    tests: 28,
    average: 83,
    change: 0,
  },
  {
    id: 'u17',
    name: 'Cavid Hacıyev',
    school: 'Bakı, 132 saylı məktəb',
    points: 1815,
    tests: 27,
    average: 82,
    change: 1,
  },
  {
    id: 'u18',
    name: 'Ülviyyə Rəhimova',
    school: 'Şirvan, 1 saylı lisey',
    points: 1760,
    tests: 26,
    average: 82,
    change: -2,
  },
  {
    id: 'u19',
    name: 'Samir Əsgərov',
    school: 'Bakı, 160 saylı lisey',
    points: 1700,
    tests: 25,
    average: 81,
    change: 0,
  },
  {
    id: 'u20',
    name: 'Aysu Kərimova',
    school: 'Lənkəran, 3 saylı məktəb',
    points: 1645,
    tests: 25,
    average: 80,
    change: 1,
  },
];

export type RankingPeriod = 'week' | 'month' | 'all';
export const PERIOD_LABELS: Record<RankingPeriod, string> = {
  week: 'Bu həftə',
  month: 'Bu ay',
  all: 'Bütün zamanlar',
};
/** Dövrə görə bal əmsalı (yalnız nümayiş üçün) */
export const PERIOD_FACTOR: Record<RankingPeriod, number> = { week: 0.12, month: 0.42, all: 1 };

export const SUBJECT_FILTERS: { id: SubjectId | 'all'; label: string }[] = [
  { id: 'all', label: 'Bütün fənlər' },
  { id: 'math', label: 'Riyaziyyat' },
  { id: 'aze', label: 'Azərbaycan dili' },
  { id: 'eng', label: 'İngilis dili' },
];

export interface ExamInfo {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  participants: number;
}

export const RATED_EXAMS: ExamInfo[] = [
  {
    id: 'ex-math-1',
    title: 'Riyaziyyat · Buraxılış sınağı 1',
    subject: 'Riyaziyyat',
    questionCount: 30,
    participants: 1284,
  },
  {
    id: 'ex-aze-1',
    title: 'Azərbaycan dili · Buraxılış sınağı 1',
    subject: 'Azərbaycan dili',
    questionCount: 30,
    participants: 962,
  },
  {
    id: 'ex-eng-1',
    title: 'İngilis dili · Buraxılış sınağı 1',
    subject: 'İngilis dili',
    questionCount: 30,
    participants: 745,
  },
];

export interface ReviewItem {
  id: string;
  examId: string;
  author: string;
  stars: number;
  text: string;
  date: string;
}

export const SEED_REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    examId: 'ex-math-1',
    author: 'Nərmin Quliyeva',
    stars: 5,
    text: 'Suallar real imtahana çox yaxındır, izahlar isə səhvlərimi tapmağa kömək etdi.',
    date: '2026-10-12',
  },
  {
    id: 'r2',
    examId: 'ex-math-1',
    author: 'Tural Rzayev',
    stars: 4,
    text: 'Həndəsə hissəsi çətin idi, amma vaxt kifayət etdi. Daha çox qrafik sual olsa yaxşı olar.',
    date: '2026-10-09',
  },
  {
    id: 'r3',
    examId: 'ex-math-1',
    author: 'Leyla Hüseynova',
    stars: 5,
    text: 'Taymer və sual xəritəsi çox rahatdır, hansı suallarım qaldığını dərhal görürəm.',
    date: '2026-10-05',
  },
  {
    id: 'r4',
    examId: 'ex-aze-1',
    author: 'Günel Cəfərova',
    stars: 4,
    text: 'Orfoqrafiya sualları yaxşı seçilib. İzahlar bir az qısa ola bilərdi.',
    date: '2026-10-10',
  },
  {
    id: 'r5',
    examId: 'ex-eng-1',
    author: 'Kamran İsmayılov',
    stars: 5,
    text: 'Grammar bölməsi çox faydalı oldu, Conditionals mövzusunu nəhayət başa düşdüm.',
    date: '2026-10-03',
  },
];

export interface PackageFeature {
  text: string;
  included: boolean;
}

export interface PackageInfo {
  id: PlanId;
  name: string;
  tagline: string;
  /** Aylıq qiymət (AZN). null = fərdi qiymət */
  monthlyPrice: number | null;
  badge?: string;
  cta: string;
  features: PackageFeature[];
}

export const PACKAGES: PackageInfo[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Platforma ilə tanış olmaq üçün',
    monthlyPrice: 0,
    cta: 'Pulsuz başla',
    features: [
      { text: 'Həftədə 1 sınaq imtahanı', included: true },
      { text: 'Ümumi nəticə və bal hesabatı', included: true },
      { text: 'Sual üzrə düzgün cavablar', included: true },
      { text: 'Reytinq cədvəlinə baxış', included: true },
      { text: 'Zəif mövzular üzrə dərin analiz', included: false },
      { text: 'AI addım-addım izahlar', included: false },
      { text: 'Fərdi gündəlik məşq planı', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: '9–11-ci sinif buraxılış imtahanına tam hazırlıq',
    monthlyPrice: 4.99,
    badge: 'Ən çox seçilən',
    cta: '7 gün pulsuz sına',
    features: [
      { text: 'Limitsiz sınaq imtahanları (3 fənn)', included: true },
      { text: 'Zəif mövzular üzrə dərin analiz', included: true },
      { text: 'AI addım-addım izahlar və qaydalar', included: true },
      { text: 'Fərdi gündəlik məşq planı və təkrar', included: true },
      { text: 'Plagiat və qayda pozuntusu hesabatı', included: true },
      { text: 'İmtahan üzrə reytinq və müqayisə', included: true },
      { text: 'Mütəxəssis dəstəyi', included: false },
    ],
  },
  {
    id: 'school',
    name: 'Məktəb və kurslar',
    tagline: 'Müəllimlər və tədris mərkəzləri üçün qrup idarəetməsi',
    monthlyPrice: null,
    cta: 'Əlaqə saxla',
    features: [
      { text: 'Premium paketinin bütün imkanları', included: true },
      { text: 'Sinif və qrup idarəetməsi', included: true },
      { text: 'Şagirdlər üzrə ümumi və fərdi hesabatlar', included: true },
      { text: 'Öz imtahanlarınızı yaratmaq', included: true },
      { text: 'Müəllim üçün idarəetmə paneli', included: true },
      { text: 'Prioritet dəstək', included: true },
    ],
  },
];

export const PACKAGE_FAQ: { q: string; a: string }[] = [
  {
    q: 'Pulsuz sınaq müddəti bitəndə nə baş verir?',
    a: '7 günlük sınaq bitəndən sonra hesabınız avtomatik olaraq Free paketə keçir, kartınızdan heç bir ödəniş çıxılmır.',
  },
  {
    q: 'Paketi istənilən vaxt dəyişmək olarmı?',
    a: 'Bəli, Premium və Free arasında istənilən vaxt keçid edə bilərsiniz. Dəyişiklik növbəti ödəniş dövründən qüvvəyə minir.',
  },
  {
    q: 'Məktəb paketi üçün qiymət necə müəyyən olunur?',
    a: 'Qiymət şagird sayına və istifadə müddətinə görə fərdi hesablanır. Əlaqə formasını doldursanız, komandamız sizinlə əlaqə saxlayacaq.',
  },
];
