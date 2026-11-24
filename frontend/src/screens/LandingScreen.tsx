import { useState } from 'react';
import { FiveStepCycle } from '../components/FiveStepCycle';
import { gradeLabel } from '../components/GradePicker';
import type { Grade, ScreenType } from '../types';
import { asArray, getMyAttempts, getSubjects, getTest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Link } from '../lib/navigation';
import { useRequest } from '../hooks/useRequest';
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
  Compass,
  PenLine,
} from 'lucide-react';

const loadSubjects = () => getSubjects().then(asArray);
const grades = [9, 10, 11] as const;
const quickSubjects = [
  {
    id: 'math', name: 'Riyaziyyat', description: 'Ədədlər, funksiyalar, həndəsə', icon: Calculator,
    tone: 'bg-brand-soft text-brand-fg dark:bg-brand-950/60',
  },
  {
    id: 'aze', name: 'Azərbaycan dili', description: 'Orfoqrafiya, leksika, sintaksis', icon: PenLine,
    tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  },
  {
    id: 'eng', name: 'İngilis dili', description: 'Qrammatika, söz ehtiyatı, Reading', icon: BookOpen,
    tone: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200',
  },
] as const;

async function loadLatestAttempt() {
  const { items } = await getMyAttempts({ page: 1, per_page: 1 });
  return items[0] ? getTest(items[0].attempt_id) : null;
}

