"""Idempotent seed for subjects, topics and the bundled math question bank.

Re-running is safe — rows are upserted by their natural keys (subject
slug, topic slug, question id). Existing user data is NEVER deleted.

The ten extra math questions come from Start-up-Frontend.
"""
from __future__ import annotations

from app import create_app
from app.extensions import db
from app.models.content import Subject, Topic, Question
from sqlalchemy import select


# ---------------------------------------------------------------------------
# Subjects (3)
# ---------------------------------------------------------------------------
SUBJECTS = [
    {
        "id": "math",
        "name": "Riyaziyyat",
        "short_desc": "Cəbr, həndəsə, triqonometriya və funksiyalar üzrə buraxılış standartı.",
        "icon_name": "Calculator",
    },
    {
        "id": "aze",
        "name": "Azərbaycan dili",
        "short_desc": "Fonetika, leksika, morfologiya, sintaksis və mətn təhlili bacarıqları.",
        "icon_name": "BookOpen",
    },
    {
        "id": "eng",
        "name": "İngilis dili",
        "short_desc": "Qrammatika qaydaları, söz ehtiyatı, dinləmə və oxu bacarıqları.",
        "icon_name": "Globe",
    },
]


# ---------------------------------------------------------------------------
# Topics (17) — topic_id slug + subject_id + name + question_count + order
# ---------------------------------------------------------------------------
TOPICS = [
    # Riyaziyyat
    {"id": "m1", "subject_id": "math", "name": "Xətti tənliklər və sistemlər",         "question_count": 42, "order": 1},
    {"id": "m2", "subject_id": "math", "name": "Faiz, nisbət və tənasüb",                "question_count": 38, "order": 2},
    {"id": "m3", "subject_id": "math", "name": "Həndəsə: Üçbucaqlar və bucaqlar",         "question_count": 50, "order": 3},
    {"id": "m4", "subject_id": "math", "name": "Kvadrat tənliklər və Viyet teoremi",       "question_count": 35, "order": 4},
    {"id": "m5", "subject_id": "math", "name": "Həqiqi ədədlər və dərəcə",               "question_count": 30, "order": 5},
    {"id": "m6", "subject_id": "math", "name": "Funksiyalar və qrafiklər",               "question_count": 44, "order": 6},
    {"id": "m7", "subject_id": "math", "name": "Çevrə və dairə",                          "question_count": 36, "order": 7},
    {"id": "m8", "subject_id": "math", "name": "Fəza fiqurları və həcm",                 "question_count": 28, "order": 8},
    # Azərbaycan dili
    {"id": "a1", "subject_id": "aze", "name": "Mürəkkəb cümlənin növləri",              "question_count": 45, "order": 1},
    {"id": "a2", "subject_id": "aze", "name": "Feilin təsriflənməyən formaları",        "question_count": 52, "order": 2},
    {"id": "a3", "subject_id": "aze", "name": "Köməkçi nitq hissələri",                  "question_count": 38, "order": 3},
    {"id": "a4", "subject_id": "aze", "name": "Durğu işarələri qaydaları",               "question_count": 40, "order": 4},
    {"id": "a5", "subject_id": "aze", "name": "Mətn üzrə oxuyub-anlama",                 "question_count": 60, "order": 5},
    # İngilis dili
    {"id": "e1", "subject_id": "eng", "name": "Mürəkkəb tamamlıq (Complex Object)",      "question_count": 34, "order": 1},
    {"id": "e2", "subject_id": "eng", "name": "Zaman uzlaşması qaydaları",              "question_count": 48, "order": 2},
    {"id": "e3", "subject_id": "eng", "name": "Modal fellər və ekvivalentləri",         "question_count": 36, "order": 3},
    {"id": "e4", "subject_id": "eng", "name": "Sözönü birləşmələr (Prepositions)",      "question_count": 40, "order": 4},
    {"id": "e5", "subject_id": "eng", "name": "Məchul növ (Passive Voice)",             "question_count": 42, "order": 5},
    {"id": "m-stat", "subject_id": "math", "name": "Orta qiymət və moda", "question_count": 2, "order": 10},
    {"id": "m-ineq", "subject_id": "math", "name": "Bərabərsizliklər", "question_count": 1, "order": 11},
    {"id": "m-quad", "subject_id": "math", "name": "Dördbucaqlılar", "question_count": 1, "order": 12},
    {"id": "m-frac", "subject_id": "math", "name": "Kəsrlər", "question_count": 1, "order": 13},
]


