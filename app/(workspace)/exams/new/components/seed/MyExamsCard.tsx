'use client';

import type { Exam, ExamType } from '@/shared/types';

import Link from 'next/link';

import { useExamsContext } from '@/features/hooks/useExamsContext.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { getPlanLabel } from '@/shared/lib/planLabel';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';

interface MyExamsCardProps {
  readonly type: ExamType;
}

function examMeta(
  exam: Exam,
  type: ExamType,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const config = EXAM_CONFIG[type];

  if (exam.totalQuestions > 0) {
    return t(type === 'certification' ? 'certification.questionsCount' : 'concurso.questionsCount', {
      count: String(exam.totalQuestions),
    });
  }

  const sectionCount = exam.sections.length;

  if (sectionCount > 0) {
    const key =
      type === 'certification'
        ? sectionCount === 1
          ? 'certification.topicCount1'
          : 'certification.topicCountN'
        : sectionCount === 1
          ? 'concurso.subjectCount1'
          : 'concurso.subjectCountN';

    return t(key, { count: String(sectionCount) });
  }

  return t(config.cardEmptyChipKey);
}

// Rail widget: shows the user's own exams of this type (real data via ExamsProvider) plus
// remaining exam-slot quota, so Tela 1 doubles as a reminder of what already exists.
export function MyExamsCard({ type }: MyExamsCardProps) {
  const { t } = useTranslation();
  const { certifications, publicExams } = useExamsContext();
  const { usage } = useUsageContext();
  const config = EXAM_CONFIG[type];
  const exams = (type === 'certification' ? certifications : publicExams).slice(0, 3);

  if (exams.length === 0 && (usage == null || usage.examsLimit === -1)) return null;

  return (
    <div className="bg-content1 border border-default-200 rounded-xl p-5">
      <div className="font-mono text-[11px] uppercase tracking-widest text-default-400">{t(config.listTitle)}</div>
      {exams.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-2">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              className="flex justify-between items-center gap-2.5 text-sm px-3 py-2.5 rounded-lg bg-content2 hover:bg-default-200 transition-colors duration-200 text-foreground"
              href={`/exams?type=${type}`}
            >
              <span className="truncate">{exam.name}</span>
              <span className="font-mono text-[11px] text-default-400 whitespace-nowrap">
                {examMeta(exam, type, t)}
              </span>
            </Link>
          ))}
        </div>
      )}
      {usage != null && usage.examsLimit !== -1 && (
        <p className="mt-3.5 text-[13px] leading-relaxed text-default-400">
          {t('exam.slotsUsed', {
            used: String(usage.examsUsed),
            limit: String(usage.examsLimit),
            plan: getPlanLabel(usage.plan, t),
          })}
        </p>
      )}
    </div>
  );
}
