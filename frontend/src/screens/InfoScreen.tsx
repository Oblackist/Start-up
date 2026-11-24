import React from 'react';
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import type { ScreenType } from '../types';
import { CONTACT_INFO } from '../components/Footer';

type InfoPage = 'about' | 'contact' | 'privacy' | 'terms';

interface InfoScreenProps {
  page: InfoPage;
  onSelectScreen: (screen: ScreenType) => void;
}

const LEGAL: Record<'privacy' | 'terms', { title: string; sections: { h: string; p: string }[] }> =
  {
    privacy: {
      title: 'Məxfilik siyasəti',
      sections: [
        {
          h: '1. Hansı məlumatları toplayırıq',
          p: 'Qeydiyyat zamanı ad, soyad və e-poçt ünvanınızı, platformadan istifadə zamanı isə imtahan nəticələrinizi və cavablarınızı toplayırıq.',
        },
        {
          h: '2. Məlumatlardan necə istifadə edirik',
          p: 'Məlumatlar hesabınızı idarə etmək, nəticələrinizi təhlil etmək, fərdi məşq planı hazırlamaq və platformanın keyfiyyətini yaxşılaşdırmaq üçün istifadə olunur.',
        },
        {
          h: '3. İmtahan təhlükəsizliyi',
          p: 'İmtahan zamanı pəncərədən çıxma və cavab oxşarlığı kimi göstəricilər qayda pozuntusunun qarşısını almaq məqsədilə avtomatik qeydə alınır.',
        },
        {
          h: '4. Məlumatların paylaşılması',
          p: 'Şəxsi məlumatlarınız üçüncü tərəflərə satılmır. Qanunvericiliyin tələb etdiyi hallar istisna olmaqla, razılığınız olmadan paylaşılmır.',
        },
        {
          h: '5. Hüquqlarınız',
          p: 'Məlumatlarınıza baxmaq, onları düzəltmək və ya hesabınızı silmək üçün bizimlə əlaqə saxlaya bilərsiniz.',
        },
      ],
    },
    terms: {
      title: 'İstifadə şərtləri',
      sections: [
        {
          h: '1. Şərtlərin qəbulu',
          p: 'Platformadan istifadə etməklə bu şərtləri qəbul etmiş sayılırsınız.',
        },
        {
          h: '2. Hesab və təhlükəsizlik',
          p: 'Hesabınızın təhlükəsizliyinə və şifrənizin məxfiliyinə siz cavabdehsiniz. Hesabınızı başqasına verməməlisiniz.',
        },
        {
          h: '3. İmtahan qaydaları',
          p: 'İmtahan zamanı kənar vasitələrdən istifadə, başqa pəncərəyə keçid və cavabların kopyalanması qadağandır. Qayda pozuntusu imtahanın dayandırılmasına səbəb ola bilər.',
        },
        {
          h: '4. Məzmun və müəllif hüquqları',
          p: 'Platformadakı suallar, izahlar və materiallar Career Arena-ya məxsusdur və icazəsiz yayıla bilməz.',
        },
        {
          h: '5. Paketlər və ödənişlər',
          p: 'Ödənişli paketlərin qiymətləri və şərtləri Paketlər səhifəsində göstərilir. Pulsuz sınaq müddəti bitəndə hesab avtomatik Free paketə keçir.',
        },
      ],
    },
  };

const VALUES = [
  {
    icon: Target,
    title: 'Dəqiq hədəf',
    text: 'Hər şagirdin zəif mövzusunu tapıb məhz ora yönəlmiş məşq təklif edirik.',
  },
  {
    icon: ShieldCheck,
    title: 'Dürüst qiymətləndirmə',
    text: 'Plagiat və qayda pozuntusu yoxlaması ilə nəticələrin etibarlılığını qoruyuruq.',
  },
  {
    icon: Users,
    title: 'Birlikdə inkişaf',
    text: 'Reytinq və rəy sistemi ilə şagirdlərə və məktəblərə şəffaf müqayisə imkanı verir.',
  },
];

