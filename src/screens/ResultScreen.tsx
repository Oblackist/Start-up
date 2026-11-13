import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  Info,
  MinusCircle,
  OctagonX,
  RotateCcw,
  Star,
  XCircle,
} from 'lucide-react';
import type { ScreenType } from '../types';
import { ProgressRing } from '../components/ProgressRing';
import { PlagiarismReport } from '../components/PlagiarismReport';
import { useExam } from '../context/ExamContext';
import { buildDemoSession, evaluate, formatClock, MAX_VIOLATIONS } from '../utils/exam';
import type { AnswerStatus } from '../utils/exam';

interface ResultScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

const STATUS_META: Record<
  AnswerStatus,
  { label: string; icon: typeof CheckCircle2; tile: string; chip: string; text: string }
> = {
  correct: {
    label: 'Doğru',
    icon: CheckCircle2,
    tile: 'bg-sage-100 dark:bg-sage-950/60 border-sage-400 dark:border-sage-700 text-sage-800 dark:text-sage-200',
    chip: 'bg-sage-50 dark:bg-sage-950/50 border-sage-200 dark:border-sage-900/60 text-sage-700 dark:text-sage-300',
    text: 'text-sage-700 dark:text-sage-300',
  },
  wrong: {
    label: 'Yanlış',
    icon: XCircle,
    tile: 'bg-red-100 dark:bg-red-950/50 border-red-400 dark:border-red-800 text-red-800 dark:text-red-200',
    chip: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300',
    text: 'text-red-700 dark:text-red-300',
  },
  blank: {
    label: 'Boş',
    icon: MinusCircle,
    tile: 'bg-transparent border-dashed border-stone-400 dark:border-stone-500 text-stone-500 dark:text-stone-400',
    chip: 'bg-stone-100 dark:bg-inset-dark border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300',
    text: 'text-stone-500 dark:text-stone-400',
  },
};

type Filter = 'all' | AnswerStatus;

