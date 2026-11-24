import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, LogOut, ShieldCheck } from 'lucide-react';
import type { ActiveExam } from '../App';
import { ApiErrorClass, submitTest } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Modal } from '../components/Modal';
import { MathFormula, MathText } from '../components/MathText';
import { QuestionDiagram } from '../components/QuestionDiagram';

interface ExamScreenProps {
  exam: ActiveExam;
  onChange: (exam: ActiveExam) => void;
  onExit: () => void;
  onSubmitted: (attemptId: number) => void;
}

const MAX_VIOLATIONS = 3;

function formatClock(seconds: number) {
  return [Math.floor(seconds / 60), seconds % 60].map((n) => String(n).padStart(2, '0')).join(':');
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  exam: session,
  onChange,
  onExit,
  onSubmitted,
}) => {
  const { questions, subjectName, violations } = session;
  const { user } = useAuth();
  const isMath = session.subjectId === 'math' || (!session.subjectId && subjectName === 'Riyaziyyat');
  const [current, setCurrent] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [finishOpen, setFinishOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [warningCount, setWarningCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submittingRef = useRef(false);
  const latest = useRef(session);
  latest.current = session;

  const durationSec = questions.length * 90;
  const remaining = Math.max(
    0,
    Math.min(durationSec, durationSec - Math.floor((now - session.startedAt) / 1000)),
  );

  const finish = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setFinishOpen(false);
    setSubmitError('');
    const { attemptId, answers, writtenAnswers } = latest.current;
    try {
      await submitTest(attemptId, answers, writtenAnswers);
      onSubmitted(attemptId);
    } catch (error) {
      if (error instanceof ApiErrorClass && error.code === 'already_submitted') {
        onSubmitted(attemptId);
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'Cavablar göndərilmədi.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [onSubmitted]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if ((remaining === 0 || violations >= MAX_VIOLATIONS) && !submitError) void finish();
  }, [remaining, violations, submitError, finish]);

  useEffect(() => {
    let away = document.hidden;
    const onVisibility = () => {
      if (document.hidden) away = true;
      else if (away) {
        away = false;
        if (submittingRef.current) return;
        const exam = latest.current;
        const count = exam.violations + 1;
        onChange({ ...exam, violations: count });
        if (count < MAX_VIOLATIONS) setWarningCount(count);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [onChange]);

  const locked = submitting || remaining === 0 || violations >= MAX_VIOLATIONS;
  const answer = useCallback(
    (id: number, value: string | null, written = false) => {
      if (locked) return;
      const exam = latest.current;
      const answers = { ...exam.answers };
      const writtenAnswers = { ...exam.writtenAnswers };
      if (written) {
        delete answers[id];
        // Keep spaces while the student is typing. Blank responses still count as unanswered.
        writtenAnswers[id] = value;
      } else {
        delete writtenAnswers[id];
        answers[id] = value;
      }
      onChange({ ...exam, answers, writtenAnswers });
    },
    [locked, onChange],
  );
  const toggleFlag = (id: number) => {
    if (locked) return;
    onChange({
      ...session,
      flagged: session.flagged.includes(id)
        ? session.flagged.filter((item) => item !== id)
        : [...session.flagged, id],
    });
  };

  useEffect(() => {
    if (locked || finishOpen || exitOpen || warningCount !== null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (event.isComposing || (target instanceof HTMLElement &&
          (target.isContentEditable || target.closest('input, textarea, select')))) return;
      const question = questions[current];
      if (!question) return;
      const index = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : -1;
      const option =
        index >= 0
          ? question.options[index]
          : question.options.find((item) => item.key.toLowerCase() === event.key.toLowerCase());
      if (option) answer(question.id, option.key);
      if (event.key === 'ArrowRight')
        setCurrent((value) => Math.min(value + 1, questions.length - 1));
      if (event.key === 'ArrowLeft') setCurrent((value) => Math.max(value - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, current, exitOpen, finishOpen, locked, questions, warningCount]);

  const total = questions.length;
  const q = questions[current];
  const isOpen = q.kind === 'open' || q.options.length === 0;
  const chosen = session.answers[q.id];
  const written = session.writtenAnswers?.[q.id] ?? (isOpen ? chosen : null) ?? '';
  const hasAnswer = (id: number) =>
    Boolean((session.writtenAnswers?.[id] ?? session.answers[id])?.trim());
  const answeredCount = questions.filter((item) => hasAnswer(item.id)).length;
  const blankCount = total - answeredCount;
  const flaggedCount = session.flagged.length;
  const isFlagged = session.flagged.includes(q.id);
  const profileName = user?.name.trim() || 'İstifadəçi';
  const initials = profileName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join('')
    .toLocaleUpperCase('az');

  const ratio = remaining / durationSec;
  const timeTone =
    remaining <= 60
      ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900/60 animate-pulse'
      : remaining <= 300
        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60'
        : 'text-ink dark:text-white bg-surface dark:bg-surface-dark border-stone-200 dark:border-stone-800';
  const barTone =
    remaining <= 60 ? 'bg-red-500' : remaining <= 300 ? 'bg-amber-500' : 'bg-brand-fg';

  const tileClass = (idx: number) => {
    const item = questions[idx];
    const isCurrent = idx === current;
    const isAnswered = hasAnswer(item.id);
    if (isCurrent)
      return 'bg-brand text-white border-brand dark:bg-brand-400 dark:text-ink dark:border-brand-400 ring-2 ring-offset-2 ring-brand-fg ring-offset-surface dark:ring-offset-surface-dark';
    if (isAnswered)
      return 'bg-sage-100 dark:bg-sage-950/60 text-sage-800 dark:text-sage-200 border-sage-300 dark:border-sage-800';
    return 'bg-transparent text-stone-500 dark:text-stone-400 border-dashed border-stone-300 dark:border-stone-600 hover:border-brand-fg';
  };

  const submit = () => {
    void finish();
  };
  const exit = () => {
    if (!submittingRef.current) onExit();
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-canvas dark:bg-canvas-dark text-ink dark:text-paper transition-colors">
      {/* Yuxarı panel */}
      <header className="sticky top-0 z-40 bg-surface/95 dark:bg-nav-dark/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              disabled={submitting}
              onClick={() => setExitOpen(true)}
              aria-label="İmtahandan çıx"
              className="h-9 w-9 shrink-0 rounded-[10px] border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-red-600 hover:border-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="font-bold text-ink dark:text-white truncate">
                {subjectName} · Sınaq
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400">
                Sual {current + 1} / {total}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div
              role="timer"
              aria-label="Qalan vaxt"
              className={`h-10 px-3.5 rounded-xl border flex items-center gap-2 font-mono font-bold text-base tabular-nums ${timeTone}`}
            >
              <Clock className="w-4 h-4" />
              {formatClock(remaining)}
            </div>
            <button
              disabled={locked}
              onClick={() => setFinishOpen(true)}
              className="h-10 px-4 sm:px-5 rounded-xl bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold transition-colors"
            >
              {submitting ? 'Göndərilir…' : 'Sınağı bitir'}
            </button>
          </div>
        </div>
        <div className="h-1 bg-stone-200 dark:bg-stone-800">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${barTone}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </header>

      {submitError && (
        <div role="alert" className="mx-auto mt-5 max-w-3xl px-4 text-red-700 dark:text-red-300">
          {submitError}{' '}
          <button type="button" className="font-bold underline" onClick={submit}>
            Yenidən göndər
          </button>
        </div>
      )}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <aside
          aria-label="Sınaq məlumatları"
          className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-28 space-y-4"
        >
          <section
            aria-label="Sual xəritəsi"
            className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-5 space-y-5"
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              <span>Suallar</span>
              <span className="text-ink dark:text-white normal-case tracking-normal text-sm">
                {answeredCount} / {total} cavablandı
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {questions.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Sual ${idx + 1}${hasAnswer(item.id) ? ', cavablandırılıb' : ', cavablandırılmayıb'}${session.flagged.includes(item.id) ? ', qeyd olunub' : ''}`}
                  aria-current={idx === current ? 'true' : undefined}
                  className={`relative aspect-square rounded-lg border text-sm font-semibold transition-colors ${tileClass(idx)}`}
                >
                  {idx + 1}
                  {session.flagged.includes(item.id) && (
                    <Flag className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  )}
                </button>
              ))}
            </div>

            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-300 pt-4 border-t border-stone-200 dark:border-stone-800">
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded bg-brand dark:bg-brand-400" /> Hazırkı sual
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded bg-sage-100 dark:bg-sage-950/60 border border-sage-300 dark:border-sage-800" />
                Cavablandırılmış ({answeredCount})
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded border border-dashed border-stone-400" />
                Cavablandırılmamış ({blankCount})
              </li>
              <li className="flex items-center gap-2.5">
                <Flag className="w-4 h-4 fill-amber-500 text-amber-600" /> Qeyd olunmuş (
                {flaggedCount})
              </li>
            </ul>
          </section>

          {user && (
            <section
              aria-labelledby="exam-profile-heading"
              className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-5"
            >
              <h2
                id="exam-profile-heading"
                className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400"
              >
                Profil
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-xl bg-sage-100 dark:bg-sage-950/60 grid place-items-center text-sm font-bold text-brand-fg"
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-ink dark:text-white">
                    {profileName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                    {user.is_verified && (
                      <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0 text-brand-fg" />
                    )}
                    {user.is_verified ? 'E-poçt təsdiqlənib' : 'E-poçt təsdiqlənməyib'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </aside>

        {/* Sual */}
        <section className="order-1 lg:order-2 lg:col-span-8 xl:col-span-9">
          <div className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className="font-bold text-brand-fg">Sual {current + 1}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600 dark:text-stone-300">{q.topic}</span>
              </div>
              <button
                onClick={() => toggleFlag(q.id)}
                aria-pressed={isFlagged}
                className={`h-9 px-3.5 rounded-[10px] border text-xs font-semibold flex items-center gap-2 transition-colors ${
                  isFlagged
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-amber-400'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500' : ''}`} />
                {isFlagged ? 'Qeyd olunub' : 'Qeyd et'}
              </button>
            </div>

            {q.passage && (
              <section aria-label="Oxu mətni" className="rounded-xl bg-stone-100 p-4 dark:bg-inset-dark">
                <h2 className="mb-2 font-bold">Oxu mətni</h2>
                <p className="whitespace-pre-wrap leading-relaxed">{q.passage}</p>
              </section>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-white leading-snug">
              <MathText enabled={isMath} text={q.text} />
            </h1>

            {q.image_svg && <QuestionDiagram svg={q.image_svg} />}

            {!isOpen && (
              <div role="radiogroup" aria-label="Cavab variantları" className="space-y-3">
                {q.options.map((opt) => {
                  const selected = chosen === opt.key;
                  return (
                    <button
                      key={opt.key}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => answer(q.id, opt.key)}
                      className={`w-full flex items-center gap-4 rounded-[14px] border p-4 text-left transition-all ${
                        selected
                          ? 'border-brand-fg bg-brand-soft dark:bg-brand-950/40 ring-1 ring-brand-fg'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-surface-dark-alt'
                      }`}
                    >
                      <span
                        className={`w-9 h-9 shrink-0 rounded-[10px] flex items-center justify-center text-sm font-bold ${
                          selected
                            ? 'bg-brand text-white dark:bg-brand-400 dark:text-ink'
                            : 'bg-stone-100 dark:bg-inset-dark text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="min-w-0 font-medium text-ink dark:text-paper break-words">
                        <MathText enabled={isMath} text={opt.text} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {(isOpen || q.accepts_written_answer) && (
              <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-inset-dark">
                <label htmlFor={`written-${q.id}`} className="block text-sm font-bold">
                  {isOpen ? 'Açıq sual · Cavabını yaz' : 'Yazılı cavab'}
                </label>
                <p id={`written-hint-${q.id}`} className="text-sm text-stone-600 dark:text-stone-300">
                  {isOpen && isMath ? (
                    <>
                      Cavab nümunələri{' '}
                      <MathFormula tex={'\\frac{28}{3}'} fallback="28/3" />,{' '}
                      <MathFormula tex="0{,}5" fallback="0,5" /> və{' '}
                      <MathFormula tex={'\\sqrt{8}'} fallback="√8" />.
                    </>
                  ) : isOpen ? 'Cavabını aşağıdakı xanaya daxil et.' :
                    'Variant seçə və ya cavabını öz sözlərinlə yaza bilərsən.'}
                </p>
                {isOpen && isMath ? (
                  <input
                    key={q.id}
                    id={`written-${q.id}`}
                    aria-describedby={`written-hint-${q.id}`}
                    type="text"
                    maxLength={200}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={locked}
                    value={written}
                    onChange={(event) => answer(q.id, event.target.value || null, true)}
                    className="block w-full rounded-xl border border-stone-300 bg-surface px-4 py-3 focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/30 dark:border-stone-700 dark:bg-surface-dark"
                  />
                ) : (
                  <textarea
                    key={q.id}
                    id={`written-${q.id}`}
                    aria-describedby={`written-hint-${q.id}`}
                    rows={3}
                    maxLength={200}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={locked}
                    value={written}
                    onChange={(event) => answer(q.id, event.target.value || null, true)}
                    className="block w-full resize-y rounded-xl border border-stone-300 bg-surface px-4 py-3 focus:border-brand-fg focus:outline-none focus:ring-2 focus:ring-brand-fg/30 dark:border-stone-700 dark:bg-surface-dark"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-5 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="h-11 px-4 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold flex items-center gap-1.5 hover:border-brand-fg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Əvvəlki
              </button>
              {(chosen || written) && (
                <button
                  onClick={() => answer(q.id, null)}
                  className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-red-600"
                >
                  Cavabı təmizlə
                </button>
              )}
              {current < total - 1 ? (
                <button
                  onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
                  className="h-11 px-5 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold flex items-center gap-1.5"
                >
                  Sonrakı <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setFinishOpen(true)}
                  className="btn-gold h-11 px-6 rounded-[12px] text-sm font-bold"
                >
                  Sınağı bitir
                </button>
              )}
            </div>
          </div>
          <p className="hidden lg:block text-xs text-stone-400 mt-3 text-center">
            Klaviatura: A–E və ya 1–5 variant seçir, ← → suallar arasında keçid edir.
          </p>
        </section>
      </div>

      {/* Bitirmə təsdiqi */}
      <Modal
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="Sınağı tamamlamaq istəyirsən?"
        footer={
          <>
            <button
              onClick={() => setFinishOpen(false)}
              className="h-10 px-5 rounded-[10px] border border-stone-300 dark:border-stone-700 text-sm font-semibold"
            >
              Davam et
            </button>
            <button
              onClick={submit}
              className="h-10 px-5 rounded-[10px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold"
            >
              İmtahanı bitir
            </button>
          </>
        }
      >
        <ul className="space-y-1.5">
          <li>
            Cavablandırılmış: <b className="text-ink dark:text-white">{answeredCount}</b>
          </li>
          <li>
            Boş qalan:{' '}
            <b
              className={blankCount ? 'text-red-600 dark:text-red-400' : 'text-ink dark:text-white'}
            >
              {blankCount}
            </b>
          </li>
          <li>
            Qeyd olunmuş: <b className="text-ink dark:text-white">{flaggedCount}</b>
          </li>
          <li>
            Qalan vaxt:{' '}
            <b className="font-mono text-ink dark:text-white">{formatClock(remaining)}</b>
          </li>
        </ul>
        {blankCount > 0 && <p className="mt-3">Boş suallar nəticədə bal verməyəcək.</p>}
      </Modal>

      {/* Çıxış təsdiqi */}
      <Modal
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        tone="danger"
        icon={<LogOut className="w-5 h-5" />}
        title="İmtahandan çıxmaq istəyirsən?"
        footer={
          <>
            <button
              onClick={() => setExitOpen(false)}
              className="h-10 px-5 rounded-[10px] border border-stone-300 dark:border-stone-700 text-sm font-semibold"
            >
              Davam et
            </button>
            <button
              onClick={exit}
              className="h-10 px-5 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
            >
              Çıx
            </button>
          </>
        }
      >
        İmtahan ləğv olunacaq, cavabların saxlanılmayacaq və nəticə hesablanmayacaq.
      </Modal>

      {/* Tab dəyişmə xəbərdarlığı */}
      <Modal
        open={warningCount !== null && !locked}
        dismissible={false}
        tone="warning"
        icon={<AlertTriangle className="w-5 h-5" />}
        title={`Xəbərdarlıq ${warningCount} / ${MAX_VIOLATIONS}`}
        footer={
          <button
            onClick={() => setWarningCount(null)}
            className="h-10 px-5 rounded-[10px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold"
          >
            Anladım, davam et
          </button>
        }
      >
        <p>İmtahan pəncərəsindən kənara çıxdığın aşkarlandı. Bu hal qeydə alındı.</p>
        <p className="mt-2">
          Daha <b className="text-ink dark:text-white">{MAX_VIOLATIONS - (warningCount ?? 0)}</b>{' '}
          dəfə təkrarlansa, imtahan avtomatik dayandırılacaq.
        </p>
      </Modal>
    </div>
  );
};
