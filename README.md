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
  App.tsx                 # ekran naviqasiyası (useState), tema, istifadəçi sessiyası
  types.ts                # bütün data modelləri (backend DTO-ları üçün əsas)
  data/examData.ts        # MOCK data — backend ilə əvəz olunmalıdır
  services/authService.ts # MOCK auth (qeydiyyat/giriş/çıxış) — backend ilə əvəz olunmalıdır
  hooks/useTheme.ts       # light/dark rejimi (seçim yadda saxlanır)
  components/             # Navbar, MobileTabBar, ProgressRing
  screens/
    LandingScreen.tsx     # ana səhifə
    SubjectsScreen.tsx    # fənlər və mövzular
    TestScreen.tsx        # test (sual + variantlar)
    ResultScreen.tsx      # nəticə və izahlar
    PracticeScreen.tsx    # zəif mövzular üzrə fərdi məşq
    DashboardScreen.tsx   # inkişaf paneli
    AuthScreen.tsx        # giriş və qeydiyyat (login / register)
```

## Kod qaydaları

- **Palitra:** "Meşə yaşılı" (forest green + qızılı vurğu + isti krem fon). Rənglər `src/index.css`-də `@theme` tokenləri kimi saxlanır (`bg-brand`, `bg-ink`, `btn-gold`, `dark:bg-surface-dark` və s.). Rəngi dəyişmək üçün yalnız orada düzəliş edin, komponentlərdə `#hex` yazmayın.
- **Data** komponentlərin içində yox, `src/data/`-da saxlanır, tiplər `src/types.ts`-dədir.
- `npm run format`: Prettier ilə kodu formatlayır. `npm run lint`: TypeScript yoxlaması (`strict` rejim).

## Backend komandası üçün qeydlər

- **Backend çağırışı yoxdur.** Bütün data `src/data/examData.ts`-dən gəlir (`SUBJECTS_DATA`, `TOPICS_DATA`, test sualları, zəif mövzular, səhvlər, məşq kartları).
  Tiplər `src/types.ts`-dədir: `SubjectInfo`, `TopicItem`, `TestQuestion`, `WeakTopic`, `SavedMistake`, `PracticeCard`. API cavabları bu formada olarsa, UI dəyişməz qalır.
- **Routing yoxdur.** Ekranlar `App.tsx`-də `currentScreen` state-i ilə dəyişir. URL-lər üçün `react-router` əlavə etmək məsləhətdir.
- **Auth UI hazırdır, backend yoxdur.** Giriş və qeydiyyat formaları (validasiya ilə) işləyir, amma `src/services/authService.ts` MOCK-dur: istifadəçilər yalnız brauzerin `localStorage`-ində saxlanır, şifrə **saxlanmır və yoxlanmır**. Backend hazır olanda yalnız həmin faylı API çağırışları (`POST /auth/register`, `/auth/login`, `/auth/logout`) ilə əvəz etmək kifayətdir. Dashboard-dakı profil məlumatı (ad, sinif) qeydiyyatdan götürülür, qalan göstəricilər mock-dur.
- **Dark/Light rejim** `useTheme` hook-u ilə idarə olunur (`<html class="dark">`). Seçim `localStorage`-də (`ca-theme`) saxlanır, ilk dəfə sistem rejiminə görə başlayır.
- `TestScreen` demo vəziyyətlə başlayır (5-ci sual açıqdır, əvvəlki cavablar əvvəlcədən seçilib). Real istifadədə `currentQuestionIndex` və `userAnswers` başlanğıc dəyərləri sıfırlanmalıdır.
- Seçilmiş fən (`App.tsx`-də `setActiveSubject`) hələ `TestScreen`-ə ötürülmür, test sualları statikdir.
- Test cavabları, nəticələr və irəliləyiş hazırda yadda saxlanmır (yalnız UI state).
- Navbar-dakı mobil simulyasiya düyməsi (390px çərçivə) yalnız `npm run dev` zamanı görünür, production build-də avtomatik gizlənir.
