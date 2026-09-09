export { editalLocatePrompt } from './public-exam-config/locate.prompt';
export { editalVerifyPrompt } from './public-exam-config/verify.prompt';
export type { EditalVerifyInput } from './public-exam-config/verify.prompt';
export { editalExtractPrompt } from './public-exam-config/edital-extract.prompt';

import type { ExamType } from '@/shared/types';
import type { PromptDefinition } from './types';
import { certificationQuestionsResearchPrompt } from './certification-questions/research.prompt';
import { certificationQuestionsReviewPrompt } from './certification-questions/review.prompt';
import { certificationQuestionsFormatPrompt } from './certification-questions/format.prompt';
import { certificationAnswersPrompt } from './certification-questions/answers.prompt';
import { certificationExplanationsPrompt } from './certification-questions/explanations.prompt';
import { publicExamQuestionsResearchPrompt } from './public-exam-questions/research.prompt';
import { publicExamQuestionsReviewPrompt } from './public-exam-questions/review.prompt';
import { publicExamQuestionsFormatPrompt } from './public-exam-questions/format.prompt';
import { publicExamAnswersPrompt } from './public-exam-questions/answers.prompt';
import { publicExamExplanationsPrompt } from './public-exam-questions/explanations.prompt';
import { certificationConfigResearchPrompt } from './certification-config/research.prompt';
import { certificationConfigReviewPrompt } from './certification-config/review.prompt';
import { certificationConfigFormatPrompt } from './certification-config/format.prompt';
import { certificationIdentifyPrompt } from './certification-config/identify.prompt';
import { publicExamConfigResearchPrompt } from './public-exam-config/research.prompt';
import { publicExamConfigReviewPrompt } from './public-exam-config/review.prompt';
import { publicExamConfigFormatPrompt } from './public-exam-config/format.prompt';
import { publicExamIdentifyPrompt } from './public-exam-config/identify.prompt';

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

// Dispatch table for the identify step — each type has its own scope-specific prompt.
export const IDENTIFY_PROMPTS: Record<ExamType, PromptDefinition<any>> = {
  certification: certificationIdentifyPrompt,
  public_exam: publicExamIdentifyPrompt,
};
