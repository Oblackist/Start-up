import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  LogOut,
  OctagonX,
} from 'lucide-react';
import type { OptionKey, ScreenType } from '../types';
import { SUBJECTS_DATA } from '../data/examData';
import { getQuestion } from '../data/questionBank';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { Modal } from '../components/Modal';
import { useExam } from '../context/ExamContext';
import { MAX_VIOLATIONS, formatClock } from '../utils/exam';

interface ExamScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export const ExamScreen: React.FC<ExamScreenProps> = ({ onSelectScreen }) => {
  const { session, answer, toggleFlag, addViolation, finishExam, abandonExam } = useExam();

  const [current, setCurrent] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [finishOpen, setFinishOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [warningCount, setWarningCount] = useState<number | null>(null);
  const [terminatedOpen, setTerminatedOpen] = useState(false);
  const awayRef = useRef(false);
  const handledViolations = useRef(session?.violations.length ?? 0);

  const questions = useMemo(
    () => (session ? session.questionIds.map((id) => getQuestion(id)!).filter(Boolean) : []),
    [session?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // İmtahan yoxdursa və ya bitibsə, uyğun ekrana yönləndir
  useEffect(() => {
    if (!session) onSelectScreen('exam-info');
    else if (session.status === 'finished' && !terminatedOpen) onSelectScreen('result');
  }, [session, terminatedOpen, onSelectScreen]);

  // Taymer
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = session
    ? Math.max(0, session.durationSec - Math.floor((now - session.startedAt) / 1000))
    : 0;

  useEffect(() => {
    if (session?.status === 'running' && remaining <= 0) finishExam('time');
  }, [remaining, session?.status, finishExam]);

  // Tab dəyişmə: pəncərədən çıxıb qayıdanda pozuntu sayılır
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        awayRef.current = true;
      } else if (awayRef.current) {
        awayRef.current = false;
        addViolation();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [addViolation]);

  const violationCount = session?.violations.length ?? 0;
  useEffect(() => {
    if (violationCount <= handledViolations.current) return;
    handledViolations.current = violationCount;
    if (violationCount >= MAX_VIOLATIONS) {
      setWarningCount(null);
      setTerminatedOpen(true);
      finishExam('tab-switch');
    } else {
      setWarningCount(violationCount);
    }
  }, [violationCount, finishExam]);

  const anyModalOpen = finishOpen || exitOpen || warningCount !== null || terminatedOpen;

  // Klaviatura: A–D / 1–4 cavab, ← → keçid
  useEffect(() => {
    if (anyModalOpen || !session || session.status !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      const q = questions[current];
      if (!q) return;
      const idx =
        '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
      if (idx >= 0 && e.key.length === 1) answer(q.id, OPTION_KEYS[idx]);
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(c + 1, questions.length - 1));
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModalOpen, session, questions, current, answer]);

  if (!session || questions.length === 0) return null;

  const total = questions.length;
  const q = questions[current];
  const chosen = session.answers[q.id];
  const answeredCount = questions.filter((x) => session.answers[x.id]).length;
  const blankCount = total - answeredCount;
  const flaggedCount = session.flagged.length;
  const isFlagged = session.flagged.includes(q.id);
  const subjectName = SUBJECTS_DATA.find((s) => s.id === session.setup.subjectId)?.name ?? '';

  const ratio = remaining / session.durationSec;
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
    const isAnswered = !!session.answers[item.id];
    if (isCurrent)
      return 'bg-brand text-white border-brand dark:bg-brand-400 dark:text-ink dark:border-brand-400 ring-2 ring-offset-2 ring-brand-fg ring-offset-surface dark:ring-offset-surface-dark';
    if (isAnswered)
      return 'bg-sage-100 dark:bg-sage-950/60 text-sage-800 dark:text-sage-200 border-sage-300 dark:border-sage-800';
    return 'bg-transparent text-stone-500 dark:text-stone-400 border-dashed border-stone-300 dark:border-stone-600 hover:border-brand-fg';
  };

  const submit = () => {
    setFinishOpen(false);
    finishExam('manual');
  };

  const exit = () => {
    abandonExam();
    onSelectScreen('subjects');
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-canvas dark:bg-canvas-dark text-ink dark:text-paper transition-colors">
      {/* Yuxarı panel */}
      <header className="sticky top-0 z-40 bg-surface/95 dark:bg-nav-dark/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
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
              onClick={() => setFinishOpen(true)}
              className="h-10 px-4 sm:px-5 rounded-xl bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold transition-colors"
            >
              Sınağı bitir
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

      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Sual xəritəsi */}
        <aside
          aria-label="Sual xəritəsi"
          className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3 lg:sticky lg:top-28 bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-5 space-y-5"
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
                aria-label={`Sual ${idx + 1}${session.answers[item.id] ? ', cavablandırılıb' : ', cavablandırılmayıb'}${session.flagged.includes(item.id) ? ', qeyd olunub' : ''}`}
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
        </aside>

        {/* Sual */}
        <main className="order-1 lg:order-2 lg:col-span-8 xl:col-span-9">
          <div className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex flex-wrap items-center gap-2.5 text-sm">
                <span className="font-bold text-brand-fg">Sual {current + 1}</span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600 dark:text-stone-300">{q.topic}</span>
                <DifficultyBadge difficulty={q.difficulty} />
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

            <h1 className="text-xl sm:text-2xl font-bold text-ink dark:text-white leading-snug">
              {q.text}
            </h1>

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
                    <span className="font-medium text-ink dark:text-paper">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-5 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
                className="h-11 px-4 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold flex items-center gap-1.5 hover:border-brand-fg disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Əvvəlki
              </button>
              {chosen && (
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
            Klaviatura: A–D və ya 1–4 cavab seçir, ← → suallar arasında keçid edir.
          </p>
        </main>
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
        open={warningCount !== null}
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

      {/* İmtahan dayandırıldı */}
      <Modal
        open={terminatedOpen}
        dismissible={false}
        tone="danger"
        icon={<OctagonX className="w-5 h-5" />}
        title="İmtahan dayandırıldı"
        footer={
          <button
            onClick={() => {
              setTerminatedOpen(false);
            }}
            className="h-10 px-5 rounded-[10px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold"
          >
            Nəticəyə bax
          </button>
        }
      >
        İmtahan pəncərəsindən {MAX_VIOLATIONS} dəfə çıxdığın üçün imtahan dayandırıldı. Hələlik
        verilmiş cavablar nəticəyə daxil edildi, qayda pozuntusu hesabatda göstəriləcək.
      </Modal>
    </div>
  );
};
