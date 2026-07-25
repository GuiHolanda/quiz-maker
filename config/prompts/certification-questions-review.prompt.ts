import type { PromptDefinition } from './types';

export interface CertificationQuestionsReviewInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly draft_questions: string;
}

export const certificationQuestionsReviewPrompt = {
  build: (input: CertificationQuestionsReviewInput): string => {
    const { certification_name, topic_name, draft_questions } = input;

    return `You are a senior certification exam editor reviewing a draft set of practice questions for the "${certification_name}" certification, topic "${topic_name}".

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

## CRITICAL RULES

- **NEVER remove or discard any question.** If a question has issues, fix it — do not drop it.
- **The output MUST contain exactly the same number of questions as the input.** Count them before responding.
- If a question is beyond repair, replace it with a new question on the same topic and difficulty — do not reduce the count.

## OUTPUT

Return the complete revised question list in the exact same structured plain-text format as the input. Apply all corrections inline. Do not add commentary, scores, or explanations outside the question blocks. If a question is already perfect, reproduce it unchanged.`;
  },
} satisfies PromptDefinition<CertificationQuestionsReviewInput>;