# ---------------------------------------------------------------------------
# Questions (20) — all math. Each maps to one of the 8 math topics.
# Source: TEST_QUESTIONS in frontend/src/data/examData.ts (migrated verbatim).
# ---------------------------------------------------------------------------
_QUESTIONS_RAW = [
    # (id, topic_str, text, options, correct, explanation, difficulty, topic_id)
    (
        1,
        "Həqiqi ədədlər",
        "√50 - √18 ifadəsinin qiymətini sadələşdirin.",
        [("A", "2√2"), ("B", "3√2"), ("C", "√32"), ("D", "4√2")],
        "A",
        {
            "summary": "Kvadrat kök altındakı vuruqları vuruq şəklində ayırıb xaricə çıxarırıq.",
            "steps": ["√50 = √(25 · 2) = 5√2", "√18 = √(9 · 2) = 3√2", "5√2 - 3√2 = (5 - 3)√2 = 2√2"],
            "rule": "Eyni kökaltı ifadələri ortaq vuruq kimi mötərizə xaricinə çıxarmaq mümkündür.",
        },
        "Orta",
        "m5",
    ),
    (
        2,
        "Faizlər",
        "Ədədin 25%-i 40-a bərabərdirsə, bu ədədin 40%-i neçədir?",
        [("A", "56"), ("B", "64"), ("C", "72"), ("D", "80")],
        "B",
        {
            "summary": "Əvvəlcə ədədin özünü tapırıq, sonra onun 40%-ni hesablayırıq.",
            "steps": [
                "Ədəd x olsun: x · 0.25 = 40 ⇒ x = 40 / 0.25 = 160",
                "160 ədədinin 40%-i: 160 · 0.40 = 64",
            ],
            "rule": "Faizinə görə ədədi tapmaq üçün verilmiş ədədi faiz göstəricisinə bölüb 100-ə vururuq.",
        },
        "Orta",
        "m2",
    ),
    (
        3,
        "Funksiyalar",
        "y = -2x + 6 xətti funksiyasının qrafikinin Ox oxu ilə kəsişmə nöqtəsinin koordinatlarını tapın.",
        [("A", "(0; 6)"), ("B", "(-3; 0)"), ("C", "(3; 0)"), ("D", "(6; 0)")],
        "C",
        {
            "summary": "Ox oxu ilə kəsişmə nöqtəsində y = 0 qəbul edilir.",
            "steps": ["0 = -2x + 6", "2x = 6 ⇒ x = 3", "Nöqtənin koordinatları: (3; 0)"],
            "rule": "Ox oxu ilə kəsişmə zamanı ordinat (y) həmişə sıfıra bərabərdir.",
        },
        "Asan",
        "m6",
    ),
    (
        4,
        "Həndəsə",
        "Düzbucaqlı üçbucağın katetləri 6 sm və 8 sm-dir. Bu üçbucağın hipotenuzuna çəkilmiş medianın uzunluğunu tapın.",
        [("A", "4 sm"), ("B", "5 sm"), ("C", "10 sm"), ("D", "7 sm")],
        "B",
        {
            "summary": "Pifaqor teoremi ilə hipotenuzu tapıb median xassəsini tətbiq edirik.",
            "steps": [
                "c² = a² + b² = 6² + 8² = 36 + 64 = 100 ⇒ c = 10 sm",
                "Düzbucaqlı üçbucaqda düz bucaq təpəsindən çəkilmiş median hipotenuzun yarısına bərabərdir: m = c / 2",
                "m = 10 / 2 = 5 sm",
            ],
            "rule": "Düzbucaqlı üçbucaqda hipotenuzun yarısı həm də xaricə çəkilmiş çevrənin radiusudur: R = m = c/2.",
        },
        "Orta",
        "m3",
    ),
    (
        5,
        "Tənliklər sistemi",
        "İki ədədin cəmi 24, fərqi 6-dır. Bu ədədlərdən böyüyü hansıdır?",
        [("A", "9"), ("B", "12"), ("C", "15"), ("D", "18")],
        "C",
        {
            "summary": "İkidəyişənli xətti tənliklər sistemi qurularaq cəbrlə tərəf-tərəfə toplama üsulu tətbiq olunur.",
            "steps": [
                "Tənliklər sistemini yazaq: { x + y = 24 ; x - y = 6 }",
                "Tərəf-tərəfə toplayırıq: (x + y) + (x - y) = 24 + 6",
                "2x = 30 ⇒ x = 15",
                "İkinci ədədi tapaq: 15 + y = 24 ⇒ y = 9",
                "Böyük ədəd 15-dir.",
            ],
            "rule": "Cəm və fərq verildikdə böyük ədəd: (cəm + fərq)/2 = (24 + 6)/2 = 15.",
        },
        "Orta",
        "m1",
    ),
    (
        6,
        "Kvadrat tənliklər",
        "x² - 7x + 12 = 0 tənliyinin köklərinin hasilini tapın.",
        [("A", "7"), ("B", "-12"), ("C", "12"), ("D", "-7")],
        "C",
        {
            "summary": "Viyet teoreminə əsasən çevrilmiş kvadrat tənlikdə x₁ · x₂ = q.",
            "steps": [
                "Viyet teoremi: x₁ + x₂ = 7, x₁ · x₂ = 12",
                "Tənliyin kökləri 3 və 4-dür: 3 · 4 = 12",
            ],
            "rule": "x² + px + q = 0 tənliyində sərbəst hədd köklərin hasilinə bərabərdir.",
        },
        "Asan",
        "m4",
    ),
    (
        7,
        "Həndəsə",
        "Bərabəryanlı üçbucağın təpə bucağı 80°-dir. Oturacağa bitişik bucaqlardan birini tapın.",
        [("A", "40°"), ("B", "50°"), ("C", "60°"), ("D", "100°")],
        "B",
        {
            "summary": "Üçbucağın daxili bucaqlarının cəmi 180°-dir və bərabəryanlı üçbucaqda oturacağa bitişik bucaqlar bərabərdir.",
            "steps": ["180° - 80° = 100°", "100° / 2 = 50°"],
            "rule": "Bərabəryanlı üçbucaqda yan tərəflər və oturacaqdakı bucaqlar konqruyentdir.",
        },
        "Asan",
        "m3",
    ),
    (
        8,
        "Çoxbucaqlılar",
        "Qabarıq altıbucaqlının daxili bucaqlarının cəmini tapın.",
        [("A", "540°"), ("B", "720°"), ("C", "900°"), ("D", "1080°")],
        "B",
        {
            "summary": "Daxili bucaqların cəmi düsturu: 180° · (n - 2).",
            "steps": ["n = 6 üçün: 180° · (6 - 2)", "180° · 4 = 720°"],
            "rule": "İstənilən n-bucaqlının daxili bucaqlarının cəmi 180°(n-2) bərabərdir.",
        },
        "Orta",
        "m3",
    ),
    (
        9,
        "Ehtimal nəzəriyyəsi",
        "Bir zər atıldıqda tək xalın düşməsi ehtimalını tapın.",
        [("A", "1/3"), ("B", "1/6"), ("C", "1/2"), ("D", "2/3")],
        "C",
        {
            "summary": "Əlverişli halların sayının bütün mümkün halların sayına nisbəti tapılır.",
            "steps": [
                "Mümkün hallar: {1, 2, 3, 4, 5, 6} → 6 hal",
                "Əlverişli hallar (tək xallar): {1, 3, 5} → 3 hal",
                "P = 3 / 6 = 1 / 2",
            ],
            "rule": "Klassik ehtimal tərifi: P(A) = m / n.",
        },
        "Asan",
        "m1",
    ),
    (
        10,
        "Həndəsə",
        "Sahəsi 36 sm² olan kvadratın perimetrini tapın.",
        [("A", "24 sm"), ("B", "18 sm"), ("C", "36 sm"), ("D", "12 sm")],
        "A",
        {
            "summary": "Kvadratın tərəfini sahədən tapırıq, sonra perimetrini hesablayırıq.",
            "steps": ["S = a² = 36 ⇒ a = 6 sm", "P = 4 · a = 4 · 6 = 24 sm"],
            "rule": "Kvadratın bütün 4 tərəfi bərabərdir: P = 4a, S = a².",
        },
        "Asan",
        "m3",
    ),
    (
        11,
        "Faizlər",
        "Malın qiyməti 200 manatdan 160 manata endirildi. Qiymət neçə faiz azaldı?",
        [("A", "15%"), ("B", "20%"), ("C", "25%"), ("D", "40%")],
        "B",
        {
            "summary": "Azalma fərqini ilkin qiymətə bölüb faizə çeviririk.",
            "steps": ["Azalma: 200 - 160 = 40 manat", "(40 / 200) · 100% = 20%"],
            "rule": "Faiz dəyişməsi: |fərq| / ilkin_qiymət · 100%.",
        },
        "Orta",
        "m2",
    ),
    (
        12,
        "Tənliklər",
        "3(x - 2) + 4 = 19 tənliyini həll edin.",
        [("A", "5"), ("B", "6"), ("C", "7"), ("D", "8")],
        "C",
        {
            "summary": "Mötərizəni açıb xətti tənliyi sadələşdiririk.",
            "steps": ["3x - 6 + 4 = 19", "3x - 2 = 19 ⇒ 3x = 21", "x = 21 / 3 = 7"],
            "rule": "Xətti tənlikdə məchul olan hədləri bir tərəfə, məlumları digər tərəfə keçiririk.",
        },
        "Asan",
        "m1",
    ),
    (
        13,
        "Çevrə",
        "Radiusi 5 sm olan çevrənin ən böyük vətərinin uzunluğunu tapın.",
        [("A", "5 sm"), ("B", "8 sm"), ("C", "10 sm"), ("D", "12 sm")],
        "C",
        {
            "summary": "Çevrənin ən böyük vətəri onun diametridir.",
            "steps": ["Ən böyük vətər = Diametr (d)", "d = 2 · r = 2 · 5 = 10 sm"],
            "rule": "Mərkəzdən keçən vətər diametr adlanır və istənilən digər vətərdən uzundur.",
        },
        "Asan",
        "m7",
    ),
    (
        14,
        "Dərəcə və qüvvət",
        "(2³ · 2⁴) / 2⁵ ifadəsinin qiymətini tapın.",
        [("A", "2"), ("B", "4"), ("C", "8"), ("D", "16")],
        "B",
        {
            "summary": "Eyni əsaslı qüvvətlərin vurulması və bölünməsi xassəsi tətbiq edilir.",
            "steps": ["Surət: 2³ · 2⁴ = 2³⁺⁴ = 2⁷", "Bölünmə: 2⁷ / 2⁵ = 2⁷⁻⁵ = 2² = 4"],
            "rule": "aᵐ · aⁿ = aᵐ⁺ⁿ və aᵐ / aⁿ = aᵐ⁻ⁿ.",
        },
        "Asan",
        "m5",
    ),
    (
        15,
        "Həndəsə",
        "Rombun diaqonalları 12 sm və 16 sm-dir. Rombun sahəsini tapın.",
        [("A", "192 sm²"), ("B", "96 sm²"), ("C", "48 sm²"), ("D", "84 sm²")],
        "B",
        {
            "summary": "Rombun sahəsi diaqonallarının hasilinin yarısına bərabərdir.",
            "steps": ["S = (d₁ · d₂) / 2", "S = (12 · 16) / 2 = 192 / 2 = 96 sm²"],
            "rule": "Diaqonalları qarşılıqlı perpendikulyar olan dördbucaqlının sahəsi diaqonallar hasilinin yarısıdır.",
        },
        "Orta",
        "m3",
    ),
    (
        16,
        "Kəsrlər",
        "3/4 + 2/5 cəmini tapın.",
        [("A", "5/9"), ("B", "19/20"), ("C", "23/20"), ("D", "1")],
        "C",
        {
            "summary": "Kəsrləri ortaq məxrəcə (20) gətiririk.",
            "steps": ["3/4 = 15/20", "2/5 = 8/20", "15/20 + 8/20 = 23/20"],
            "rule": "Müxtəlif məxrəcli kəsrləri toplamaq üçün ƏKOB tapılaraq ortaq məxrəcə gətirilir.",
        },
        "Asan",
        "m5",
    ),
    (
        17,
        "Mütləq qiymət (Modul)",
        "|x - 3| = 5 tənliyinin köklərinin cəmini tapın.",
        [("A", "6"), ("B", "8"), ("C", "10"), ("D", "-2")],
        "A",
        {
            "summary": "Modul tənliyinin hər iki halını araşdırırıq.",
            "steps": [
                "1-ci hal: x - 3 = 5 ⇒ x₁ = 8",
                "2-ci hal: x - 3 = -5 ⇒ x₂ = -2",
                "Cəm: x₁ + x₂ = 8 + (-2) = 6",
            ],
            "rule": "|x - a| = b tənliyinin köklərinin cəmi həmişə 2a-ya bərabərdir: 2 · 3 = 6.",
        },
        "Orta",
        "m4",
    ),
    (
        18,
        "Proqresiyalar",
        "Ədədi silsilədə a₁ = 3 və silsilə fərqi d = 4 olarsa, a₅-i tapın.",
        [("A", "15"), ("B", "19"), ("C", "23"), ("D", "27")],
        "B",
        {
            "summary": "Ədədi silsilənin n-ci həddi düsturundan istifadə edirik.",
            "steps": ["aₙ = a₁ + (n - 1)d", "a₅ = 3 + (5 - 1) · 4 = 3 + 16 = 19"],
            "rule": "Ədədi silsilədə hər sonrakı hədd əvvəlkinin üzərinə silsilə fərqi d gəlməklə alınır.",
        },
        "Asan",
        "m1",
    ),
    (
        19,
        "Trigonometriya",
        "sin² 30° + cos² 30° ifadəsinin qiymətini tapın.",
        [("A", "0"), ("B", "1/2"), ("C", "√3/2"), ("D", "1")],
        "D",
        {
            "summary": "Əsas triqonometrik eynilik tətbiq olunur.",
            "steps": [
                "İstənilən α bucağı üçün sin² α + cos² α = 1",
                "Burada α = 30° olduğundan nəticə 1-dir.",
            ],
            "rule": "Pifaqor eyniliyinə görə vahid çevrədə sin² α + cos² α = 1.",
        },
        "Asan",
        "m3",
    ),
    (
        20,
        "Həndəsə",
        "Bərabərtərəfli üçbucağın hündürlüyü 6√3 sm-dir. Bu üçbucağın tərəfini tapın.",
        [("A", "6 sm"), ("B", "12 sm"), ("C", "9 sm"), ("D", "18 sm")],
        "B",
        {
            "summary": "Bərabərtərəfli üçbucağın hündürlüyü h = (a√3) / 2 düsturu ilə tapılır.",
            "steps": ["(a√3) / 2 = 6√3", "Hər iki tərəfi √3-ə bölək: a / 2 = 6", "a = 12 sm"],
            "rule": "Bərabərtərəfli üçbucaqda h = (a√3)/2, S = (a²√3)/4.",
        },
        "Orta",
        "m3",
    ),
]

