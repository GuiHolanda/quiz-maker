'use client';
import type { Exam } from '@/shared/types';
import type { ExamDraftValidation } from '@/lib/exam-draft-validation';

import { getDistributionSumTone } from '@/lib/exam-draft-validation';
import { ExamProvenanceCard } from '@/app/(workspace)/exams/new/components/editor/ExamProvenanceCard';
import { ExamChecklistCard } from '@/app/(workspace)/exams/new/components/editor/ExamChecklistCard';
import { ExamSummaryCard } from '@/app/(workspace)/exams/new/components/editor/ExamSummaryCard';
import { ExamTipsCard } from '@/app/(workspace)/exams/new/components/editor/ExamTipsCard';

interface ExamReviewSidebarProps {
  readonly draft: Exam;
  readonly validation: ExamDraftValidation;
  // Only set in create mode when the AI seed actually returned provenance — edit mode and
  // the edital/blank seeds never pass these, so the provenance card is skipped.
  readonly context?: string;
  readonly sources?: readonly string[];
}

export function ExamReviewSidebar({ draft, validation, context, sources }: ExamReviewSidebarProps) {
  return (
    <div className="flex flex-col gap-4">
      {context && <ExamProvenanceCard context={context} sources={sources ?? []} />}
      <ExamChecklistCard draft={draft} validation={validation} />
      <ExamSummaryCard
        distributionSum={validation.distributionSum}
        distributionSumTone={getDistributionSumTone(validation.distributionSum)}
        sectionCount={validation.sectionCount}
        topicCount={validation.topicCount}
        totalQuestions={draft.totalQuestions}
      />
      <ExamTipsCard />
    </div>
  );
}
