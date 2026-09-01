import type { PromptDefinition } from '../types';
import { jsonOptionsSkeleton, labelList, resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormatKey } from '@/config/question-formats';
import { promptLanguageName } from '@/config/generation-languages';
import type { GenerationLanguage } from '@/config/generation-languages';

export interface CertificationQuestionsFormatInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly reviewed_questions: string;
  readonly format?: QuestionFormatKey;
  readonly language?: GenerationLanguage;
}

export const certificationQuestionsFormatPrompt = {
  build: (input: CertificationQuestionsFormatInput): string => {
    const { certification_name, topic_name, reviewed_questions } = input;
    const format = resolveQuestionFormat(input.format);
    const languageName = promptLanguageName(input.language ?? 'pt');

    return `Convert the following structured plain-text questions into the exact JSON format specified below. Do not alter any question content — this is a pure formatting operation. All text is already written in ${languageName}; preserve it exactly, do not translate.

## INPUT

${reviewed_questions}

## OUTPUT FORMAT

Respond ONLY with valid JSON in the following format, no text before or after:

{"questions":[{"id":1,"examName":"${certification_name}","sectionName":"${topic_name}","text":"<question text>","correctCount":1,"difficulty":"medium","options":{${jsonOptionsSkeleton(format, 'text')}}}]}

Required fields per question: id (sequential integer starting at 1), examName, sectionName, text, correctCount (integer 1–${format.maxCorrect}), difficulty (easy|medium|hard), options (object with exactly the keys ${labelList(format)}, all non-empty strings).`;
  },
} satisfies PromptDefinition<CertificationQuestionsFormatInput>;
