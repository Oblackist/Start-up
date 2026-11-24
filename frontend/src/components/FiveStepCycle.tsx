import React, { useEffect, useState } from 'react';

const STEPS = [
  {
    title: 'Qiymətləndirmə',
    desc: 'Həqiqi imtahan standartında sınaq testi verərək cari bilik səviyyəni ölçürsən.',
  },
  {
    title: 'Təhlil',
    desc: 'Sistem səhvlərini mövzular üzrə qruplaşdırır və boşluqları dəqiq müəyyən edir.',
  },
  {
    title: 'Fərdi məşq',
    desc: 'Yalnız səhv etdiyin tipli suallar üzrə addım-addım hədəfli tapşırıqlar həll edirsən.',
  },
  {
    title: 'Yenidən test',
    desc: 'Öyrəndiyin mövzuları təkrar yoxlayaraq biliklərini möhkəmləndirirsən.',
  },
  {
    title: 'İnkişaf',
    desc: 'Hər həftəlik dinamikanı qrafiklə izləyir və buraxılış imtahanına tam hazır olursan.',
  },
];

const AUTOPLAY_MS = 3200;
const RADIUS = 38; // viewBox vahidi (0–100)

/** Dairə üzrə düzülmüş 5 addım: aktiv addım avtomatik dəyişir, istənilən addıma klikləmək olar */
export const FiveStepCycle: React.FC = () => {
  const [reduceMotion, setReduceMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, reduceMotion]);

  const pos = (i: number) => {
    const angle = ((-90 + i * 72) * Math.PI) / 180;
    return { x: 50 + RADIUS * Math.cos(angle), y: 50 + RADIUS * Math.sin(angle) };
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Dairə */}
      <div className="relative w-full max-w-[460px] aspect-square mx-auto">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="1.4"
            className="stroke-stone-300 dark:stroke-stone-700"
            strokeDasharray="1.2 2.2"
          />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="stroke-brand-fg motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - (active + 1) / STEPS.length}
          />
        </svg>

        {/* Mərkəz */}
        <div
          className="absolute inset-[22%] flex items-center justify-center text-center"
          aria-live="polite"
        >
          <div className="space-y-1.5">
            <div className="text-xs font-mono font-bold text-brand-fg tracking-wider">
              Addım 0{active + 1}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-ink dark:text-white leading-tight">
              {STEPS[active].title}
            </div>
          </div>
        </div>

        {/* Nöqtələr */}
        {STEPS.map((step, i) => {
          const { x, y } = pos(i);
          const isActive = i === active;
          const isDone = i < active;
          return (
            <button
              key={step.title}
              onClick={() => setActive(i)}
              aria-label={`Addım ${i + 1}: ${step.title}`}
              aria-current={isActive ? 'step' : undefined}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              {isActive && !reduceMotion && (
                <span
                  className="absolute inset-0 rounded-full bg-brand-fg/30 animate-ping"
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 text-sm sm:text-base font-extrabold motion-safe:transition-all ${
                  isActive
                    ? 'scale-[1.18] bg-brand text-white border-brand dark:bg-brand-400 dark:text-ink dark:border-brand-400 shadow-calm-lg'
                    : isDone
                      ? 'bg-brand-soft dark:bg-brand-950/60 text-brand-fg border-brand-fg'
                      : 'bg-surface dark:bg-surface-dark text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-600'
                }`}
              >
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      {/* Addımların siyahısı */}
      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const isActive = i === active;
          return (
            <li key={step.title}>
              <button
                onClick={() => setActive(i)}
                className={`w-full text-left rounded-[16px] border p-4 sm:p-5 transition-all ${
                  isActive
                    ? 'border-brand-fg bg-surface dark:bg-surface-dark shadow-calm'
                    : 'border-transparent hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono font-bold ${isActive ? 'text-brand-fg' : 'text-stone-400'}`}
                  >
                    0{i + 1}
                  </span>
                  <span
                    className={`font-bold ${isActive ? 'text-ink dark:text-white' : 'text-stone-600 dark:text-stone-300'}`}
                  >
                    {step.title}
                  </span>
                </div>
                {isActive && (
                  <p className="mt-2 text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {step.desc}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