function LatestAttempt() {
  const { data: result } = useRequest(loadLatestAttempt);
  if (!result || result.total <= 0) return null;

  const topics = new Map<string, { correct: number; total: number }>();
  for (const question of result.results) {
    if (!question.topic) continue;
    const topic = topics.get(question.topic) ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (question.is_correct) topic.correct += 1;
    topics.set(question.topic, topic);
  }
  const breakdown = [...topics]
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 3);
  const percent = Math.round((100 * result.score) / result.total);

  return (
    <section aria-labelledby="landing-last-attempt" className="w-full min-w-0 space-y-3 rounded-2xl border border-stone-200 bg-surface p-4 lg:max-w-md dark:border-stone-800 dark:bg-surface-dark">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="landing-last-attempt" className="text-sm font-bold">Son sınağın nəticəsi</h2>
          <p className="text-xs text-stone-600 dark:text-stone-300">{result.subject_name}</p>
        </div>
        <p className="text-sm font-bold tabular-nums text-brand-fg">
          {percent}% <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">· {result.score} / {result.total} düzgün</span>
        </p>
      </div>
      {breakdown.length > 0 && (
        <ul className="space-y-2 text-xs">
          {breakdown.map(([title, { correct, total }]) => {
            const accuracy = Math.round((100 * correct) / total);
            return (
              <li key={title}>
                <div className="mb-1 flex justify-between gap-3 text-stone-600 dark:text-stone-300">
                  <span className="min-w-0 break-words">{title}</span><span className="shrink-0 tabular-nums">{accuracy}%</span>
                </div>
                <div aria-hidden="true" className="h-1.5 rounded-full bg-stone-100 dark:bg-stone-800">
                  <div className="h-full rounded-full bg-brand-fg" style={{ width: `${accuracy}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link className="inline-flex min-h-11 items-center text-sm font-bold text-brand-fg hover:underline lg:min-h-9" to={`/result?id=${result.attempt_id}`}>
        Nəticəyə bax
      </Link>
    </section>
  );
}

interface LandingScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

export const LandingScreen = ({ onSelectScreen }: LandingScreenProps) => {
  const { data: subjects } = useRequest(loadSubjects);
  const { user, loading: authLoading } = useAuth();
  const [grade, setGrade] = useState<Grade>(9);
  const scrollToPicker = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('landing-exam-picker')?.scrollIntoView({
      behavior: reduceMotion ? 'instant' : 'smooth', block: 'center',
    });
  };
  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper transition-colors">
      {/* HERO SECTION (işıqlı) */}
      <section className="relative bg-surface dark:bg-ink overflow-hidden py-6 sm:py-12 lg:py-24 border-b border-stone-200 dark:border-stone-800">
        {/* Yumşaq zümrüd işıq */}
        <div
          className="absolute inset-0 pointer-events-none opacity-70 dark:opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 80% 20%, var(--color-brand-100) 0%, transparent 55%), radial-gradient(circle at 5% 100%, var(--color-amber-100) 0%, transparent 40%)',
          }}
        />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-4 sm:gap-7 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-6">
            <div className="min-w-0 space-y-2.5 text-left sm:space-y-4 lg:col-span-7 lg:row-start-1 lg:self-end lg:space-y-6">
              {/* Audience pill */}
              <div className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 sm:gap-x-2 sm:px-3.5 sm:py-1.5 sm:text-xs sm:tracking-wide dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
                <span>9–11-ci siniflər üçün</span>
                <span className="text-brand-400">·</span>
                <span>DİM Buraxılış Standartı</span>
              </div>

              {/* Headline */}
              <h1 className="text-[clamp(1.8rem,8vw,2.25rem)] sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.1] text-balance">
                Nəticədən inkişafa.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-xl text-stone-600 dark:text-stone-300 max-w-xl font-normal leading-relaxed">
                Mövzu üzrə analiz, aydın izahlar və fərdi məşq planı bir platformada.
              </p>

              {/* Action Buttons */}
              <div className="hidden flex-wrap items-center gap-4 pt-2 sm:flex">
                <button
                  onClick={scrollToPicker}
                  className="btn-gold h-12 px-7 rounded-[12px] active:scale-[0.98] font-bold text-base flex items-center gap-2"
                >
                  <span>Sınaqlara bax</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="h-12 px-7 rounded-[12px] bg-white hover:bg-stone-50 dark:bg-white/5 dark:hover:bg-white/10 active:scale-[0.98] text-ink dark:text-white border border-stone-300 dark:border-white/15 font-semibold text-base transition-all duration-150 flex items-center gap-2"
                >
                  <span>Necə işləyir?</span>
                </button>
              </div>
            </div>

            <div className="flex min-w-0 justify-center lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-center">
              <section
                id="landing-exam-picker"
                aria-labelledby="landing-exam-picker-title"
                className="w-full min-w-0 max-w-[470px] space-y-3 rounded-[20px] border border-stone-200 bg-surface p-3.5 shadow-calm-lg sm:space-y-4 sm:rounded-[23px] sm:p-7 dark:border-stone-800 dark:bg-surface-dark"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-brand-soft text-brand-fg sm:size-12 dark:bg-brand-950/60">
                    <Compass className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 id="landing-exam-picker-title" className="text-xl font-extrabold tracking-tight sm:text-2xl">
                      Sınağını seç
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">
                      Sinif seç, sonra fənnin sınaqlarına bax.
                    </p>
                  </div>
                </div>
                <div
                  role="group"
                  aria-label="Sinif seçimi"
                  className="grid grid-cols-3 gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-inset-dark"
                >
                  {grades.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={grade === value}
                      onClick={() => setGrade(value)}
                      className="min-h-11 rounded-lg border border-transparent px-1 text-center text-xs font-bold text-stone-600 transition-colors hover:text-brand-fg aria-pressed:border-stone-200 aria-pressed:bg-surface aria-pressed:text-brand-fg dark:text-stone-300 dark:aria-pressed:border-stone-700 dark:aria-pressed:bg-surface-dark"
                    >
                      {gradeLabel(value)} sinif
                    </button>
                  ))}
                </div>
                <div className="grid gap-2">
                  {quickSubjects.map(({ id, name, description, icon: Icon, tone }) => {
                    const topicsPath = '/topics?' + new URLSearchParams({ subject: id, grade: String(grade) });
                    const destination = user ? topicsPath : '/register?' + new URLSearchParams({ next: topicsPath });
                    const rowClass = 'flex min-h-[60px] items-center gap-3 rounded-xl border border-stone-200 bg-surface px-3 py-2 text-left dark:border-stone-800 dark:bg-surface-dark';
                    const text = (
                      <>
                        <span className={'grid size-9 shrink-0 place-items-center rounded-lg ' + tone}>
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{name}</span>
                          <span className="block text-xs text-stone-600 dark:text-stone-300">{description}</span>
                        </span>
                      </>
                    );
                    return authLoading ? (
                      <div key={id} className={rowClass} aria-disabled="true">{text}</div>
                    ) : (
                      <Link key={id} to={destination} className={rowClass + ' motion-safe:transition-colors hover:border-brand-fg focus-visible:border-brand-fg'}>
                        {text}
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="mx-auto w-full min-w-0 max-w-[470px] space-y-3 lg:col-span-7 lg:row-start-2 lg:mx-0 lg:max-w-none lg:self-start lg:space-y-6">
              {!authLoading && !user && (
                <div className="space-y-1 text-sm text-stone-600 lg:space-y-0 dark:text-stone-300">
                  <span className="flex flex-wrap items-center gap-x-1 lg:inline">
                    Hesabın yoxdur?{' '}
                    <Link to="/register" className="inline-flex min-h-11 items-center font-semibold text-brand-fg hover:underline lg:inline lg:min-h-0">
                      Qeydiyyatdan keç
                    </Link>
                  </span>
                  <span className="mx-2 hidden text-stone-400 lg:inline">·</span>
                  <span className="flex flex-wrap items-center gap-x-1 lg:inline">
                    Artıq hesabın var?{' '}
                    <Link to="/login" className="inline-flex min-h-11 items-center font-semibold text-brand-fg hover:underline lg:inline lg:min-h-0">
                      Daxil ol
                    </Link>
                  </span>
                </div>
              )}
              {user && <LatestAttempt key={user.id} />}
              <a href="#how-it-works" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-fg hover:underline sm:hidden">
                Necə işləyir?
              </a>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-stone-500 dark:text-stone-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-500 dark:text-sage-300" />
                  <span>Ödənişsiz sınaq testi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-sage-500 dark:text-sage-300" />
                  <span>Dərhal mövzu analizi</span>
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
            İmtahan fənləri
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mt-2 text-base">
            Buraxılış imtahanının üç əsas fənni üzrə dəqiq mövzu strukturu və fərdi sınaqlar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects?.map((subject) => {
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
                    {subject.short_desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    {subject.topic_count} mövzu · {subject.question_count} sual
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

          <FiveStepCycle />
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
            {/* Card 1: Addım-addım izah */}
            <div className="bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm flex-1 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-fg dark:text-brand-400 flex items-center justify-center mb-4">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-ink dark:text-white mb-2">Addım-addım izah</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                  Səhv etdiyin hər sual üçün quru cavab deyil, addım-addım həll yolu, qayda
                  xatırlatması və bənzər nümunələr təqdim edilir.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                <span className="font-semibold text-brand-fg dark:text-brand-400 block mb-1">
                  Nümunə izah:
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
                    <span>Mövzu üzrə sınaq testləri</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-brand-fg" />
                    <span>Zəif mövzular üzrə dərin analiz</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-brand-fg" />
                    <span>Addım-addım izahlar və qaydalar</span>
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

      {/* CTA band: "Hazırlığa bu gün başla" */}
      <section className="bg-brand-700 dark:bg-brand-900 text-white py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Hazırlığa bu gün başla
            </h2>
            <p className="text-brand-100 text-base">
              20 suallıq pulsuz sınaq testini həll et, zəif mövzularını gör və fərdi inkişaf planını
              dərhal əldə et.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSelectScreen('test')}
                className="h-12 px-8 rounded-[12px] bg-white hover:bg-brand-50 active:scale-[0.98] text-brand-700 font-bold text-base transition-all duration-150 shadow-calm"
              >
                İndi sınaq ver
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
