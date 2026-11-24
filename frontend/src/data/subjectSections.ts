export const subjectSections = {
  math: [
    {
      id: 'math-num',
      name: 'Ədədlər və hesablama',
      description: 'Həqiqi ədədlər, kəsrlər, qüvvət, modul və faizlər.',
      topics: ['num-real', 'num-frac', 'num-pow', 'num-abs', 'num-pct'],
    },
    {
      id: 'math-alg',
      name: 'Cəbr',
      description: 'Tənliklər, tənliklər sistemi, kvadrat tənliklər, proqresiyalar və funksiyalar.',
      topics: ['alg-eq', 'alg-sys', 'alg-quad', 'alg-prog', 'alg-func'],
    },
    {
      id: 'math-geo',
      name: 'Həndəsə',
      description: 'Üçbucaqlar, çoxbucaqlılar, çevrə və triqonometriya.',
      topics: ['geo-basic', 'geo-poly', 'geo-circle', 'geo-trig'],
    },
    {
      id: 'math-stat',
      name: 'Statistika və ehtimal',
      description: 'Orta qiymət, moda və ehtimal nəzəriyyəsinin əsasları.',
      topics: ['stat-avg', 'stat-prob'],
    },
  ],
  aze: [
    {
      id: 'aze-phon',
      name: 'Fonetika və orfoqrafiya',
      description: 'Səs və hərf sistemi, düzgün yazı qaydaları.',
      topics: ['aze-sound', 'aze-orth'],
    },
    {
      id: 'aze-lex',
      name: 'Leksika',
      description: 'Söz ehtiyatı, sinonim, antonim və frazeoloji birləşmələr.',
      topics: ['aze-syn', 'aze-idiom'],
    },
    {
      id: 'aze-morph',
      name: 'Morfologiya',
      description: 'Nitq hissələri və onların qrammatik xüsusiyyətləri.',
      topics: ['aze-noun', 'aze-verb'],
    },
    {
      id: 'aze-synt',
      name: 'Sintaksis',
      description: 'Cümlə quruluşu, cümlə üzvləri və mürəkkəb cümlələr.',
      topics: ['aze-member', 'aze-complex'],
    },
  ],
  eng: [
    {
      id: 'eng-gram',
      name: 'Grammar',
      description: 'Zamanlar, şərt cümlələri və məchul növ.',
      topics: ['eng-tense', 'eng-cond', 'eng-passive'],
    },
    {
      id: 'eng-vocab',
      name: 'Vocabulary',
      description: 'Söz yaradıcılığı və frazal feillər.',
      topics: ['eng-word', 'eng-phrasal'],
    },
    {
      id: 'eng-read',
      name: 'Reading',
      description: 'Hər quiz bir orijinal mətn və ona aid 10 sualdan ibarətdir.',
      topics: ['eng-reading'],
    },
  ],
} satisfies Record<string, { id: string; name: string; description: string; topics: string[] }[]>;
