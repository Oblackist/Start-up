import type { BankQuestion, Difficulty, TestQuestion } from '../types';
import { TEST_QUESTIONS } from './examData';
import { getTopic } from './catalog';

/** Mövcud sualların mövzu adı → kataloq mövzusu */
const TOPIC_NAME_TO_ID: Record<string, string> = {
  'Həqiqi ədədlər': 'num-real',
  Faizlər: 'num-pct',
  Funksiyalar: 'alg-func',
  Həndəsə: 'geo-basic',
  'Tənliklər sistemi': 'alg-sys',
  'Kvadrat tənliklər': 'alg-quad',
  Çoxbucaqlılar: 'geo-poly',
  'Ehtimal nəzəriyyəsi': 'stat-prob',
  Tənliklər: 'alg-eq',
  Çevrə: 'geo-circle',
  'Dərəcə və qüvvət': 'num-pow',
  Kəsrlər: 'num-frac',
  'Mütləq qiymət (Modul)': 'num-abs',
  Proqresiyalar: 'alg-prog',
  Trigonometriya: 'geo-trig',
};

type NewQ = [
  id: number,
  topic: string,
  text: string,
  options: [string, string, string, string],
  correct: 'A' | 'B' | 'C' | 'D',
  summary: string,
  steps: string[],
  rule: string,
];

const NEW_QUESTIONS: NewQ[] = [
  [
    21,
    'Orta qiymət və moda',
    '5, 7, 8, 10, 15 ədədlərinin ədədi ortasını tapın.',
    ['8', '9', '10', '11'],
    'B',
    'Ədədi orta bütün ədədlərin cəminin say-a bölünməsidir.',
    ['5 + 7 + 8 + 10 + 15 = 45', '45 : 5 = 9'],
    'Ədədi orta = ədədlərin cəmi / ədədlərin sayı.',
  ],
  [
    22,
    'Orta qiymət və moda',
    '3, 5, 5, 7, 9, 5, 6 ədədlərinin modasını (ən çox təkrarlanan ədəd) tapın.',
    ['3', '6', '5', '7'],
    'C',
    'Moda ən çox təkrarlanan ədəddir.',
    ['5 ədədi 3 dəfə təkrarlanır, qalanları 1 dəfə'],
    'Moda = verilənlər içində tezliyi ən böyük olan qiymət.',
  ],
  [
    23,
    'Tənliklər',
    '3(x − 2) = 2x + 5 tənliyinin kökünü tapın.',
    ['11', '9', '13', '7'],
    'A',
    'Mötərizəni açıb x-li hədləri bir tərəfə toplayırıq.',
    ['3x − 6 = 2x + 5', '3x − 2x = 5 + 6', 'x = 11'],
    'Xətti tənlikdə naməlumlu hədlər bir tərəfə, sərbəst hədlər o biri tərəfə keçirilir.',
  ],
  [
    24,
    'Tənliklər',
    '2x − 7 > 5 bərabərsizliyinin ən kiçik natural həllini tapın.',
    ['6', '7', '8', '5'],
    'B',
    'Bərabərsizliyi həll edib x-in sərhədini tapırıq.',
    ['2x > 12 ⇒ x > 6', 'x > 6 şərtini ödəyən ən kiçik natural ədəd 7-dir'],
    'Sərt bərabərsizlikdə sərhəd qiymətinin özü həll deyil.',
  ],
  [
    25,
    'Faizlər',
    'Malın qiyməti əvvəlcə 20% artırıldı, sonra 20% endirildi. Son qiymət ilkin qiymətin neçə faizidir?',
    ['100%', '98%', '96%', '94%'],
    'C',
    'Ardıcıl faiz dəyişiklikləri vurulur, toplanmır.',
    ['1,2 · 0,8 = 0,96', 'Son qiymət ilkin qiymətin 96%-i qədərdir'],
    'Faiz dəyişmələri vuruq kimi tətbiq olunur: (1 + a) · (1 − b).',
  ],
  [
    26,
    'Funksiyalar',
    'f(x) = x² − 3x + 2 olarsa, f(3) neçədir?',
    ['4', '0', '6', '2'],
    'D',
    'x-in yerinə 3 qoyub hesablayırıq.',
    ['f(3) = 3² − 3 · 3 + 2', '= 9 − 9 + 2 = 2'],
    'Funksiyanın qiymətini tapmaq üçün arqumentin yerinə verilmiş ədəd yazılır.',
  ],
  [
    27,
    'Həndəsə',
    'Düzbucaqlının tərəfləri 6 sm və 8 sm-dir. Onun diaqonalı neçə sm-dir?',
    ['9', '10', '12', '14'],
    'B',
    'Diaqonal düzbucaqlı üçbucağın hipotenuzudur.',
    ['d² = 6² + 8² = 36 + 64 = 100', 'd = 10'],
    'Pifaqor teoremi: c² = a² + b².',
  ],
  [
    28,
    'Həndəsə',
    'Üçbucağın daxili bucaqlarından ikisi 50° və 70°-dir. Üçüncü bucaq neçə dərəcədir?',
    ['60', '50', '70', '80'],
    'A',
    'Üçbucağın daxili bucaqlarının cəmi 180°-dir.',
    ['50° + 70° = 120°', '180° − 120° = 60°'],
    'Üçbucağın daxili bucaqlarının cəmi həmişə 180°-dir.',
  ],
  [
    29,
    'Kəsrlər',
    '3/4 + 5/6 ifadəsinin qiymətini tapın.',
    ['17/12', '8/10', '19/12', '23/24'],
    'C',
    'Kəsrləri ortaq məxrəcə gətirib toplayırıq.',
    ['Ortaq məxrəc 12: 9/12 + 10/12', '= 19/12'],
    'Müxtəlif məxrəcli kəsrlər ən kiçik ortaq məxrəcə gətirilərək toplanır.',
  ],
  [
    30,
    'Kvadrat tənliklər',
    'x² − 5x + 6 = 0 tənliyinin köklərinin cəmini tapın.',
    ['5', '6', '−5', '−6'],
    'A',
    'Viyet teoremindən istifadə edirik.',
    [
      'x² + px + q = 0 üçün x₁ + x₂ = −p',
      'p = −5 olduğundan cəm 5-dir',
      'Yoxlama: kökləri 2 və 3, cəmi 5',
    ],
    'Viyet teoremi: x₁ + x₂ = −b/a, x₁ · x₂ = c/a.',
  ],
];

