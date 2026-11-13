import type { CatalogTopic, Difficulty, Section, SubjectId } from '../types';

/** Bölmələr: Fənn → Bölmə → Mövzu. Backend hazır olanda GET /subjects/:id/sections ilə əvəz olunacaq. */
export const SECTIONS: Section[] = [
  {
    id: 'math-num',
    subjectId: 'math',
    name: 'Ədədlər və hesablama',
    description: 'Həqiqi ədədlər, kəsrlər, qüvvət, modul və faizlər.',
  },
  {
    id: 'math-alg',
    subjectId: 'math',
    name: 'Cəbr',
    description: 'Tənliklər, tənliklər sistemi, kvadrat tənliklər, proqresiyalar və funksiyalar.',
  },
  {
    id: 'math-geo',
    subjectId: 'math',
    name: 'Həndəsə',
    description: 'Üçbucaqlar, çoxbucaqlılar, çevrə və triqonometriya.',
  },
  {
    id: 'math-stat',
    subjectId: 'math',
    name: 'Statistika və ehtimal',
    description: 'Orta qiymət, moda və ehtimal nəzəriyyəsinin əsasları.',
  },
  {
    id: 'aze-phon',
    subjectId: 'aze',
    name: 'Fonetika və orfoqrafiya',
    description: 'Səs və hərf sistemi, düzgün yazı qaydaları.',
  },
  {
    id: 'aze-lex',
    subjectId: 'aze',
    name: 'Leksika',
    description: 'Söz ehtiyatı, sinonim, antonim və frazeoloji birləşmələr.',
  },
  {
    id: 'aze-morph',
    subjectId: 'aze',
    name: 'Morfologiya',
    description: 'Nitq hissələri və onların qrammatik xüsusiyyətləri.',
  },
  {
    id: 'aze-synt',
    subjectId: 'aze',
    name: 'Sintaksis',
    description: 'Cümlə quruluşu, cümlə üzvləri və mürəkkəb cümlələr.',
  },
  {
    id: 'eng-gram',
    subjectId: 'eng',
    name: 'Grammar',
    description: 'Zamanlar, şərt cümlələri və məchul növ.',
  },
  {
    id: 'eng-vocab',
    subjectId: 'eng',
    name: 'Vocabulary',
    description: 'Söz yaradıcılığı və frazal feillər.',
  },
  {
    id: 'eng-read',
    subjectId: 'eng',
    name: 'Reading',
    description: 'Mətnin əsas ideyası və nəticə çıxarma bacarığı.',
  },
];

const t = (
  id: string,
  subjectId: SubjectId,
  sectionId: string,
  name: string,
  difficulty: Difficulty,
  questionCount: number,
  mastery: number,
): CatalogTopic => ({ id, subjectId, sectionId, name, difficulty, questionCount, mastery });

export const CATALOG_TOPICS: CatalogTopic[] = [
  // Riyaziyyat · Ədədlər
  t('num-real', 'math', 'math-num', 'Həqiqi ədədlər', 'easy', 36, 88),
  t('num-frac', 'math', 'math-num', 'Kəsrlər', 'easy', 32, 81),
  t('num-pow', 'math', 'math-num', 'Dərəcə və qüvvət', 'medium', 28, 72),
  t('num-abs', 'math', 'math-num', 'Mütləq qiymət (Modul)', 'medium', 24, 66),
  t('num-pct', 'math', 'math-num', 'Faizlər', 'medium', 38, 62),
  // Riyaziyyat · Cəbr
  t('alg-eq', 'math', 'math-alg', 'Tənliklər', 'easy', 40, 84),
  t('alg-sys', 'math', 'math-alg', 'Tənliklər sistemi', 'medium', 42, 54),
  t('alg-quad', 'math', 'math-alg', 'Kvadrat tənliklər', 'medium', 36, 70),
  t('alg-prog', 'math', 'math-alg', 'Proqresiyalar', 'hard', 26, 47),
  t('alg-func', 'math', 'math-alg', 'Funksiyalar', 'medium', 44, 76),
  // Riyaziyyat · Həndəsə
  t('geo-basic', 'math', 'math-geo', 'Üçbucaqlar və bucaqlar', 'medium', 50, 68),
  t('geo-poly', 'math', 'math-geo', 'Çoxbucaqlılar', 'medium', 30, 73),
  t('geo-circle', 'math', 'math-geo', 'Çevrə və dairə', 'hard', 28, 58),
  t('geo-trig', 'math', 'math-geo', 'Trigonometriya', 'hard', 34, 51),
  // Riyaziyyat · Statistika
  t('stat-avg', 'math', 'math-stat', 'Orta qiymət və moda', 'easy', 22, 90),
  t('stat-prob', 'math', 'math-stat', 'Ehtimal nəzəriyyəsi', 'medium', 26, 64),
  // Azərbaycan dili
  t('aze-sound', 'aze', 'aze-phon', 'Səs və hərf', 'easy', 30, 86),
  t('aze-orth', 'aze', 'aze-phon', 'Orfoqrafiya qaydaları', 'medium', 44, 71),
  t('aze-syn', 'aze', 'aze-lex', 'Sinonim və antonim', 'easy', 28, 84),
  t('aze-idiom', 'aze', 'aze-lex', 'Frazeoloji birləşmələr', 'hard', 24, 55),
  t('aze-noun', 'aze', 'aze-morph', 'İsim və sifət', 'easy', 34, 80),
  t('aze-verb', 'aze', 'aze-morph', 'Feil və təsriflənməyən formalar', 'hard', 40, 52),
  t('aze-member', 'aze', 'aze-synt', 'Cümlənin üzvləri', 'medium', 32, 69),
  t('aze-complex', 'aze', 'aze-synt', 'Mürəkkəb cümlələr', 'hard', 30, 49),
  // English
  t('eng-tense', 'eng', 'eng-gram', 'Tenses', 'medium', 46, 66),
  t('eng-cond', 'eng', 'eng-gram', 'Conditionals', 'hard', 30, 48),
  t('eng-passive', 'eng', 'eng-gram', 'Passive voice', 'medium', 28, 61),
  t('eng-word', 'eng', 'eng-vocab', 'Word formation', 'medium', 32, 70),
  t('eng-phrasal', 'eng', 'eng-vocab', 'Phrasal verbs', 'hard', 34, 53),
  t('eng-main', 'eng', 'eng-read', 'Main idea', 'easy', 24, 82),
  t('eng-infer', 'eng', 'eng-read', 'Inference', 'hard', 22, 50),
];

export const getSection = (id?: string) => SECTIONS.find((s) => s.id === id);
export const getTopic = (id: string) => CATALOG_TOPICS.find((x) => x.id === id);
export const sectionsOf = (subjectId: SubjectId) =>
  SECTIONS.filter((s) => s.subjectId === subjectId);
export const topicsOf = (sectionId: string) =>
  CATALOG_TOPICS.filter((x) => x.sectionId === sectionId);

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; level: 1 | 2 | 3; description: string }
> = {
  easy: { label: 'Asan', level: 1, description: 'Əsas anlayışlar və bir addımlı tapşırıqlar.' },
  medium: { label: 'Orta', level: 2, description: 'Buraxılış imtahanının tipik sualları.' },
  hard: { label: 'Çətin', level: 3, description: 'Çoxaddımlı və yüksək bal üçün tapşırıqlar.' },
};

export const masteryStatus = (mastery: number): 'weak' | 'learning' | 'mastered' =>
  mastery < 60 ? 'weak' : mastery < 80 ? 'learning' : 'mastered';
