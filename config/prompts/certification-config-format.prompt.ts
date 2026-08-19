import type { PromptDefinition } from './types';

export interface CertificationConfigFormatInput {
  readonly certification_name: string;
  readonly reviewed_blueprint: string;
}

export const certificationConfigFormatPrompt = {
  build: (input: CertificationConfigFormatInput): string => {
    const { reviewed_blueprint } = input;

    return `Convert the following structured plain-text exam blueprint into the exact JSON format specified below. Do not alter any content — this is a pure formatting operation.

## INPUT

${reviewed_blueprint}

## OUTPUT FORMAT

Respond ONLY with valid JSON in the following format, no text before or after:

{"context":"<context from the EXAM block>","sources":["<source markdown link>","..."],"exam":{"label":"<name>","key":"<key>","provider":"<provider>","totalQuestions":<integer>,"examDurationMinutes":<integer>,"passingScore":<number>,"year":<integer>,"topics":[{"name":"<section name>","minQuestions":<integer>,"maxQuestions":<integer>,"subtopics":["<subtopic>","..."]}]}}

Rules:
- "sources" is parsed from the EXAM block's "sources" line, split on " | "; empty array if that line is "-".
- Omit any EXAM-level field whose value is "-" instead of including it as the literal string "-".
- Every SECTION becomes one entry in "topics"; omit "subtopics" for a section whose "subtopics" line is absent.
- minQuestions and maxQuestions are integers.`;
  },
} satisfies PromptDefinition<CertificationConfigFormatInput>;