# Additional questions from Start-up-Frontend/src/data/questionBank.ts.
_ADDITIONAL_QUESTIONS = [(21,
  'Orta qiymət və moda',
  '5, 7, 8, 10, 15 ədədlərinin ədədi ortasını tapın.',
  [('A', '8'), ('B', '9'), ('C', '10'), ('D', '11')],
  'B',
  {'summary': 'Ədədi orta bütün ədədlərin cəminin say-a bölünməsidir.',
   'steps': ['5 + 7 + 8 + 10 + 15 = 45', '45 : 5 = 9'],
   'rule': 'Ədədi orta = ədədlərin cəmi / ədədlərin sayı.'},
  'Orta',
  'm-stat'),
 (22,
  'Orta qiymət və moda',
  '3, 5, 5, 7, 9, 5, 6 ədədlərinin modasını (ən çox təkrarlanan ədəd) tapın.',
  [('A', '3'), ('B', '6'), ('C', '5'), ('D', '7')],
  'C',
  {'summary': 'Moda ən çox təkrarlanan ədəddir.',
   'steps': ['5 ədədi 3 dəfə təkrarlanır, qalanları 1 dəfə'],
   'rule': 'Moda = verilənlər içində tezliyi ən böyük olan qiymət.'},
  'Orta',
  'm-stat'),
 (23,
  'Tənliklər',
  '3(x − 2) = 2x + 5 tənliyinin kökünü tapın.',
  [('A', '11'), ('B', '9'), ('C', '13'), ('D', '7')],
  'A',
  {'summary': 'Mötərizəni açıb x-li hədləri bir tərəfə toplayırıq.',
   'steps': ['3x − 6 = 2x + 5', '3x − 2x = 5 + 6', 'x = 11'],
   'rule': 'Xətti tənlikdə naməlumlu hədlər bir tərəfə, sərbəst hədlər o biri tərəfə keçirilir.'},
  'Orta',
  'm1'),
 (24,
  'Tənliklər',
  '2x − 7 > 5 bərabərsizliyinin ən kiçik natural həllini tapın.',
  [('A', '6'), ('B', '7'), ('C', '8'), ('D', '5')],
  'B',
  {'summary': 'Bərabərsizliyi həll edib x-in sərhədini tapırıq.',
   'steps': ['2x > 12 ⇒ x > 6', 'x > 6 şərtini ödəyən ən kiçik natural ədəd 7-dir'],
   'rule': 'Sərt bərabərsizlikdə sərhəd qiymətinin özü həll deyil.'},
  'Orta',
  'm-ineq'),
 (25,
  'Faizlər',
  'Malın qiyməti əvvəlcə 20% artırıldı, sonra 20% endirildi. Son qiymət ilkin qiymətin neçə '
  'faizidir?',
  [('A', '100%'), ('B', '98%'), ('C', '96%'), ('D', '94%')],
  'C',
  {'summary': 'Ardıcıl faiz dəyişiklikləri vurulur, toplanmır.',
   'steps': ['1,2 · 0,8 = 0,96', 'Son qiymət ilkin qiymətin 96%-i qədərdir'],
   'rule': 'Faiz dəyişmələri vuruq kimi tətbiq olunur: (1 + a) · (1 − b).'},
  'Orta',
  'm2'),
 (26,
  'Funksiyalar',
  'f(x) = x² − 3x + 2 olarsa, f(3) neçədir?',
  [('A', '4'), ('B', '0'), ('C', '6'), ('D', '2')],
  'D',
  {'summary': 'x-in yerinə 3 qoyub hesablayırıq.',
   'steps': ['f(3) = 3² − 3 · 3 + 2', '= 9 − 9 + 2 = 2'],
   'rule': 'Funksiyanın qiymətini tapmaq üçün arqumentin yerinə verilmiş ədəd yazılır.'},
  'Orta',
  'm6'),
 (27,
  'Həndəsə',
  'Düzbucaqlının tərəfləri 6 sm və 8 sm-dir. Onun diaqonalı neçə sm-dir?',
  [('A', '9'), ('B', '10'), ('C', '12'), ('D', '14')],
  'B',
  {'summary': 'Diaqonal düzbucaqlı üçbucağın hipotenuzudur.',
   'steps': ['d² = 6² + 8² = 36 + 64 = 100', 'd = 10'],
   'rule': 'Pifaqor teoremi: c² = a² + b².'},
  'Orta',
  'm-quad'),
 (28,
  'Həndəsə',
  'Üçbucağın daxili bucaqlarından ikisi 50° və 70°-dir. Üçüncü bucaq neçə dərəcədir?',
  [('A', '60'), ('B', '50'), ('C', '70'), ('D', '80')],
  'A',
  {'summary': 'Üçbucağın daxili bucaqlarının cəmi 180°-dir.',
   'steps': ['50° + 70° = 120°', '180° − 120° = 60°'],
   'rule': 'Üçbucağın daxili bucaqlarının cəmi həmişə 180°-dir.'},
  'Orta',
  'm3'),
 (29,
  'Kəsrlər',
  '3/4 + 5/6 ifadəsinin qiymətini tapın.',
  [('A', '17/12'), ('B', '8/10'), ('C', '19/12'), ('D', '23/24')],
  'C',
  {'summary': 'Kəsrləri ortaq məxrəcə gətirib toplayırıq.',
   'steps': ['Ortaq məxrəc 12: 9/12 + 10/12', '= 19/12'],
   'rule': 'Müxtəlif məxrəcli kəsrlər ən kiçik ortaq məxrəcə gətirilərək toplanır.'},
  'Orta',
  'm-frac'),
 (30,
  'Kvadrat tənliklər',
  'x² − 5x + 6 = 0 tənliyinin köklərinin cəmini tapın.',
  [('A', '5'), ('B', '6'), ('C', '−5'), ('D', '−6')],
  'A',
  {'summary': 'Viyet teoremindən istifadə edirik.',
   'steps': ['x² + px + q = 0 üçün x₁ + x₂ = −p',
             'p = −5 olduğundan cəm 5-dir',
             'Yoxlama: kökləri 2 və 3, cəmi 5'],
   'rule': 'Viyet teoremi: x₁ + x₂ = −b/a, x₁ · x₂ = c/a.'},
  'Orta',
  'm4')]


