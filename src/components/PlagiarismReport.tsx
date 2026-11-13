import React from 'react';
import { CheckCircle2, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';

type Level = 'ok' | 'warn' | 'bad';

interface PlagiarismReportProps {
  violations: number;
  answeredCount: number;
  total: number;
  usedSec: number;
}

const LEVEL = {
  ok: {
    label: 'Təmiz',
    icon: ShieldCheck,
    text: 'text-sage-700 dark:text-sage-300',
    box: 'bg-sage-50 dark:bg-sage-950/40 border-sage-200 dark:border-sage-900/60',
    bar: 'bg-sage-500',
    summary: 'Cavablarda oxşarlıq və qayda pozuntusu riski aşkarlanmadı.',
  },
  warn: {
    label: 'Yoxlanmalıdır',
    icon: TriangleAlert,
    text: 'text-amber-700 dark:text-amber-300',
    box: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
    bar: 'bg-amber-500',
    summary: 'Bəzi göstəricilər normadan kənardır. Nəticə moderator yoxlamasına göndərilə bilər.',
  },
  bad: {
    label: 'Şübhəli',
    icon: ShieldAlert,
    text: 'text-red-700 dark:text-red-300',
    box: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50',
    bar: 'bg-red-500',
    summary: 'Yüksək risk aşkarlandı. Nəticə yoxlama başa çatana qədər təsdiqlənməyəcək.',
  },
} as const;

const levelOf = (value: number, warnAt: number, badAt: number): Level =>
  value >= badAt ? 'bad' : value >= warnAt ? 'warn' : 'ok';

/** Plagiat və qayda pozuntusu hesabatı. Göstəricilər MOCK hesablanır, backend hazır olanda server verəcək. */
export const PlagiarismReport: React.FC<PlagiarismReportProps> = ({
  violations,
  answeredCount,
  total,
  usedSec,
}) => {
  const avgSec = answeredCount ? Math.round(usedSec / answeredCount) : 0;
  const similarity = Math.min(100, 3 + violations * 5 + (avgSec > 0 && avgSec < 15 ? 12 : 0));

  const checks: { label: string; value: string; level: Level; note: string }[] = [
    {
      label: 'Digər iştirakçılarla cavab oxşarlığı',
      value: `${similarity}%`,
      level: levelOf(similarity, 10, 25),
      note: '10%-dən aşağı normal sayılır',
    },
    {
      label: 'Cavab sürəti',
      value: avgSec ? `${avgSec} san / sual` : '—',
      level: avgSec > 0 && avgSec < 15 ? 'warn' : 'ok',
      note: '15 saniyədən sürətli cavablar şübhəli sayılır',
    },
    {
      label: 'Pəncərədən çıxma',
      value: `${violations} dəfə`,
      level: levelOf(violations, 1, 3),
      note: '3 pozuntu imtahanı dayandırır',
    },
    {
      label: 'Kopyalama və yapışdırma',
      value: '0 hadisə',
      level: 'ok',
      note: 'Mətn kopyalama aşkarlanmadı',
    },
  ];

  const overall: Level = checks.some((c) => c.level === 'bad')
    ? 'bad'
    : checks.some((c) => c.level === 'warn')
      ? 'warn'
      : 'ok';
  const meta = LEVEL[overall];
  const Icon = meta.icon;

  return (
    <section
      aria-label="Plagiat yoxlaması"
      className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white">Plagiat yoxlaması</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {answeredCount} / {total} cavab avtomatik analizdən keçdi
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm font-bold ${meta.box} ${meta.text}`}
        >
          <Icon className="w-4 h-4" />
          {meta.label}
        </span>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm flex items-start gap-3 ${meta.box} ${meta.text}`}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <p>{meta.summary}</p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((c) => (
          <li
            key={c.label}
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-inset-dark p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-ink dark:text-white">{c.label}</span>
              {c.level === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-sage-600 dark:text-sage-300 shrink-0" />
              ) : (
                <TriangleAlert
                  className={`w-4 h-4 shrink-0 ${c.level === 'bad' ? 'text-red-600' : 'text-amber-600'}`}
                />
              )}
            </div>
            <div className="flex items-end justify-between gap-3">
              <span className={`text-lg font-extrabold ${LEVEL[c.level].text}`}>{c.value}</span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 text-right">
                {c.note}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${LEVEL[c.level].bar}`}
                style={{ width: c.level === 'ok' ? '18%' : c.level === 'warn' ? '55%' : '90%' }}
              />
            </div>
          </li>
        ))}
      </ul>

      {similarity >= 10 && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-4 space-y-3">
          <h3 className="text-sm font-bold text-ink dark:text-white">Oxşar cavab qrupları</h3>
          <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
            <li className="flex justify-between gap-3">
              <span>İştirakçı #4821 (anonim)</span>
              <b className="text-ink dark:text-white">
                {Math.max(2, Math.round(total * 0.2))} / {total} eyni cavab
              </b>
            </li>
            <li className="flex justify-between gap-3">
              <span>İştirakçı #1307 (anonim)</span>
              <b className="text-ink dark:text-white">
                {Math.max(1, Math.round(total * 0.13))} / {total} eyni cavab
              </b>
            </li>
          </ul>
        </div>
      )}

      <p className="text-xs text-stone-400">
        Bu hesabat avtomatik analizdir və yekun qərar deyil. Yekun qərarı moderator verir.
      </p>
    </section>
  );
};
