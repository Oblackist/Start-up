import { useCallback, useState } from 'react';
import { getSubject } from '../lib/api';
import { useRequest } from '../hooks/useRequest';
import type { Grade } from '../types';

export function ExamInfoScreen({
  subjectId,
  topicId,
  grade,
  quiz,
  onStart,
}: {
  subjectId: string;
  topicId: string | null;
  grade?: Grade;
  quiz?: number;
  onStart: (
    input: { subject_id: string; topic_id?: string; question_count: number; grade?: Grade; quiz?: number },
    subjectName: string,
  ) => Promise<void>;
}) {
  const load = useCallback(() => getSubject(subjectId), [subjectId]);
  const { data, error, loading } = useRequest(load);
  const [count, setCount] = useState<number>();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startError, setStartError] = useState('');
  const topics = grade ? data?.topics.filter((item) => item.grade === grade) : data?.topics;
  const topic = topics?.find((item) => item.id === topicId);
  const maximum = Math.min(
    quiz === undefined ? 20 : 30,
    topicId
      ? (quiz === undefined ? topic?.question_count ?? 0 :
        topic?.quizzes?.find((item) => item.number === quiz)?.question_count ?? 0)
      : (topics?.reduce((sum, item) => sum + item.question_count, 0) ?? 0),
  );
  const questionCount = Math.min(count ?? maximum, maximum);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || !agreed || busy || !questionCount) return;
    setBusy(true);
    setStartError('');
    try {
      await onStart(
        { subject_id: subjectId, topic_id: topicId ?? undefined, question_count: questionCount, grade, quiz },
        data.name,
      );
    } catch (failure) {
      setStartError(failure instanceof Error ? failure.message : 'Sınaq başlamadı.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-5">
      <h1 className="text-3xl font-extrabold">İmtahan haqqında məlumat</h1>
      {loading && <p role="status">Sınaq məlumatı yüklənir…</p>}
      {(error || startError) && <p role="alert">{error || startError}</p>}
      {data && maximum === 0 && <p>Bu seçim üçün sınaq sualı yoxdur.</p>}
      {data && maximum > 0 && (
        <form
          onSubmit={submit}
          className="bg-surface dark:bg-surface-dark border border-stone-200 dark:border-stone-800 rounded-[20px] p-6 space-y-5"
        >
          <h2 className="text-xl font-bold">
            {data.name}{quiz === undefined ? '' : ` · Quiz ${quiz}`} · {topic?.name ?? (grade
              ? `${grade}${grade === 11 ? '-ci' : '-cu'} sinif · Bütün mövzular`
              : 'Bütün mövzular')}
          </h2>
          <label className="flex items-center gap-3 font-semibold">
            Sual sayı
            <select
              value={questionCount}
              onChange={(event) => setCount(Number(event.target.value))}
              className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-surface dark:bg-surface-dark"
            >
              {Array.from({ length: maximum }, (_, index) => index + 1).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <p>{(questionCount * 1.5).toLocaleString('az-AZ')} dəqiqə · Hər düzgün cavab 1 bal</p>
          <p>
            Sınağın vaxtı bitəndə cavablar avtomatik göndərilir. İmtahan səhifəsindən üç dəfə
            ayrıldıqda sınaq dayandırılır.
          </p>
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />{' '}
            Qaydalarla tanış oldum.
          </label>
          <button
            type="submit"
            disabled={!agreed || busy}
            className="btn-gold py-3 px-5 rounded-xl font-bold disabled:opacity-50"
          >
            {busy ? 'Başladılır…' : 'İmtahana başla'}
          </button>
        </form>
      )}
    </div>
  );
}
