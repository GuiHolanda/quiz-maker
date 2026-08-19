import type { PromptDefinition } from '../types';

export interface CertificationConfigReviewInput {
  readonly certification_name: string;
  readonly draft_blueprint: string;
  readonly language: 'pt' | 'en';
}

export const certificationConfigReviewPrompt = {
  build: (input: CertificationConfigReviewInput): string => {
    const { certification_name, draft_blueprint, language } = input;

    return `You are a senior certification exam editor reviewing a draft configuration blueprint for the "${certification_name}" certification.

## DRAFT BLUEPRINT TO REVIEW

${draft_blueprint}

## REVIEW CRITERIA

1. **Factual accuracy** — domain names, weights, and metadata match current official documentation.
2. **Completeness** — every official exam domain is present as a SECTION; no invented domains.
3. **Weight sanity** — minQuestions ≤ maxQuestions per section; the set of maxQuestions sums to approximately 100 for mutually-exclusive domain exams, or preserves official independent ranges otherwise.
4. **Metadata correctness** — totalQuestions, examDurationMinutes, and year are only present when the official source publishes them. passingScore is either the official percentage, or — for exams using a scaled score (e.g. AWS/PMI-style, such as 720 on a 100-1000 scale) — an approximate percentage computed as passingScaledScore ÷ scaleMax × 100, which is correct to keep as long as context also names the real scaled score and states it's an approximation, not the official criterion; only use "-" when no numeric scale is published at all.
5. **Naming** — section and subtopic names use the guide's own wording, condensed, without invented sub-areas.
6. **Language** — every text field is in ${language === 'pt' ? 'Brazilian Portuguese' : 'English'}.

## OUTPUT

Return the corrected blueprint in the exact same structured plain-text format as the input (EXAM / SECTION blocks separated by "---"). Apply corrections inline. Do not add commentary outside the blocks. If the draft is already correct, reproduce it unchanged.

**Critical constraint:** keep the same EXAM block and the same number of SECTION blocks as the input — you may correct a section's content, but you must not add or remove sections.`;
  },
} satisfies PromptDefinition<CertificationConfigReviewInput>;
