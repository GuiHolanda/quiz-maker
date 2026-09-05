import type { Exam } from '@/shared/types';

export type ExamListTab = 'all' | 'certification' | 'public_exam' | 'draft';
export type ExamListSort = 'activity' | 'name' | 'readiness';

export function matchesTab(exam: Exam, tab: ExamListTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'draft') return exam.status === 'draft';
  return exam.type === tab;
}

export function countByTab(exams: Exam[], tab: ExamListTab): number {
  return exams.filter((exam) => matchesTab(exam, tab)).length;
}

function matchesSearch(exam: Exam, query: string): boolean {
  const q = query.trim().toLowerCase();

  if (!q) return true;

  const referenceEntity = exam.provider?.name ?? exam.examBoard?.name ?? '';

  return exam.name.toLowerCase().includes(q) || referenceEntity.toLowerCase().includes(q);
}

function sortExams(exams: Exam[], sort: ExamListSort): Exam[] {
  const sorted = [...exams];

  if (sort === 'name') return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  if (sort === 'readiness') return sorted.sort((a, b) => (b.readinessPercent ?? 0) - (a.readinessPercent ?? 0));

  return sorted.sort((a, b) => {
    const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;

    return bTime - aTime;
  });
}

export function filterAndSortExams(
  exams: Exam[],
  options: { tab: ExamListTab; search: string; sort: ExamListSort }
): Exam[] {
  return sortExams(
    exams.filter((exam) => matchesTab(exam, options.tab) && matchesSearch(exam, options.search)),
    options.sort
  );
}
