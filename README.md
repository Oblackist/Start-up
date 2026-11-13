# Career Arena · Exam Arena — Frontend

9–11-ci sinif şagirdləri üçün buraxılış imtahanlarına hazırlıq platformasının frontend hissəsi.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · lucide-react · motion

## İşə salmaq

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # tip yoxlaması + production build (dist/)
```

Node.js 20+ tövsiyə olunur.

## Quruluş

```
src/
  App.tsx                  # marşrutlar (react-router), ümumi çərçivə (Navbar, Geri, Footer), sessiya
  routes.ts                # ekran adı ↔ URL xəritəsi
  types.ts                 # bütün data modelləri (backend DTO-ları üçün əsas)
  context/ExamContext.tsx  # imtahan seçimləri və gedişi (sessionStorage-də saxlanır)
  hooks/useTheme.ts        # light/dark rejimi
  services/authService.ts  # MOCK auth (qeydiyyat, giriş, e-poçt kodu, profil, şifrə)
  utils/exam.ts            # müddət (sual sayı × 1,5), sual seçimi, nəticənin hesablanması
  data/
    catalog.ts             # bölmələr, mövzular, çətinlik səviyyələri (MOCK)
    questionBank.ts        # 30 suallıq nümunə bank (MOCK)
    community.ts           # reytinq, rəylər, paketlər (MOCK)
    examData.ts            # fənlər və ilkin sual datası (MOCK)
  components/              # Navbar, Footer, BackBar, Modal, Accordion, StarRating, FiveStepCycle, ...
  screens/                 # hər səhifə üçün bir fayl
  assets/                  # logo.png buraya qoyulur
```

## Səhifələr (URL-lər)

| URL | Səhifə |
| --- | --- |
| `/` | Ana səhifə (dairəvi 5 addımlıq animasiya daxil) |
| `/subjects` → `/sections` → `/topics` | Fənn → bölmə → mövzu və çətinlik seçimi |
| `/exam-info` → `/exam` → `/result` | İmtahan məlumat səhifəsi → imtahan (taymer, 30 sual) → nəticə və plagiat hesabatı |
| `/dashboard`, `/practice` | İnkişaf paneli, fərdi məşq |
| `/login`, `/register`, `/verify-email` | Giriş, qeydiyyat, e-poçt təsdiq kodu |
| `/profile` | Profil məlumatları, şəkil yükləmə, şifrə dəyişmə |
| `/ranking` | Ümumi reytinq və imtahan üzrə reytinq (ulduz və şərh) |
| `/packages` | Free, Premium və məktəb/kurs paketləri |
| `/about`, `/contact`, `/privacy`, `/terms` | Haqqımızda, əlaqə, məxfilik, şərtlər |

Hostinqdə (Vercel, Netlify) bütün yolların `index.html`-ə yönləndirilməsi lazımdır. `vercel.json` və `public/_redirects` bunun üçün hazırdır.

## Kod qaydaları

- **Palitra:** "Meşə yaşılı" (forest green + qızılı vurğu + isti krem fon). Rənglər `src/index.css`-də `@theme` tokenləri kimi saxlanır (`bg-brand`, `bg-ink`, `btn-gold`, `dark:bg-surface-dark` və s.). Rəngi dəyişmək üçün yalnız orada düzəliş edin, komponentlərdə `#hex` yazmayın.
- **Data** komponentlərin içində yox, `src/data/`-da saxlanır, tiplər `src/types.ts`-dədir.
- `npm run format`: Prettier ilə kodu formatlayır. `npm run lint`: TypeScript yoxlaması (`strict` rejim).

## Backend komandası üçün qeydlər

- **Backend çağırışı yoxdur.** Bütün data `src/data/` qovluğundadır və `src/services/authService.ts` MOCK-dur. API cavabları `src/types.ts`-dəki formada olarsa, UI dəyişməz qalır.
- **Auth:** qeydiyyat → e-poçt təsdiq kodu (6 rəqəm) → panel. Mock kod `123456`-dır və yalnız `npm run dev`-də ekranda göstərilir. Şifrə saxlanmır və yoxlanmır. Gözlənilən endpoint-lər `authService.ts`-in başında yazılıb.
- **İmtahan müddəti** = sual sayı × 1,5 dəqiqə (30 sual → 45 dəq). Hesablama `src/utils/exam.ts`-dədir, server tərəfdə də eyni qayda tətbiq olunmalıdır.
- **Tab dəyişmə:** imtahan pəncərəsindən 3 dəfə çıxılsa, imtahan dayandırılır (`MAX_VIOLATIONS`). Real yoxlamanı server də aparmalıdır.
- **Plagiat hesabatı:** `PlagiarismReport` göstəriciləri hazırda mock hesablanır, serverdən gələn real nəticə ilə əvəz olunmalıdır.
- **Sual bankı** yalnız Riyaziyyat üçündür (30 sual). Digər fənlər nümunə rejimində eyni suallarla işləyir, imtahan məlumat səhifəsində bu qeyd olunur.
- **Profil şəkli** hazırda data URL kimi `localStorage`-də saxlanır. Backend hazır olanda faylın serverə yüklənməsi lazımdır.
- **Reytinq və rəylər** mock-dur (rəylər brauzerdə saxlanır).
- **Əlaqə məlumatları** (`info@careerarena.az`, telefon, ünvan) və **hüquqi mətnlər** (məxfilik, şərtlər) nümunədir. Yayımlamazdan əvvəl real məlumatla əvəz edin və hüquqşünas yoxlasın.