export const ResultScreen: React.FC<ResultScreenProps> = ({ onSelectScreen }) => {
  const { session } = useExam();
  const data = useMemo(
    () => (session && session.status === 'finished' ? session : buildDemoSession()),
    [session],
  );
  const ev = useMemo(() => evaluate(data), [data]);

  const [filter, setFilter] = useState<Filter>('all');
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const terminated = data.endReason === 'tab-switch';
  const visible = ev.items.filter((i) => filter === 'all' || i.status === filter);

  const stats: { status: AnswerStatus; value: number; hint: string }[] = [
    {
      status: 'correct',
      value: ev.correct,
      hint: `${ev.total ? Math.round((ev.correct / ev.total) * 100) : 0}% dəqiqlik`,
    },
    {
      status: 'wrong',
      value: ev.wrong,
      hint: `${ev.total ? Math.round((ev.wrong / ev.total) * 100) : 0}% xəta`,
    },
    {
      status: 'blank',
      value: ev.blank,
      hint: `${ev.total ? Math.round((ev.blank / ev.total) * 100) : 0}% cavabsız`,
    },
  ];

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'Hamısı', count: ev.total },
    { id: 'correct', label: 'Doğru', count: ev.correct },
    { id: 'wrong', label: 'Yanlış', count: ev.wrong },
    { id: 'blank', label: 'Boş', count: ev.blank },
  ];

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase mb-1">
              Sınaq imtahanı hesabatı
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
              Nəticə və Təhlil
            </h1>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onSelectScreen('ranking')}
              className="h-11 px-5 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold flex items-center gap-2 hover:border-brand-fg hover:text-brand-fg transition-colors"
            >
              <Star className="w-4 h-4" /> İmtahanı qiymətləndir
            </button>
            <button
              onClick={() => onSelectScreen('test')}
              className="h-11 px-5 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold flex items-center gap-2 hover:border-brand-fg hover:text-brand-fg transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Yenidən test ver
            </button>
            <button
              onClick={() => onSelectScreen('dashboard')}
              className="h-11 px-5 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold transition-colors"
            >
              İnkişaf panelinə keç
            </button>
          </div>
        </div>

        {data.isDemo && (
          <div
            role="note"
            className="rounded-[16px] border border-stone-300 dark:border-stone-700 bg-surface dark:bg-surface-dark p-4 flex gap-3 text-sm text-stone-600 dark:text-stone-300"
          >
            <Info className="w-5 h-5 shrink-0 text-brand-fg mt-0.5" />
            <p>
              Bu <b>nümunə nəticədir</b>. Hələ imtahan verməmisən. İmtahan verdikdən sonra burada öz
              nəticən görünəcək.
            </p>
          </div>
        )}

        {terminated && (
          <div
            role="alert"
            className="rounded-[16px] border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-5 flex gap-4"
          >
            <OctagonX className="w-6 h-6 shrink-0 text-red-600 dark:text-red-300" />
            <div className="space-y-1">
              <h2 className="font-bold text-red-800 dark:text-red-200">
                İmtahan qayda pozuntusuna görə dayandırıldı
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300">
                İmtahan pəncərəsindən {MAX_VIOLATIONS} dəfə çıxıldığı üçün imtahan avtomatik
                bitirildi. Nəticə yoxlama başa çatana qədər reytinqə daxil edilmir.
              </p>
            </div>
          </div>
        )}
        {data.endReason === 'time' && (
          <div
            role="note"
            className="rounded-[16px] border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200 flex gap-3"
          >
            <Clock className="w-5 h-5 shrink-0" />
            <p>Vaxt bitdiyi üçün imtahan avtomatik təhvil verildi.</p>
          </div>
        )}

        {/* Ümumi nəticə */}
        <section className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex items-center gap-6">
              <ProgressRing progress={ev.percent} size={150} strokeWidth={12} sublabel="nəticə" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Ümumi bal
                </div>
                <div className="text-4xl font-extrabold text-ink dark:text-white">
                  {ev.correct}
                  <span className="text-xl text-stone-400"> / {ev.total}</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map(({ status, value, hint }) => {
                const meta = STATUS_META[status];
                const Icon = meta.icon;
                return (
                  <div key={status} className={`rounded-xl border p-4 ${meta.chip}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="w-4 h-4" /> {meta.label}
                    </div>
                    <div className="text-3xl font-extrabold mt-2 text-ink dark:text-white">
                      {value}
                    </div>
                    <div className="text-xs mt-1 opacity-80">{hint}</div>
                  </div>
                );
              })}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-inset-dark p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-300">
                  <Clock className="w-4 h-4" /> Sərf olunan vaxt
                </div>
                <div className="text-3xl font-extrabold mt-2 font-mono text-ink dark:text-white">
                  {formatClock(ev.usedSec)}
                </div>
                <div className="text-xs mt-1 text-stone-500 dark:text-stone-400">
                  Ayrılmış: {formatClock(data.durationSec)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Suallar üzrə xəritə və siyahı */}
        <section className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink dark:text-white">Suallar üzrə nəticə</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Doğru, yanlış və boş cavablar rənglə və işarə ilə fərqləndirilir.
              </p>
            </div>
            <div role="tablist" aria-label="Filtr" className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => {
                    setFilter(f.id);
                    setOpenIdx(null);
                  }}
                  className={`h-9 px-3.5 rounded-full border text-sm font-semibold transition-colors ${
                    filter === f.id
                      ? 'bg-brand text-white border-brand dark:bg-brand-400 dark:text-ink dark:border-brand-400'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-brand-fg'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2 [grid-template-columns:repeat(auto-fill,minmax(44px,1fr))]">
            {ev.items.map((item) => {
              const meta = STATUS_META[item.status];
              const Icon = meta.icon;
              return (
                <button
                  key={item.question.id}
                  onClick={() => {
                    setFilter('all');
                    setOpenIdx(item.index);
                    document
                      .getElementById(`q-${item.index}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  title={`Sual ${item.index + 1}: ${meta.label}`}
                  aria-label={`Sual ${item.index + 1}: ${meta.label}`}
                  className={`relative h-11 rounded-lg border text-sm font-bold transition-transform hover:scale-105 ${meta.tile}`}
                >
                  {item.index + 1}
                  <Icon className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-surface dark:bg-surface-dark rounded-full" />
                </button>
              );
            })}
          </div>

          <ul className="space-y-3">
            {visible.map((item) => {
              const meta = STATUS_META[item.status];
              const Icon = meta.icon;
              const open = openIdx === item.index;
              const q = item.question;
              return (
                <li
                  key={q.id}
                  id={`q-${item.index}`}
                  className="rounded-[16px] border border-stone-200 dark:border-stone-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIdx(open ? null : item.index)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-stone-50 dark:hover:bg-surface-dark-alt transition-colors"
                  >
                    <span
                      className={`w-10 h-10 shrink-0 rounded-[10px] border flex items-center justify-center font-bold text-sm ${meta.tile}`}
                    >
                      {item.index + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        {q.topic}
                      </span>
                      <span className="block font-semibold text-ink dark:text-white truncate">
                        {q.text}
                      </span>
                    </span>
                    <span
                      className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.chip}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {meta.label}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {open && (
                    <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-stone-200 dark:border-stone-800 pt-4">
                      <p className="text-ink dark:text-paper font-medium">{q.text}</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div
                          className={`rounded-xl border p-3.5 ${STATUS_META[item.status === 'correct' ? 'correct' : item.status === 'wrong' ? 'wrong' : 'blank'].chip}`}
                        >
                          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                            Sənin cavabın
                          </div>
                          <div className="font-bold mt-1">
                            {item.chosen
                              ? `${item.chosen}) ${q.options.find((o) => o.key === item.chosen)?.text}`
                              : 'Cavab verilməyib'}
                          </div>
                        </div>
                        <div className={`rounded-xl border p-3.5 ${STATUS_META.correct.chip}`}>
                          <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                            Düzgün cavab
                          </div>
                          <div className="font-bold mt-1">
                            {q.correctAnswer}){' '}
                            {q.options.find((o) => o.key === q.correctAnswer)?.text}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200 dark:border-stone-800 p-4 space-y-2 text-sm">
                        <p className="font-semibold text-ink dark:text-white">
                          {q.explanation.summary}
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 text-stone-700 dark:text-stone-300">
                          {q.explanation.steps.map((s) => (
                            <li key={s} className="font-mono text-[13px]">
                              {s}
                            </li>
                          ))}
                        </ol>
                        <p className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 p-2.5">
                          <b>Qızıl qayda:</b> {q.explanation.rule}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="text-center text-sm text-stone-500 py-8">
                Bu filtr üzrə sual yoxdur.
              </li>
            )}
          </ul>
        </section>

        {/* Zəif mövzular */}
        {ev.weakTopics.length > 0 && (
          <section className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-ink dark:text-white">Zəif mövzular</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {ev.weakTopics.slice(0, 6).map((w) => (
                <li
                  key={w.topicId}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-ink dark:text-white truncate">{w.topic}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {w.total} sualdan {w.wrong}-i düzgün deyil
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectScreen('practice')}
                    className="shrink-0 text-sm font-semibold text-brand-fg hover:underline"
                  >
                    Məşq et →
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pozuntu jurnalı və plagiat */}
        <PlagiarismReport
          violations={data.violations.length}
          answeredCount={ev.total - ev.blank}
          total={ev.total}
          usedSec={ev.usedSec}
        />

        {data.violations.length > 0 && (
          <section className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-bold text-ink dark:text-white">Pəncərədən çıxma jurnalı</h2>
            <ul className="space-y-2 text-sm">
              {data.violations.map((ts, i) => (
                <li
                  key={ts}
                  className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-2.5 text-amber-800 dark:text-amber-200"
                >
                  <span>
                    Xəbərdarlıq {i + 1} / {MAX_VIOLATIONS}
                  </span>
                  <span className="font-mono">
                    {formatClock(Math.max(0, Math.round((ts - data.startedAt) / 1000)))} dəqiqədə
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