const NEW_TOPIC_ID: Record<string, string> = {
  'Orta qiymət və moda': 'stat-avg',
  Tənliklər: 'alg-eq',
  Faizlər: 'num-pct',
  Funksiyalar: 'alg-func',
  Həndəsə: 'geo-basic',
  Kəsrlər: 'num-frac',
  'Kvadrat tənliklər': 'alg-quad',
};

const KEYS = ['A', 'B', 'C', 'D'] as const;

const toBank = (q: TestQuestion, topicId: string): BankQuestion => ({
  ...q,
  topicId,
  difficulty: (getTopic(topicId)?.difficulty ?? 'medium') as Difficulty,
});

const existing = TEST_QUESTIONS.map((q) => toBank(q, TOPIC_NAME_TO_ID[q.topic] ?? 'num-real'));

const added = NEW_QUESTIONS.map(([id, topic, text, options, correct, summary, steps, rule]) =>
  toBank(
    {
      id,
      subject: 'Riyaziyyat',
      topic,
      text,
      options: options.map((o, i) => ({ key: KEYS[i], text: o })),
      correctAnswer: correct,
      explanation: { summary, steps, rule },
    },
    NEW_TOPIC_ID[topic],
  ),
);

/** 30 suallıq nümunə bank (yalnız Riyaziyyat). Backend hazır olanda API ilə əvəz olunacaq. */
export const QUESTION_BANK: BankQuestion[] = [...existing, ...added];

export const getQuestion = (id: number) => QUESTION_BANK.find((q) => q.id === id);
