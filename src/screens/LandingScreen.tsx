import React from 'react';
import { ScreenType } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import { SUBJECTS_DATA } from '../data/examData';
import {
  Calculator,
  BookOpen,
  Globe,
  Check,
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface LandingScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onSelectScreen }) => {
  return (
    <div className="w-full min-h-screen bg-canvas dark:bg-canvas-dark text-ink dark:text-paper transition-colors">
      {/* HERO SECTION (DEEP FOREST BAND) */}
      <section className="relative bg-ink text-white overflow-hidden py-16 lg:py-24 border-b border-stone-800">
        {/* Subtle radial lighting for calm depth */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 75% 25%, #4a7f68 0%, transparent 60%)',
          }}
        />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Audience pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-400/20 text-brand-300 text-xs font-semibold tracking-wide">
                <span>9–11-ci siniflər üçün</span>
                <span className="text-brand-400/60">·</span>
                <span>DİM Buraxılış Standartı</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
                Nəticədən inkişafa.
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-stone-300 max-w-xl font-normal leading-relaxed">
                Mövzu üzrə analiz, aydın izahlar və fərdi məşq planı bir platformada.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onSelectScreen('test')}
                  className="btn-gold h-12 px-7 rounded-[12px] active:scale-[0.98] font-bold text-base flex items-center gap-2"
                >
                  <span>Testə başla</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="h-12 px-7 rounded-[12px] bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white border border-white/15 font-medium text-base transition-all duration-150 flex items-center gap-2"
                >
                  <span>Necə işləyir?</span>
                </button>
              </div>

              <p className="text-sm text-stone-300">
                Hesabın yoxdur?{' '}
                <button
                  onClick={() => onSelectScreen('register')}
                  className="font-semibold text-gold hover:underline"
                >
                  Qeydiyyatdan keç
                </button>
                <span className="mx-2 text-stone-500">·</span>
                Artıq hesabın var?{' '}
                <button
                  onClick={() => onSelectScreen('login')}
                  className="font-semibold text-gold hover:underline"
                >
                  Daxil ol
                </button>
              </p>

              {/* Quiet proof indicator */}
              <div className="pt-2 flex items-center gap-6 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-300" />
                  <span>Ödənişsiz sınaq testi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-300" />
                  <span>Dərhal mövzu analizi</span>
                </div>
              </div>
            </div>

            {/* Right Column: Clean White Dashboard Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[420px] bg-surface dark:bg-surface-dark text-stone-900 dark:text-white rounded-[20px] p-7 border border-stone-200/80 dark:border-stone-800 shadow-calm-lg space-y-6">
                {/* Header of mock card */}
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-ink dark:text-white">
                      Hazırlıq səviyyəsi
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Son sınaq: Riyaziyyat
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-sage-950/40 px-2.5 py-1 rounded-full border border-sage-200/60 dark:border-sage-800/40">
                    +14% artım
                  </span>
                </div>

                {/* Blue-Teal Readiness Ring */}
                <div className="flex items-center justify-center py-2">
                  <ProgressRing
                    progress={78}
                    size={140}
                    strokeWidth={12}
                    color="var(--ring)"
                    trackColor="var(--ring-track)"
                    label="Ümumi hazırlıq"
                  />
                </div>

                {/* 3 Topic Progress Bars */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-stone-700 dark:text-stone-300">
                        Tənliklər və sistemlər
                      </span>
                      <span className="text-stone-900 dark:text-white tabular-nums">64%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-700"
                        style={{ width: '64%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-stone-700 dark:text-stone-300">
                        Funksiyalar və qrafiklər
                      </span>
                      <span className="text-stone-900 dark:text-white tabular-nums">81%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-brand-fg rounded-full transition-all duration-700"
                        style={{ width: '81%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-stone-700 dark:text-stone-300">
                        Həndəsə: Üçbucaqlar
                      </span>
                      <span className="text-stone-900 dark:text-white tabular-nums">68%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-700"
                        style={{ width: '68%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Small chip: Növbəti məşq: Faizlər */}
                <div className="pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-surface-dark-alt border border-stone-100 dark:border-stone-800 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sage-500" />
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        Növbəti məşq: Faizlər
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectScreen('practice')}
                      className="text-brand-fg dark:text-brand-400 font-semibold hover:underline"
                    >
                      Başla →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECT ROW: 3 CARDS */}
      <section className="py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">
            İmtahan fənnləri
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mt-2 text-base">
            Buraxılış imtahanının üç əsas fənni üzrə dəqiq mövzu strukturu və fərdi sınaqlar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBJECTS_DATA.map((subject) => {
            const Icon =
              subject.id === 'math' ? Calculator : subject.id === 'aze' ? BookOpen : Globe;

            return (
              <div
                key={subject.id}
                className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800/80 shadow-calm hover:shadow-calm-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-[14px] bg-brand-50 dark:bg-brand-950/60 text-brand-fg dark:text-brand-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-bold text-ink dark:text-white mb-2">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                    {subject.shortDesc}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    {subject.topicCount} mövzu · {subject.totalQuestions} sual
                  </span>
                  <button
                    onClick={() => onSelectScreen('subjects')}
                    className="h-10 px-4 rounded-[12px] bg-stone-100 hover:bg-brand hover:text-white dark:bg-stone-800 dark:hover:bg-brand text-ink dark:text-stone-200 text-xs font-bold transition-all duration-150 flex items-center gap-1.5"
                  >
                    <span>Başla</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* "NECƏ İŞLƏYİR": 5 NUMBERED STEPS */}
      <section
        id="how-it-works"
        className="py-16 bg-brand-soft dark:bg-nav-dark/70 border-y border-stone-200 dark:border-stone-800/80"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">
              Necə işləyir?
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mt-2 text-base">
              5 addımlıq elmi və ardıcıl inkişaf sistemi ilə hədəf bala çatın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: '01',
                title: 'Qiymətləndirmə',
                desc: 'Həqiqi imtahan standartında sınaq testi verərək cari bilik səviyyəni ölçürsən.',
              },
              {
                step: '02',
                title: 'Təhlil',
                desc: 'Sistem səhvlərini mövzular üzrə qruplaşdırır və boşluqları dəqiq müəyyən edir.',
              },
              {
                step: '03',
                title: 'Fərdi məşq',
                desc: 'Yalnız səhv etdiyin tipli suallar üzrə addım-addım hədəfli tapşırıqlar həll edirsən.',
              },
              {
                step: '04',
                title: 'Yenidən test',
                desc: 'Öyrəndiyin mövzuları təkrar yoxlayaraq biliklərini möhkəmləndirirsən.',
              },
              {
                step: '05',
                title: 'İnkişaf',
                desc: 'Hər həftəlik dinamikanı qrafiklə izləyir və buraxılış imtahanına tam hazır olursan.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-surface dark:bg-surface-dark rounded-[20px] p-6 border border-stone-200 dark:border-stone-800/80 shadow-calm relative flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-brand-fg dark:text-brand-400 mb-3 tracking-wider">
                    Addım {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-ink dark:text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE SECTION */}
      <section className="py-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">
            Ağıllı öyrənmə alətləri
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mt-2 text-base">
            Əzbərləmə deyil, dərin anlama və mövzu üzrə dəqiq hədəfləmə.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Large Card: Mövzu üzrə bilik xəritəsi */}
          <div className="lg:col-span-7 bg-surface dark:bg-surface-dark rounded-[20px] p-8 border border-stone-200 dark:border-stone-800 shadow-calm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-fg dark:text-brand-400 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-ink dark:text-white">
                    Mövzu üzrə bilik xəritəsi
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Riyaziyyat paneli
                </span>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
                İmtahan proqramındakı bütün mövzular vizual zəncirlərlə göstərilir. Güclü və zəif
                mövzular rəng kodları ilə anında aşkarlanır.
              </p>

              {/* Mock UI: topic bars and weak-topic chips */}
              <div className="space-y-4 p-5 rounded-2xl bg-stone-50 dark:bg-inset-dark border border-stone-200/80 dark:border-stone-800">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span>Mövzu hazırlıq balansı</span>
                  <span className="text-brand-fg dark:text-brand-400">
                    16 mövzudan 12-si mənimsənilib
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-stone-700 dark:text-stone-300">
                        Xətti tənliklər sistemi
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                        54% · Zəif
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '54%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-stone-700 dark:text-stone-300">
                        Faiz və nisbət məsələləri
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                        62% · Diqqət tələb edir
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-stone-700 dark:text-stone-300">
                        Kvadrat tənliklər və Viyet
                      </span>
                      <span className="text-sage-600 dark:text-sage-400 font-bold tabular-nums">
                        88% · Əla
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>
                </div>

                {/* Weak topic chips */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    ⚠ Tənliklər: 5 səhv
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                    ⚠ Faizlər: 4 səhv
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40">
                    ✓ Həqiqi ədədlər: 100%
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onSelectScreen('subjects')}
                className="text-sm font-semibold text-brand-fg dark:text-brand-400 flex items-center gap-1.5 hover:underline"
              >
                <span>Bilik xəritəsini araşdır</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Two Smaller Cards: AI İzahı & Fərdi Məşq Planı */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* Card 1: AI izahı */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm flex-1 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-fg dark:text-brand-400 flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-ink dark:text-white mb-2">AI izahı</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                  Səhv etdiyin hər sual üçün quru cavab deyil, addım-addım həll yolu, qayda
                  xatırlatması və bənzər nümunələr təqdim edilir.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                <span className="font-semibold text-brand-fg dark:text-brand-400 block mb-1">
                  Nümunə AI qeydi:
                </span>
                "Tərəf-tərəfə toplama qaydasını tətbiq edərkən işarələrə diqqət yetirin..."
              </div>
            </div>

            {/* Card 2: Fərdi məşq planı */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm flex-1 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sage-50 dark:bg-sage-950/60 text-accent dark:text-sage-400 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-ink dark:text-white mb-2">
                  Fərdi məşq planı
                </h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                  Hər gün vaxtını hədəfsiz suallara deyil, balını ən çox qaldıracaq zəif mövzulara
                  yönəldən gündəlik tapşırıq siyahısı.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300">
                <span>Gündəlik hədəf: 8 sual</span>
                <span className="text-accent dark:text-sage-400">12 dəqiqə</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION: 3 CARDS */}
      <section
        id="pricing"
        className="py-20 bg-stone-50 dark:bg-nav-dark/50 border-t border-stone-200 dark:border-stone-800/80"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-ink dark:text-white tracking-tight">
              Şəffaf və əlçatan qiymətlər
            </h2>
            <p className="text-stone-600 dark:text-stone-400 mt-2 text-base">
              Hər bir abituriyentin keyfiyyətli təhsilə və fərdi təhlilə çıxışı olmalıdır.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* 1. Pulsuz */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-8 border border-stone-200 dark:border-stone-800 shadow-calm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink dark:text-white mb-1">Pulsuz</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  Platformanı yoxlamaq və ilk səviyyəni ölçmək üçün.
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-ink dark:text-white">0</span>
                  <span className="text-stone-500 dark:text-stone-400 font-medium ml-1">
                    AZN / həmişə
                  </span>
                </div>
                <ul className="space-y-3.5 text-sm text-stone-600 dark:text-stone-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Hər fəndən 1 tam sınaq imtahanı</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Ümumi nəticə və bal hesabatı</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Sual üzrə düzgün cavablar</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onSelectScreen('test')}
                className="w-full h-12 rounded-[12px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-ink dark:text-white font-semibold text-sm transition-colors"
              >
                Pulsuz sınaq ver
              </button>
            </div>

            {/* 2. Premium (Highlighted with brand border and "Ən çox seçilən" tag) */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-8 border-2 border-brand-fg shadow-calm-lg relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Ən çox seçilən
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink dark:text-white mb-1">Premium</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  9–11-ci sinif buraxılış imtahanına tam hazırlıq.
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-ink dark:text-white">4.99</span>
                  <span className="text-stone-500 dark:text-stone-400 font-medium ml-1">
                    AZN / ay
                  </span>
                </div>
                <ul className="space-y-3.5 text-sm text-stone-600 dark:text-stone-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-brand-fg" />
                    <span>Limitsiz sınaq testləri (3 fənn)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-brand-fg" />
                    <span>Zəif mövzular üzrə dərin analiz</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-brand-fg" />
                    <span>AI addım-addım izahları və qaydalar</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-brand-fg" />
                    <span>Fərdi gündəlik məşq planı və təkrar</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => onSelectScreen('test')}
                className="btn-gold w-full h-12 rounded-[12px] font-bold text-sm"
              >
                7 gün pulsuz sına
              </button>
            </div>

            {/* 3. Məktəb və kurslar */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-8 border border-stone-200 dark:border-stone-800 shadow-calm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-ink dark:text-white mb-1">
                  Məktəb və kurslar
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  Müəllimlər və tədris mərkəzləri üçün qrup idarəetməsi.
                </p>
                <div className="mb-6">
                  <span className="text-2xl font-bold text-ink dark:text-white">Fərdi təklif</span>
                  <span className="text-stone-500 dark:text-stone-400 font-medium block text-xs mt-1">
                    Şagird sayına görə
                  </span>
                </div>
                <ul className="space-y-3.5 text-sm text-stone-600 dark:text-stone-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Sinif və qrup analitika paneli</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Müəllim üçün xüsusi tapşırıq təyini</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Valideyn üçün avtomatlaşdırılmış hesabat</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() =>
                  alert('Məktəb və kurslar üzrə əməkdaşlıq üçün: partner@careerarena.az')
                }
                className="w-full h-12 rounded-[12px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-ink dark:text-white font-semibold text-sm transition-colors"
              >
                Əlaqə
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* NAVY CTA BAND: "Hazırlığa bu gün başla" */}
      <section className="bg-ink text-white py-16 border-t border-stone-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Hazırlığa bu gün başla
            </h2>
            <p className="text-stone-300 text-base">
              20 suallıq pulsuz sınaq testini həll et, zəif mövzularını gör və fərdi inkişaf planını
              dərhal əldə et.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSelectScreen('test')}
                className="h-12 px-8 rounded-[12px] bg-brand hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-base transition-all duration-150 shadow-calm"
              >
                İndi sınaq ver
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPACT FOOTER */}
      <footer className="bg-ink-deep text-stone-400 py-10 border-t border-stone-800/80 text-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">Career Arena</span>
            <span>·</span>
            <span>Exam Arena Module</span>
            <span>·</span>
            <span>© 2026 Bütün hüquqlar qorunur.</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onSelectScreen('subjects')}
              className="hover:text-white transition-colors"
            >
              Fənnlər
            </button>
            <button
              onClick={() => onSelectScreen('practice')}
              className="hover:text-white transition-colors"
            >
              Fərdi məşq
            </button>
            <button
              onClick={() => onSelectScreen('dashboard')}
              className="hover:text-white transition-colors"
            >
              İnkişaf paneli
            </button>
            <span className="text-stone-600">Bakı, Azərbaycan</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
