import type { PromptDefinition } from './types';
import { labelList, resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormatKey } from '@/config/question-formats';

export interface CertificationQuestionsReviewInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly draft_questions: string;
  readonly topics_list?: string;
  readonly format?: QuestionFormatKey;
}

export const certificationQuestionsReviewPrompt = {
  build: (input: CertificationQuestionsReviewInput): string => {
    const { certification_name, topic_name, draft_questions, topics_list } = input;
    const format = resolveQuestionFormat(input.format);
    const topicsContext = topics_list
      ? ` The sub-topics that should be covered are:\n${topics_list}\nEnsure questions are distributed across these sub-topics.`
      : '';

    return `You are a senior certification exam editor reviewing a draft set of practice questions for the "${certification_name}" certification, topic "${topic_name}".${topicsContext}

## DRAFT QUESTIONS TO REVIEW

${draft_questions}

## REVIEW CRITERIA

For each question, check and correct if needed:
1. **Factual accuracy** — all content matches current official documentation or standards for ${certification_name}.
2. **Style fidelity** — question style, vocabulary, and distractor quality match the real exam.
3. **Distractor quality** — wrong options must be plausible but clearly incorrect on reflection; avoid obviously wrong options.
4. **Language** — correct grammar and phrasing in the exam's official language.
5. **Difficulty calibration** — difficulty label (easy/medium/hard) is appropriate.
6. **Correctness of correctCount** — the number of correct options declared is realistic for this question.
7. **Self-containment** — each question is answerable without external context.
8. **Format fidelity** — every question must keep exactly the options ${labelList(format)}. Never add, drop, or relabel an option. ${format.labelsAreSemantic ? 'These labels carry meaning and their texts are fixed — criterion 3 does not apply to this format.' : ''}

## OUTPUT

Return the revised question list in the exact same structured plain-text format as the input. Apply all corrections inline. Do not add commentary, scores, or explanations outside the question blocks. If a question is already perfect, reproduce it unchanged.

**Critical constraint:** The output must contain **exactly the same number of questions** as the input — no more, no less. You may rewrite a question entirely, but you must not add new questions or drop existing ones. Count the input questions before starting and verify the output count matches before responding.`;
  },
} satisfies PromptDefinition<CertificationQuestionsReviewInput>;
