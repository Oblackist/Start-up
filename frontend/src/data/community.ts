export interface PackageFeature {
  text: string;
  included: boolean;
}

export interface PackageInfo {
  id: 'free' | 'premium' | 'school';
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
