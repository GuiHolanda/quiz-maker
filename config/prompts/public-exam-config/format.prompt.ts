import type { PromptDefinition } from '../types';

export interface PublicExamConfigFormatInput {
  readonly public_exam_name: string;
  readonly reviewed_blueprint: string;
}

export const publicExamConfigFormatPrompt = {
  build: (input: PublicExamConfigFormatInput): string => {
    const { reviewed_blueprint } = input;

    return `Converta o blueprint de concurso a seguir, em texto estruturado, para o formato JSON exato abaixo. Não altere nenhum conteúdo — esta é uma operação de formatação pura.

## ENTRADA

${reviewed_blueprint}

## FORMATO DE SAÍDA

Responda APENAS com JSON válido no formato abaixo, sem texto antes ou depois:

{"context":"<context do bloco EXAM>","sources":["<fonte em markdown>","..."],"exam":{"label":"<name>","key":"<key>","examBoard":"<examBoard>","role":"<role>","totalQuestions":<integer>,"examDurationMinutes":<integer>,"passingScore":<number>,"year":<integer>,"topics":[{"name":"<nome da disciplina>","minQuestions":<integer>,"maxQuestions":<integer>,"subtopics":["<tópico>","..."]}]}}

Regras:
- "sources" vem da linha "sources" do bloco EXAM, separada por " | "; array vazio se essa linha for "-".
- Omita qualquer campo de nível EXAM cujo valor seja "-", em vez de incluí-lo como a string literal "-".
- Cada bloco SECTION vira uma entrada em "topics"; omita "subtopics" para uma seção cuja linha "subtopics" esteja ausente.
- minQuestions e maxQuestions são inteiros.`;
  },
} satisfies PromptDefinition<PublicExamConfigFormatInput>;
