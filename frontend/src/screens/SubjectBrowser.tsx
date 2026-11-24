import { useCallback } from 'react';
import { ArrowRight, BookOpen, Calculator, Globe, Layers, Play, Shuffle } from 'lucide-react';
import { GradePicker, gradeLabel } from '../components/GradePicker';
import { ProgressRing } from '../components/ProgressRing';
import { subjectSections } from '../data/subjectSections';
import { useRequest } from '../hooks/useRequest';
import { asArray, getMyProgress, getSubject, getSubjects } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Link, useLocation, useNavigate } from '../lib/navigation';
import type { Grade, Topic } from '../types';

const order = ['math', 'aze', 'eng'];
const icons = { math: Calculator, aze: BookOpen, eng: Globe };
const shell =
  'w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors';
const card =
  'bg-surface dark:bg-surface-dark rounded-[20px] p-7 border border-stone-200 dark:border-stone-800 shadow-calm hover:shadow-calm-lg hover:border-brand-fg transition-all flex flex-col justify-between gap-6';
const primary =
  'h-11 rounded-[12px] bg-brand hover:bg-brand-700 dark:bg-brand-400 dark:hover:bg-brand-300 dark:text-ink text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2';
const secondary =
  'h-11 rounded-[12px] border border-stone-300 dark:border-stone-700 text-ink dark:text-white text-sm font-semibold hover:border-brand-fg hover:text-brand-fg transition-colors flex items-center justify-center gap-2';
const label = 'text-xs font-semibold text-brand-fg tracking-wider uppercase';
const heading = 'text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight';
const divider = 'pb-4 border-b border-stone-200 dark:border-stone-800';

const loadSubjectList = async () => {
  const subjects = asArray(await getSubjects());
  return [...subjects].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
};
function useCatalogGrade(): { grade: Grade; setGrade: (next: Grade) => void } {
  const { pathname, searchParams } = useLocation();
  const navigate = useNavigate();
  const value = Number(searchParams.get('grade'));
  const grade = value === 10 || value === 11 ? value : 9;
  const setGrade = (next: Grade) => {
    const query = new URLSearchParams(searchParams);
    query.set('grade', String(next));
    navigate(pathname + '?' + query, { replace: true });
  };
  return { grade, setGrade };
}

function catalogPath(
  page: string,
  subjectId: string,
  grade: Grade,
  extra?: Record<string, string>,
) {
  return page + '?' + new URLSearchParams({ subject: subjectId, grade: String(grade), ...extra });
}

function gradeTopics(topics: Topic[], grade: Grade) {
  return topics.filter((topic) => topic.grade === grade || topic.grade == null);
}

function sectionsFor(subjectId: string) {
  return Object.hasOwn(subjectSections, subjectId)
    ? subjectSections[subjectId as keyof typeof subjectSections]
    : [];
}

function topicsInSection(topics: Topic[], section: { topics: string[] }) {
  return topics.filter((topic) => section.topics.includes(topic.id.replace(/^g(?:9|10|11)-/, '')));
}

