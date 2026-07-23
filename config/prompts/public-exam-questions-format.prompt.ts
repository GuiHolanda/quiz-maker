import type { PromptDefinition } from './types';

export interface PublicExamQuestionsFormatInput {
  readonly public_exam_name: string;
  readonly exam_board_name: string;
  readonly subject_name: string;
  readonly topic_name?: string;
  readonly reviewed_questions: string;
}

export const publicExamQuestionsFormatPrompt = {
  build: (input: PublicExamQuestionsFormatInput): string => {
    const { public_exam_name, exam_board_name, subject_name, topic_name, reviewed_questions } = input;

    return `Converta as questões em texto estruturado abaixo para o formato JSON exato especificado. Não altere nenhum conteúdo das questões — esta é uma operação puramente de formatação.

## INPUT

${reviewed_questions}

## FORMATO DE SAÍDA

Responda APENAS com JSON válido no formato abaixo, sem nenhum texto antes ou depois:

{"questions":[{"id":1,"text":"<enunciado>","correctCount":1,"publicExamName":"${public_exam_name}","examBoardName":"${exam_board_name}","subject":"${subject_name}",${topic_name ? `"topic":"${topic_name}",` : ''}"difficulty":"medium","options":{"A":"<texto>","B":"<texto>","C":"<texto>","D":"<texto>","E":"<texto>"}}]}

Campos obrigatórios por questão: id (inteiro sequencial a partir de 1), text, correctCount (inteiro 1–3), publicExamName, examBoardName, subject, difficulty (easy|medium|hard), options (objeto com chaves A–E, todas strings não vazias). O campo topic deve ser incluído apenas quando presente no input.`;
  },
} satisfies PromptDefinition<PublicExamQuestionsFormatInput>;
