import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Copy,
  Eye,
  Flag,
  ListChecks,
  Play,
  ShieldCheck,
} from 'lucide-react';
import type { ScreenType } from '../types';
import { SUBJECTS_DATA } from '../data/examData';
import { DIFFICULTY_META, getSection, getTopic } from '../data/catalog';
import { useExam } from '../context/ExamContext';
import { MAX_VIOLATIONS, examDurationMinutes, formatMinutes } from '../utils/exam';

interface ExamInfoScreenProps {
  onSelectScreen: (screen: ScreenType) => void;
  onStartExam: () => void;
}

export const ExamInfoScreen: React.FC<ExamInfoScreenProps> = ({ onSelectScreen, onStartExam }) => {
  const { setup, session } = useExam();
  const [agreed, setAgreed] = useState(false);

  const subject = SUBJECTS_DATA.find((s) => s.id === setup.subjectId) ?? SUBJECTS_DATA[0];
  const section = getSection(setup.sectionId);
  const topics = setup.topicIds.map((id) => getTopic(id)).filter(Boolean);
  const duration = examDurationMinutes(setup.questionCount);
  const running = session?.status === 'running';

  const facts = [
    { label: 'Fənn', value: subject.name },
    { label: 'Bölmə', value: section?.name ?? 'Bütün bölmələr' },
    {
      label: 'Çətinlik',
      value: setup.difficulty === 'mixed' ? 'Qarışıq' : DIFFICULTY_META[setup.difficulty].label,
    },
    { label: 'Sual sayı', value: `${setup.questionCount} sual` },
    { label: 'Müddət', value: `${formatMinutes(duration)} dəqiqə` },
    { label: 'Qiymətləndirmə', value: 'Hər düzgün cavab 1 bal' },
  ];

  const rules = [
    {
      icon: Clock,
      text: `Müddət ${formatMinutes(duration)} dəqiqədir (${setup.questionCount} sual × 1,5). Vaxt bitəndə imtahan avtomatik təhvil verilir.`,
    },
    {
      icon: ListChecks,
      text: 'Suallar arasında sərbəst keçid edə, cavabı dəyişə və çətin sualları "qeyd et" ilə sonraya saxlaya bilərsən.',
    },
    {
      icon: Eye,
      text: `İmtahan zamanı başqa tab və ya pəncərəyə keçmək qadağandır. ${MAX_VIOLATIONS} xəbərdarlıqdan sonra imtahan dayandırılır.`,
    },
    {
      icon: Copy,
      text: 'Cavabların oxşarlığı və qayda pozuntuları avtomatik plagiat yoxlamasından keçir.',
    },
    { icon: Flag, text: 'Cavablandırılmamış suallar nəticədə "boş" sayılır və bal verilmir.' },
  ];

  return (
    <div className="w-full flex-1 bg-canvas dark:bg-canvas-dark text-ink dark:text-paper py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-[960px] mx-auto space-y-8">
        <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="text-xs font-semibold text-brand-fg tracking-wider uppercase mb-1">
            Addım 4 · İmtahandan əvvəl
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight">
            İmtahan haqqında məlumat
          </h1>
        </div>

        {running && (
          <div className="rounded-[16px] border border-brand-fg bg-brand-soft dark:bg-brand-950/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-ink dark:text-white">Davam edən imtahanın var</h2>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Başladığın imtahan hələ bitməyib. Vaxt saxlanmır, geri sayım davam edir.
              </p>
            </div>
            <button
              onClick={() => onSelectScreen('test')}
              className="h-11 px-6 rounded-[12px] bg-brand dark:bg-brand-400 dark:text-ink text-white text-sm font-semibold shrink-0"
            >
              İmtahana qayıt
            </button>
          </div>
        )}

        {setup.subjectId !== 'math' && (
          <div
            role="note"
            className="rounded-[16px] border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3 text-sm text-amber-800 dark:text-amber-200"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              <b>Nümunə rejimi:</b> bu fənn üçün sual bazası hələ əlavə olunmayıb, interfeys
              Riyaziyyat nümunə sualları ilə göstərilir.
            </p>
          </div>
        )}

        <section className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-6">
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-xl bg-stone-50 dark:bg-inset-dark border border-stone-200/70 dark:border-stone-800 p-4"
              >
                <dt className="text-xs text-stone-500 dark:text-stone-400">{f.label}</dt>
                <dd className="font-bold text-ink dark:text-white mt-1">{f.value}</dd>
              </div>
            ))}
          </dl>

          {topics.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-ink dark:text-white mb-2">Seçilmiş mövzular</h2>
              <ul className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <li
                    key={t!.id}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-soft dark:bg-brand-950/50 text-brand-fg border border-brand-200 dark:border-brand-900/60"
                  >
                    {t!.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="bg-surface dark:bg-surface-dark rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-calm p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-bold text-ink dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-fg" />
            İmtahan qaydaları
          </h2>
          <ul className="space-y-4">
            {rules.map((r) => (
              <li
                key={r.text}
                className="flex items-start gap-3.5 text-sm text-stone-700 dark:text-stone-300"
              >
                <span className="w-9 h-9 shrink-0 rounded-[10px] bg-brand-soft dark:bg-brand-950/60 text-brand-fg flex items-center justify-center">
                  <r.icon className="w-4 h-4" />
                </span>
                <span className="pt-1.5 leading-relaxed">{r.text}</span>
              </li>
            ))}
          </ul>

          <label className="flex items-start gap-3 pt-2 text-sm text-stone-700 dark:text-stone-200 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-brand"
            />
            <span>Qaydalarla tanış oldum və onlara əməl edəcəyəm.</span>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onSelectScreen(section ? 'topics' : 'subjects')}
              className="h-12 px-6 rounded-[12px] border border-stone-300 dark:border-stone-700 text-sm font-semibold text-ink dark:text-white hover:border-brand-fg transition-colors"
            >
              Seçimi dəyiş
            </button>
            <button
              disabled={!agreed}
              onClick={onStartExam}
              className="btn-gold h-12 px-8 rounded-[12px] font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:filter-none"
            >
              <Play className="w-4 h-4" />
              İmtahana başla
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
