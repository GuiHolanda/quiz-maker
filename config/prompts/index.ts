export type { PromptDefinition } from './types';
export { certificationQuestionsResearchPrompt } from './certification-questions-research.prompt';
export type { CertificationQuestionsResearchInput } from './certification-questions-research.prompt';
export { certificationQuestionsReviewPrompt } from './certification-questions-review.prompt';
export type { CertificationQuestionsReviewInput } from './certification-questions-review.prompt';
export { certificationQuestionsFormatPrompt } from './certification-questions-format.prompt';
export type { CertificationQuestionsFormatInput } from './certification-questions-format.prompt';
export { certificationAnswersPrompt } from './certification-answers.prompt';
export type { CertificationAnswersInput } from './certification-answers.prompt';
export { certificationExplanationsPrompt } from './certification-explanations.prompt';
export type { CertificationExplanationsInput } from './certification-explanations.prompt';
export { publicExamQuestionsResearchPrompt } from './public-exam-questions-research.prompt';
export type { PublicExamQuestionsResearchInput } from './public-exam-questions-research.prompt';
export { publicExamQuestionsReviewPrompt } from './public-exam-questions-review.prompt';
export type { PublicExamQuestionsReviewInput } from './public-exam-questions-review.prompt';
export { publicExamQuestionsFormatPrompt } from './public-exam-questions-format.prompt';
export type { PublicExamQuestionsFormatInput } from './public-exam-questions-format.prompt';
export { publicExamAnswersPrompt } from './public-exam-answers.prompt';
export type { PublicExamAnswersInput } from './public-exam-answers.prompt';
export { publicExamExplanationsPrompt } from './public-exam-explanations.prompt';
export type { PublicExamExplanationsInput } from './public-exam-explanations.prompt';

import type { ExamType } from '@/shared/types';
import type { PromptDefinition } from './types';
import { certificationQuestionsResearchPrompt } from './certification-questions-research.prompt';
import { certificationQuestionsReviewPrompt } from './certification-questions-review.prompt';
import { certificationQuestionsFormatPrompt } from './certification-questions-format.prompt';
import { certificationAnswersPrompt } from './certification-answers.prompt';
import { certificationExplanationsPrompt } from './certification-explanations.prompt';
import { publicExamQuestionsResearchPrompt } from './public-exam-questions-research.prompt';
import { publicExamQuestionsReviewPrompt } from './public-exam-questions-review.prompt';
import { publicExamQuestionsFormatPrompt } from './public-exam-questions-format.prompt';
import { publicExamAnswersPrompt } from './public-exam-answers.prompt';
import { publicExamExplanationsPrompt } from './public-exam-explanations.prompt';

interface ExamPromptSet {
  research: PromptDefinition<any>;
  review: PromptDefinition<any>;
  format: PromptDefinition<any>;
  answers: PromptDefinition<any>;
  explanations: PromptDefinition<any>;
}

// Dispatch table keyed by Exam.type. The two prompt families stay separate
// (structural divergence: exam-board style, PT-BR framing); only the dispatch
// is unified. The call site passes the right input shape per type.
export const EXAM_PROMPTS: Record<ExamType, ExamPromptSet> = {
  certification: {
    research: certificationQuestionsResearchPrompt,
    review: certificationQuestionsReviewPrompt,
    format: certificationQuestionsFormatPrompt,
    answers: certificationAnswersPrompt,
    explanations: certificationExplanationsPrompt,
  },
  public_exam: {
    research: publicExamQuestionsResearchPrompt,
    review: publicExamQuestionsReviewPrompt,
    format: publicExamQuestionsFormatPrompt,
    answers: publicExamAnswersPrompt,
    explanations: publicExamExplanationsPrompt,
  },
};
