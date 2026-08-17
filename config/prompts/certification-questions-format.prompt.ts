import type { PromptDefinition } from './types';
import { jsonOptionsSkeleton, labelList, resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormatKey } from '@/config/question-formats';

export interface CertificationQuestionsFormatInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly reviewed_questions: string;
  readonly format?: QuestionFormatKey;
}

export const certificationQuestionsFormatPrompt = {
  build: (input: CertificationQuestionsFormatInput): string => {
    const { certification_name, topic_name, reviewed_questions } = input;
    const format = resolveQuestionFormat(input.format);

    return `Convert the following structured plain-text questions into the exact JSON format specified below. Do not alter any question content — this is a pure formatting operation.

## INPUT

${reviewed_questions}

## OUTPUT FORMAT

Respond ONLY with valid JSON in the following format, no text before or after:

{"questions":[{"id":1,"examName":"${certification_name}","sectionName":"${topic_name}","text":"<question text>","correctCount":1,"difficulty":"medium","options":{${jsonOptionsSkeleton(format, 'text')}}}]}

Required fields per question: id (sequential integer starting at 1), examName, sectionName, text, correctCount (integer 1–${format.maxCorrect}), difficulty (easy|medium|hard), options (object with exactly the keys ${labelList(format)}, all non-empty strings).`;
  },
} satisfies PromptDefinition<CertificationQuestionsFormatInput>;