def _build_questions() -> list[dict]:
    """Materialize the raw tuples into question dicts ready for upsert."""
    out = []
    for (qid, _topic_str, text, opts, correct, expl, diff, topic_id) in _QUESTIONS_RAW + _ADDITIONAL_QUESTIONS:
        out.append({
            "id": qid,
            "subject_id": "math",
            "topic_id": topic_id,
            "text": text,
            "options_json": [{"key": k, "text": t} for k, t in opts],
            "correct_answer": correct,
            "explanation_json": expl,
            "difficulty": diff,
        })
    return out


QUESTIONS = _build_questions()


def upsert_subjects() -> int:
    n = 0
    for s in SUBJECTS:
        existing = db.session.get(Subject, s["id"])
        if existing is None:
            db.session.add(Subject(**s))
        else:
            existing.name = s["name"]
            existing.short_desc = s["short_desc"]
            existing.icon_name = s["icon_name"]
        n += 1
    db.session.commit()
    return n


def upsert_topics() -> int:
    n = 0
    for t in TOPICS:
        existing = db.session.get(Topic, t["id"])
        if existing is None:
            db.session.add(Topic(**t))
        else:
            existing.subject_id = t["subject_id"]
            existing.name = t["name"]
            existing.question_count = t["question_count"]
            existing.order = t["order"]
        n += 1
    db.session.commit()
    return n


def upsert_questions() -> int:
    n = 0
    for q in QUESTIONS:
        existing = db.session.get(Question, q["id"])
        if existing is None:
            db.session.add(Question(**q))
        elif q["id"] <= 20:
            existing.subject_id = q["subject_id"]
            existing.topic_id = q["topic_id"]
            existing.text = q["text"]
            existing.options_json = q["options_json"]
            existing.correct_answer = q["correct_answer"]
            existing.explanation_json = q["explanation_json"]
            existing.difficulty = q["difficulty"]
        n += 1
    db.session.commit()
    return n


def run() -> dict:
    """Run the full idempotent upsert. Returns counts."""
    counts = {
        "subjects": upsert_subjects(),
        "topics": upsert_topics(),
        "questions": upsert_questions(),
    }
    return counts


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        result = run()
    print(f"Seed complete: {result}")
