import type { PromptDefinition } from './types';
import { jsonOptionsSkeleton, labelList, resolveQuestionFormat } from '@/config/question-formats';
import type { QuestionFormatKey } from '@/config/question-formats';

export interface PublicExamQuestionsFormatInput {
  readonly public_exam_name: string;
  readonly exam_board_name: string;
  readonly subject_name: string;
  readonly topic_name?: string;
  readonly reviewed_questions: string;
  readonly format?: QuestionFormatKey;
}

export const publicExamQuestionsFormatPrompt = {
  build: (input: PublicExamQuestionsFormatInput): string => {
    const { public_exam_name, exam_board_name, subject_name, topic_name, reviewed_questions } = input;
    const format = resolveQuestionFormat(input.format);

    return `Converta as questões em texto estruturado abaixo para o formato JSON exato especificado. Não altere nenhum conteúdo das questões — esta é uma operação puramente de formatação.

## INPUT

${reviewed_questions}

## FORMATO DE SAÍDA

Responda APENAS com JSON válido no formato abaixo, sem nenhum texto antes ou depois:

{"questions":[{"id":1,"examName":"${public_exam_name}","sectionName":"${subject_name}",${topic_name ? `"topic":"${topic_name}",` : ''}"text":"<enunciado>","correctCount":1,"difficulty":"medium","options":{${jsonOptionsSkeleton(format, 'texto')}}}]}

Campos obrigatórios por questão: id (inteiro sequencial a partir de 1), examName, sectionName, text, correctCount (inteiro 1–${format.maxCorrect}), difficulty (easy|medium|hard), options (objeto com exatamente as chaves ${labelList(format)}, todas strings não vazias). O campo topic deve ser incluído apenas quando presente no input.`;
  },
} satisfies PromptDefinition<PublicExamQuestionsFormatInput>;
