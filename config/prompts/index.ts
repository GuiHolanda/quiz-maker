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
export { examIdentifyPrompt } from './exam-identify.prompt';
export type { ExamIdentifyInput } from './exam-identify.prompt';
export { certificationConfigResearchPrompt } from './certification-config-research.prompt';
export type { CertificationConfigResearchInput } from './certification-config-research.prompt';
export { certificationConfigReviewPrompt } from './certification-config-review.prompt';
export type { CertificationConfigReviewInput } from './certification-config-review.prompt';
export { certificationConfigFormatPrompt } from './certification-config-format.prompt';
export type { CertificationConfigFormatInput } from './certification-config-format.prompt';
export { publicExamConfigResearchPrompt } from './public-exam-config-research.prompt';
export type { PublicExamConfigResearchInput } from './public-exam-config-research.prompt';
export { publicExamConfigReviewPrompt } from './public-exam-config-review.prompt';
export type { PublicExamConfigReviewInput } from './public-exam-config-review.prompt';
export { publicExamConfigFormatPrompt } from './public-exam-config-format.prompt';
export type { PublicExamConfigFormatInput } from './public-exam-config-format.prompt';

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
import { certificationConfigResearchPrompt } from './certification-config-research.prompt';
import { certificationConfigReviewPrompt } from './certification-config-review.prompt';
import { certificationConfigFormatPrompt } from './certification-config-format.prompt';
import { publicExamConfigResearchPrompt } from './public-exam-config-research.prompt';
import { publicExamConfigReviewPrompt } from './public-exam-config-review.prompt';
import { publicExamConfigFormatPrompt } from './public-exam-config-format.prompt';

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

interface AutoConfigPromptSet {
  research: PromptDefinition<any>;
  review: PromptDefinition<any>;
  format: PromptDefinition<any>;
}

// Dispatch table for the auto-config blueprint pipeline (research → review → format).
// The identify prompt is shared across both types (see exam-identify.prompt.ts) and lives
// outside this table since it isn't part of the per-type chain.
export const AUTO_CONFIG_PROMPTS: Record<ExamType, AutoConfigPromptSet> = {
  certification: {
    research: certificationConfigResearchPrompt,
    review: certificationConfigReviewPrompt,
    format: certificationConfigFormatPrompt,
  },
  public_exam: {
    research: publicExamConfigResearchPrompt,
    review: publicExamConfigReviewPrompt,
    format: publicExamConfigFormatPrompt,
  },
};
