import type { PromptDefinition } from './types';

export interface CertificationQuestionsFormatInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly reviewed_questions: string;
}

export const certificationQuestionsFormatPrompt = {
  build: (input: CertificationQuestionsFormatInput): string => {
    const { certification_name, topic_name, reviewed_questions } = input;

    return `Convert the following structured plain-text questions into the exact JSON format specified below. Do not alter any question content — this is a pure formatting operation.

## INPUT

${reviewed_questions}

## OUTPUT FORMAT

Respond ONLY with valid JSON in the following format, no text before or after:

{"questions":[{"id":1,"certificationTitle":"${certification_name}","text":"<question text>","correctCount":1,"topic":"${topic_name}","difficulty":"medium","options":{"A":"<text>","B":"<text>","C":"<text>","D":"<text>","E":"<text>"}}]}

Required fields per question: id (sequential integer starting at 1), certificationTitle, text, correctCount (integer 1–3), topic, difficulty (easy|medium|hard), options (object with keys A–E, all non-empty strings).`;
  },
} satisfies PromptDefinition<CertificationQuestionsFormatInput>;