export function SubjectsScreen() {
  const { grade, setGrade } = useCatalogGrade();
  const { data, error, loading, retry } = useRequest(loadSubjectList);
  const { user } = useAuth();
  const userId = user?.id;
  const loadProgress = useCallback(
    () => (userId ? getMyProgress() : Promise.resolve(null)),
    [userId],
  );
  const progress = useRequest(loadProgress).data;

  return (
    <div className={shell}>
      <div className="max-w-[1440px] mx-auto space-y-10">
        <div className={'flex flex-col md:flex-row md:items-end justify-between gap-4 ' + divider}>
          <div>
            <div className={label + ' mb-1'}>Addım 1 · Fənn seçimi</div>
            <h1 className={heading}>Fənlər</h1>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md">
            Sinfi və fənni seç, sonra bölmə və mövzuları müəyyən et. İstəsən, dərhal sürətli sınaq
            imtahanı da verə bilərsən.
          </p>
        </div>
        <GradePicker grade={grade} onChange={setGrade} />
        {loading && <p role="status">Fənlər yüklənir…</p>}
        {error && (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert">{error}</p>
            <button type="button" onClick={retry} className={secondary + ' px-4'}>
              Yenidən cəhd et
            </button>
          </div>
        )}
        {data?.length === 0 && <p>Hazırda fənn yoxdur.</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.map((subject) => {
            const Icon = icons[subject.id as keyof typeof icons] ?? BookOpen;
            const stats = progress?.subjects.find((item) => item.id === subject.id);
            const count = subject.grade_question_counts?.[grade];
            return (
              <article key={subject.id} className={card}>
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-[14px] bg-brand-soft dark:bg-brand-950/60 text-brand-fg flex items-center justify-center">
                      <Icon className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <ProgressRing
                      progress={stats?.readiness_score ?? 0}
                      size={72}
                      strokeWidth={7}
                      sublabel="hazırlıq"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-white">{subject.name}</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                      {subject.short_desc}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 p-3">
                      <dt className="text-stone-500 dark:text-stone-400">
                        Sual bankı · {gradeLabel(grade)} sinif
                      </dt>
                      <dd className="font-bold text-ink dark:text-white mt-0.5">
                        {count === undefined ? '—' : count ? `${count} sual` : 'Tezliklə'}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 p-3">
                      <dt className="text-stone-500 dark:text-stone-400">Son nəticə</dt>
                      <dd className="font-bold text-ink dark:text-white mt-0.5">
                        {stats?.last_score ?? '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to={catalogPath('/sections', subject.id, grade)}
                    className={primary + ' flex-1 whitespace-nowrap px-2'}
                  >
                    <Layers className="w-4 h-4" /> Bölmələr
                  </Link>
                  <Link
                    to={catalogPath('/exam-info', subject.id, grade)}
                    className={secondary + ' flex-1 whitespace-nowrap px-2'}
                  >
                    <Play className="w-4 h-4" /> Sürətli sınaq
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SectionsScreen({ subjectId }: { subjectId: string }) {
  const { grade, setGrade } = useCatalogGrade();
  const load = useCallback(() => getSubject(subjectId), [subjectId]);
  const { data, loading, error } = useRequest(load);
  const subjects = useRequest(loadSubjectList).data;
  const topics = gradeTopics(data?.topics ?? [], grade);
  const sections = sectionsFor(subjectId);
  const hasGroups = sections.some((section) => topicsInSection(topics, section).length > 0);
  return (
    <div className={shell}>
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className={'space-y-4 ' + divider}>
          <div className={label}>Addım 2 · Bölmə seçimi</div>
          <h1 className={heading}>{data ? `${data.name}: bölmələr` : 'Bölmələr'}</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {gradeLabel(grade)} sinif · buraxılış imtahanı formatında suallar
          </p>
          <GradePicker grade={grade} onChange={setGrade} />
          <nav aria-label="Fənn" className="flex flex-wrap gap-2">
            {subjects?.map((s) => (
              <Link
                key={s.id}
                to={catalogPath('/sections', s.id, grade)}
                aria-current={s.id === subjectId ? 'page' : undefined}
                className={
                  secondary +
                  ' h-9 px-4 rounded-full ' +
                  (s.id === subjectId ? 'bg-brand text-white dark:bg-brand-400 dark:text-ink' : '')
                }
              >
                {s.name}
              </Link>
            ))}
          </nav>
        </div>
        {loading && <p role="status">Bölmələr yüklənir…</p>}
        {error && <p role="alert">{error}</p>}
        {data && !hasGroups && (
          <Link
            className="text-brand-fg font-semibold"
            to={catalogPath('/topics', subjectId, grade)}
          >
            Mövzulara bax
          </Link>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data &&
            sections.map((section) => {
              const items = topicsInSection(topics, section);
              if (!items.length) return null;
              const quizzes = items.reduce((sum, topic) => sum + (topic.quizzes?.length ?? 0), 0);
              const count = items.reduce((sum, topic) => sum + topic.question_count, 0);
              return (
                <article key={section.id} className={card}>
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-bold">{section.name}</h2>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5">
                        {section.description}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {items.length} mövzu · {quizzes} quiz · {count} sual
                    </p>
                  </div>
                  <Link
                    className={primary}
                    to={catalogPath('/topics', subjectId, grade, { section: section.id })}
                  >
                    {section.id === 'eng-read' ? 'Quizlərə keç' : 'Mövzular və quizlər'}{' '}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              );
            })}
        </div>
        {topics.some((topic) => topic.question_count > 0) && (
          <div className="rounded-[20px] border border-dashed border-stone-300 dark:border-stone-700 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Shuffle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold">Bütün bölmələrdən qarışıq imtahan</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                  {topics.length} mövzu üzrə suallar təsadüfi seçilir.
                </p>
              </div>
            </div>
            <Link to={catalogPath('/exam-info', subjectId, grade)} className={secondary + ' px-6'}>
              Qarışıq imtahana keç
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function TopicsScreen({
  subjectId,
  sectionId,
}: {
  subjectId: string;
  sectionId: string | null;
}) {
  const { grade, setGrade } = useCatalogGrade();
  const load = useCallback(() => getSubject(subjectId), [subjectId]);
  const { data, error, loading } = useRequest(load);
  const section = sectionsFor(subjectId).find((item) => item.id === sectionId);
  const available = gradeTopics(data?.topics ?? [], grade);
  const topics = section ? topicsInSection(available, section) : available;
  return (
    <div className={shell}>
      <div className="max-w-[1440px] mx-auto space-y-8">
        <div className={'space-y-4 ' + divider}>
          <div className={label}>Addım 3 · Mövzu seçimi</div>
          <h1 className={heading}>{section?.name ?? data?.name ?? 'Mövzular'}</h1>
          <GradePicker grade={grade} onChange={setGrade} />
        </div>
        {loading && <p role="status">Mövzular yüklənir…</p>}
        {error && <p role="alert">{error}</p>}
        {data && !topics.some((topic) => topic.question_count > 0) && (
          <p>Bu seçim üçün sual yoxdur.</p>
        )}
        {!section && topics.some((topic) => topic.question_count > 0) && (
          <Link
            to={catalogPath('/exam-info', subjectId, grade)}
            className={secondary + ' inline-flex px-4'}
          >
            Bütün mövzular üzrə sınaq
          </Link>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topics.map((topic) => (
            <article className={card} key={topic.id}>
              <div>
                <h2 className="text-xl font-bold">
                  {topic.name.replace(/ \((?:9|10|11)-(?:cu|ci) sinif\)$/, '')}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
                  {topic.question_count} sual
                </p>
              </div>
              {topic.question_count > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topic.quizzes?.map((quiz) => (
                    <Link
                      key={quiz.number}
                      className={primary + ' px-3'}
                      to={catalogPath('/exam-info', subjectId, grade, {
                        topic: topic.id,
                        quiz: String(quiz.number),
                      })}
                    >
                      <Play className="w-4 h-4" /> Quiz {quiz.number}
                    </Link>
                  ))}
                  {(topic.quizzes?.length ?? 0) === 0 || section?.id !== 'eng-read' ? (
                    <Link
                      className={secondary + ' px-3'}
                      to={catalogPath('/exam-info', subjectId, grade, { topic: topic.id })}
                    >
                      {topic.quizzes?.length ? 'Qarışıq sınaq' : 'Sınağa keç'}
                    </Link>
                  ) : null}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