export const InfoScreen: React.FC<InfoScreenProps> = ({ page, onSelectScreen }) => {
  const shell =
    'w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors';
  const card =
    'bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm';

  if (page === 'privacy' || page === 'terms') {
    const doc = LEGAL[page];
    return (
      <div className={shell}>
        <article className={`${card} max-w-[820px] mx-auto p-6 sm:p-10 space-y-6`}>
          <header className="space-y-2 pb-4 border-b border-stone-200 dark:border-stone-800">
            <h1 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">
              {doc.title}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Qüvvəyə minmə tarixi: 1 noyabr 2026
            </p>
          </header>
          {doc.sections.map((s) => (
            <section key={s.h} className="space-y-1.5">
              <h2 className="font-bold text-ink dark:text-white">{s.h}</h2>
              <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">{s.p}</p>
            </section>
          ))}
          <p className="text-sm text-stone-500 dark:text-stone-400 pt-4 border-t border-stone-200 dark:border-stone-800">
            Suallarınız varsa,{' '}
            <button
              onClick={() => onSelectScreen('contact')}
              className="font-semibold text-brand-fg hover:underline"
            >
              bizimlə əlaqə saxlayın
            </button>
            .
          </p>
        </article>
      </div>
    );
  }

  if (page === 'about') {
    return (
      <div className={shell}>
        <div className="max-w-[1000px] mx-auto space-y-10">
          <header className="space-y-4 max-w-2xl">
            <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase">
              Haqqımızda
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
              Nəticədən inkişafa aparan hazırlıq platforması
            </h1>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Career Arena 9–11-ci sinif şagirdlərinin buraxılış imtahanlarına düzgün və sistemli
              hazırlaşması üçün yaradılıb. Exam Arena modulu sınaq imtahanları, mövzu üzrə təhlil,
              aydın izahlar və fərdi məşq planını bir yerdə təqdim edir.
            </p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className={`${card} p-6 space-y-3`}>
                <span className="w-11 h-11 rounded-xl bg-brand-soft dark:bg-brand-950/60 text-brand-fg flex items-center justify-center">
                  <v.icon className="w-5 h-5" />
                </span>
                <h2 className="font-bold text-ink dark:text-white">{v.title}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
          <div
            className={`${card} p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
          >
            <div>
              <h2 className="font-bold text-ink dark:text-white text-lg">Bizimlə tanış ol</h2>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                İlk sınaq imtahanını pulsuz ver və nəticəni özün gör.
              </p>
            </div>
            <button
              onClick={() => onSelectScreen('register')}
              className="btn-gold h-12 px-7 rounded-[12px] font-bold text-sm shrink-0"
            >
              Pulsuz başla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="max-w-[1000px] mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
            Əlaqə
          </h1>
          <p className="text-stone-600 dark:text-stone-400">
            Sualınız və ya təklifiniz var? Bizə yazın, tezliklə cavab verək.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <aside className={`${card} lg:col-span-2 p-6 space-y-5`}>
            {[
              { icon: Mail, label: 'E-poçt', value: CONTACT_INFO.email },
              { icon: Phone, label: 'Telefon', value: CONTACT_INFO.phone },
              { icon: MapPin, label: 'Ünvan', value: CONTACT_INFO.address },
            ].map((c) => (
              <div key={c.label} className="flex items-start gap-3.5">
                <span className="w-10 h-10 shrink-0 rounded-[10px] bg-brand-soft dark:bg-brand-950/60 text-brand-fg flex items-center justify-center">
                  <c.icon className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{c.label}</div>
                  <div className="font-semibold text-ink dark:text-white break-all">{c.value}</div>
                </div>
              </div>
            ))}
          </aside>

          <section className={`${card} lg:col-span-3 p-6 sm:p-8 space-y-4`}>
            <h2 className="text-xl font-bold">E-poçtla əlaqə</h2>
            <a href={'mailto:' + CONTACT_INFO.email} className="font-semibold text-brand-fg hover:underline">{CONTACT_INFO.email}</a>
          </section>
        </div>
      </div>
    </div>
  );
};
