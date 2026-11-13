import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Crown, Minus, Send } from 'lucide-react';
import type { AuthUser, ScreenType } from '../types';
import { Avatar } from '../components/Avatar';
import { StarRating } from '../components/StarRating';
import {
  LEADERBOARD,
  PERIOD_FACTOR,
  PERIOD_LABELS,
  RATED_EXAMS,
  SEED_REVIEWS,
  SUBJECT_FILTERS,
} from '../data/community';
import type { RankingPeriod, ReviewItem } from '../data/community';

interface RankingScreenProps {
  user: AuthUser | null;
  onSelectScreen: (screen: ScreenType) => void;
}

const REVIEWS_KEY = 'ca-reviews';
const MY_BASE_POINTS = 1180;

interface Row {
  id: string;
  name: string;
  school: string;
  points: number;
  tests: number;
  average: number;
  change: number;
  isMe?: boolean;
  avatarUrl?: string;
}

const loadReviews = (): ReviewItem[] => {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    return raw ? (JSON.parse(raw) as ReviewItem[]) : [];
  } catch {
    return [];
  }
};

const ChangeBadge: React.FC<{ change: number }> = ({ change }) =>
  change === 0 ? (
    <span className="inline-flex items-center text-stone-400">
      <Minus className="w-3.5 h-3.5" />
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold ${change > 0 ? 'text-sage-700 dark:text-sage-300' : 'text-red-600 dark:text-red-400'}`}
    >
      {change > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
      {Math.abs(change)}
    </span>
  );

export const RankingScreen: React.FC<RankingScreenProps> = ({ user, onSelectScreen }) => {
  const [tab, setTab] = useState<'overall' | 'exam'>('overall');
  const [period, setPeriod] = useState<RankingPeriod>('all');
  const [subject, setSubject] = useState<(typeof SUBJECT_FILTERS)[number]['id']>('all');

  const [examId, setExamId] = useState(RATED_EXAMS[0].id);
  const [myReviews, setMyReviews] = useState<ReviewItem[]>(loadReviews);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [reviewError, setReviewError] = useState('');

  const rows = useMemo<Row[]>(() => {
    const subjectIndex = SUBJECT_FILTERS.findIndex((s) => s.id === subject);
    const scaled: Row[] = LEADERBOARD.map((e, i) => {
      const subjectFactor =
        subject === 'all' ? 1 : 1 + (((i * 7 + subjectIndex * 3) % 11) - 5) / 40;
      return { ...e, points: Math.round(e.points * PERIOD_FACTOR[period] * subjectFactor) };
    });
    if (user) {
      scaled.push({
        id: 'me',
        name: user.fullName,
        school: 'Sən',
        points: Math.round(MY_BASE_POINTS * PERIOD_FACTOR[period]),
        tests: 14,
        average: 85,
        change: 2,
        isMe: true,
        avatarUrl: user.avatarUrl,
      });
    }
    return scaled.sort((a, b) => b.points - a.points);
  }, [period, subject, user]);

  const myRank = rows.findIndex((r) => r.isMe) + 1;
  const podium = [rows[1], rows[0], rows[2]];
  const podiumRanks = [2, 1, 3];

  const exam = RATED_EXAMS.find((e) => e.id === examId) ?? RATED_EXAMS[0];
  const reviews = [...myReviews, ...SEED_REVIEWS].filter((r) => r.examId === exam.id);
  const average = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.stars === n).length,
  }));

  const examRows = LEADERBOARD.slice(0, 10).map((e, i) => ({
    ...e,
    correct: Math.min(30, Math.round((e.average / 100) * 30)),
    minutes: 24 + ((i * 3) % 17),
  }));

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (stars === 0) return setReviewError('Zəhmət olmasa ulduz seçin.');
    if (text.trim().length > 0 && text.trim().length < 10)
      return setReviewError('Şərh ən azı 10 simvol olmalıdır.');
    const review: ReviewItem = {
      id: crypto.randomUUID(),
      examId: exam.id,
      author: user.fullName,
      stars,
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    const next = [review, ...myReviews];
    setMyReviews(next);
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setStars(0);
    setText('');
    setReviewError('');
  };

  const card =
    'bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm';

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[1100px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase mb-1">
              Yarış və qiymətləndirmə
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
              Reytinq
            </h1>
          </div>
          <div
            role="tablist"
            className="inline-flex rounded-full border border-stone-200 dark:border-stone-800 bg-surface dark:bg-surface-dark p-1 self-start"
          >
            {(
              [
                ['overall', 'Ümumi reytinq'],
                ['exam', 'İmtahan üzrə'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`h-9 px-5 rounded-full text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'bg-brand text-white dark:bg-brand-400 dark:text-ink'
                    : 'text-stone-600 dark:text-stone-300 hover:text-ink dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overall' ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div role="group" aria-label="Dövr" className="flex gap-2">
                {(Object.keys(PERIOD_LABELS) as RankingPeriod[]).map((p) => (
                  <button
                    key={p}
                    aria-pressed={period === p}
                    onClick={() => setPeriod(p)}
                    className={`h-9 px-4 rounded-full border text-sm font-semibold transition-colors ${
                      period === p
                        ? 'border-brand-fg bg-brand-soft dark:bg-brand-950/50 text-brand-fg'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-300'
                    }`}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
              <select
                aria-label="Fənn"
                value={subject}
                onChange={(e) => setSubject(e.target.value as typeof subject)}
                className="h-9 px-3 rounded-[10px] border border-stone-200 dark:border-stone-700 bg-surface dark:bg-surface-dark text-sm font-semibold"
              >
                {SUBJECT_FILTERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Podium */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end">
              {podium.map((r, i) => {
                const rank = podiumRanks[i];
                return (
                  <div
                    key={r.id}
                    className={`${card} p-4 sm:p-6 text-center space-y-3 ${rank === 1 ? 'sm:pb-10 border-gold ring-1 ring-gold/40' : ''}`}
                  >
                    <div className="relative w-fit mx-auto">
                      <Avatar name={r.name} src={r.avatarUrl} size={rank === 1 ? 72 : 56} />
                      {rank === 1 && (
                        <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-gold fill-gold" />
                      )}
                    </div>
                    <div
                      className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${rank === 1 ? 'btn-gold' : 'bg-stone-100 dark:bg-inset-dark text-ink dark:text-white'}`}
                    >
                      {rank}
                    </div>
                    <div className="font-bold text-ink dark:text-white text-sm sm:text-base truncate">
                      {r.name}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block truncate">
                      {r.school}
                    </div>
                    <div className="font-extrabold text-brand-fg">
                      {r.points.toLocaleString('az-AZ')} bal
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mənim yerim */}
            {user ? (
              <div className="rounded-[16px] border border-brand-fg bg-brand-soft dark:bg-brand-950/40 p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.fullName} src={user.avatarUrl} size={44} />
                  <div>
                    <div className="font-bold text-ink dark:text-white">Sənin yerin</div>
                    <div className="text-xs text-stone-600 dark:text-stone-300">
                      {PERIOD_LABELS[period]} ·{' '}
                      {SUBJECT_FILTERS.find((s) => s.id === subject)?.label}
                    </div>
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-brand-fg">#{myRank}</div>
              </div>
            ) : (
              <div className="rounded-[16px] border border-dashed border-stone-300 dark:border-stone-700 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Reytinqdə öz yerini görmək üçün daxil ol.
                </p>
                <button
                  onClick={() => onSelectScreen('login')}
                  className="h-10 px-5 rounded-[10px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold self-start"
                >
                  Daxil ol
                </button>
              </div>
            )}

            {/* Cədvəl */}
            <div className={`${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <caption className="sr-only">Ümumi reytinq cədvəli</caption>
                  <thead className="bg-stone-50 dark:bg-inset-dark text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    <tr>
                      <th scope="col" className="text-left px-5 py-3 w-16">
                        Yer
                      </th>
                      <th scope="col" className="text-left px-3 py-3">
                        İştirakçı
                      </th>
                      <th scope="col" className="text-right px-3 py-3">
                        Bal
                      </th>
                      <th scope="col" className="text-right px-3 py-3 hidden sm:table-cell">
                        İmtahan
                      </th>
                      <th scope="col" className="text-right px-3 py-3 hidden sm:table-cell">
                        Orta
                      </th>
                      <th scope="col" className="text-right px-5 py-3 w-16">
                        Dəyişiklik
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {rows.map((r, i) => (
                      <tr
                        key={r.id}
                        className={
                          r.isMe
                            ? 'bg-brand-soft dark:bg-brand-950/40 font-semibold'
                            : 'hover:bg-stone-50 dark:hover:bg-surface-dark-alt'
                        }
                      >
                        <td className="px-5 py-3 font-extrabold text-ink dark:text-white">
                          {i + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={r.name} src={r.avatarUrl} size={34} />
                            <div className="min-w-0">
                              <div className="font-semibold text-ink dark:text-white truncate">
                                {r.name}
                                {r.isMe && ' (sən)'}
                              </div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                {r.school}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-ink dark:text-white">
                          {r.points.toLocaleString('az-AZ')}
                        </td>
                        <td className="px-3 py-3 text-right hidden sm:table-cell text-stone-600 dark:text-stone-300">
                          {r.tests}
                        </td>
                        <td className="px-3 py-3 text-right hidden sm:table-cell text-stone-600 dark:text-stone-300">
                          {r.average}%
                        </td>
                        <td className="px-5 py-3 text-right">
                          <ChangeBadge change={r.change} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="İmtahan"
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {RATED_EXAMS.map((e) => (
                <button
                  key={e.id}
                  role="radio"
                  aria-checked={e.id === examId}
                  onClick={() => setExamId(e.id)}
                  className={`text-left rounded-[16px] border p-4 transition-colors ${
                    e.id === examId
                      ? 'border-brand-fg bg-brand-soft dark:bg-brand-950/40'
                      : 'border-stone-200 dark:border-stone-800 bg-surface dark:bg-surface-dark hover:border-stone-300'
                  }`}
                >
                  <div className="font-bold text-ink dark:text-white text-sm">{e.title}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    {e.questionCount} sual · {e.participants.toLocaleString('az-AZ')} iştirakçı
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* İmtahan reytinqi */}
              <div className={`${card} lg:col-span-7 overflow-hidden`}>
                <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 font-bold text-ink dark:text-white">
                  Ən yaxşı 10 nəticə
                </div>
                <table className="w-full text-sm">
                  <caption className="sr-only">{exam.title} üzrə reytinq</caption>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {examRows.map((r, i) => (
                      <tr key={r.id}>
                        <td className="pl-5 pr-2 py-3 w-10 font-extrabold text-ink dark:text-white">
                          {i + 1}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={r.name} size={32} />
                            <span className="font-semibold text-ink dark:text-white truncate">
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-right font-bold text-ink dark:text-white">
                          {r.correct} / 30
                        </td>
                        <td className="pl-2 pr-5 py-3 text-right text-stone-500 dark:text-stone-400">
                          {r.minutes} dəq
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reytinq xülasəsi */}
              <div className={`${card} lg:col-span-5 p-6 space-y-5`}>
                <div className="flex items-center gap-5">
                  <div className="text-5xl font-extrabold text-ink dark:text-white">
                    {average ? average.toFixed(1).replace('.', ',') : '–'}
                  </div>
                  <div className="space-y-1">
                    <StarRating
                      value={average}
                      size={20}
                      label={`Orta qiymət ${average.toFixed(1)} / 5`}
                    />
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {reviews.length} qiymətləndirmə
                    </div>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {distribution.map((d) => (
                    <li key={d.n} className="flex items-center gap-3 text-xs">
                      <span className="w-6 text-stone-500 dark:text-stone-400">{d.n} ★</span>
                      <span className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-inset-dark overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-gold"
                          style={{
                            width: reviews.length ? `${(d.count / reviews.length) * 100}%` : 0,
                          }}
                        />
                      </span>
                      <span className="w-5 text-right text-stone-500">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rəy formu */}
            <div className={`${card} p-6 sm:p-8 space-y-6`}>
              <h2 className="text-xl font-bold text-ink dark:text-white">İmtahanı qiymətləndir</h2>
              {user ? (
                <form onSubmit={submitReview} noValidate className="space-y-4 max-w-xl">
                  <StarRating value={stars} onChange={setStars} size={30} label="Ulduz seç" />
                  <div className="space-y-1.5">
                    <label
                      htmlFor="review-text"
                      className="text-sm font-semibold text-ink dark:text-paper"
                    >
                      Şərh (istəyə bağlı)
                    </label>
                    <textarea
                      id="review-text"
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 300))}
                      rows={3}
                      placeholder="İmtahan haqqında fikrini yaz..."
                      className="w-full rounded-[12px] border border-stone-200 dark:border-stone-800 bg-surface dark:bg-inset-dark px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-fg/30 focus:border-brand-fg"
                    />
                    <div className="text-xs text-stone-400 text-right">{text.length} / 300</div>
                  </div>
                  {reviewError && (
                    <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                      {reviewError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-[12px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Göndər
                  </button>
                </form>
              ) : (
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  Rəy yazmaq üçün{' '}
                  <button
                    onClick={() => onSelectScreen('login')}
                    className="font-semibold text-brand-fg hover:underline"
                  >
                    daxil ol
                  </button>
                  .
                </p>
              )}

              <ul className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
                {reviews.map((r) => (
                  <li key={r.id} className="flex gap-3.5 pt-4 first:pt-4">
                    <Avatar name={r.author} size={40} />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3">
                        <span className="font-semibold text-ink dark:text-white">{r.author}</span>
                        <StarRating value={r.stars} size={14} />
                        <time className="text-xs text-stone-400" dateTime={r.date}>
                          {r.date}
                        </time>
                      </div>
                      {r.text && (
                        <p className="text-sm text-stone-700 dark:text-stone-300">{r.text}</p>
                      )}
                    </div>
                  </li>
                ))}
                {reviews.length === 0 && (
                  <li className="text-sm text-stone-500">Hələ rəy yoxdur. İlk rəyi sən yaz.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
