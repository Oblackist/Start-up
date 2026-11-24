import type { ScreenType } from './types';

/** Ekran adı → URL. Yeni səhifə əlavə edəndə yalnız burada və App.tsx-də qeyd etmək kifayətdir. */
export const SCREEN_PATHS: Record<ScreenType, string> = {
  landing: '/',
  subjects: '/subjects',
  sections: '/sections',
  topics: '/topics',
  'exam-info': '/exam-info',
  test: '/exam',
  result: '/result',
  practice: '/practice',
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  'verify-email': '/verify-email',
  'password-reset': '/reset-password',
  profile: '/profile',
  ranking: '/ranking',
  packages: '/packages',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
};

export const SCREEN_TITLES: Record<ScreenType, string> = {
  landing: 'Buraxılış imtahanlarına hazırlıq',
  subjects: 'Fənlər',
  sections: 'Bölmə seçimi',
  topics: 'Mövzu seçimi',
  'exam-info': 'İmtahan haqqında məlumat',
  test: 'İmtahan',
  result: 'Nəticə və təhlil',
  practice: 'Fərdi məşq',
  dashboard: 'İnkişaf paneli',
  login: 'Daxil ol',
  register: 'Qeydiyyatdan keç',
  'verify-email': 'E-poçtun təsdiqi',
  'password-reset': 'Şifrənin bərpası',
  profile: 'Profil',
  ranking: 'Reytinq',
  packages: 'Paketlər',
  about: 'Haqqımızda',
  contact: 'Əlaqə',
  privacy: 'Məxfilik siyasəti',
  terms: 'İstifadə şərtləri',
};

/** "Geri" düyməsi tarixçə olmayanda (məs. birbaşa linklə gələndə) hara aparsın */
export const SCREEN_PARENTS: Partial<Record<ScreenType, ScreenType>> = {
  topics: 'subjects',
  sections: 'subjects',
  'exam-info': 'topics',
  result: 'dashboard',
  practice: 'dashboard',
  'verify-email': 'login',
};

export function pathToScreen(pathname: string): ScreenType | null {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const entry = (Object.entries(SCREEN_PATHS) as [ScreenType, string][]).find(
    ([, path]) => path === clean,
  );
  return entry ? entry[0] : null;
}
