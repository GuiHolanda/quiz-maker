import type { AIPublicExamQuestion } from '@/shared/types';
import type { PromptDefinition } from './types';

export interface PublicExamAnswersInput {
  readonly public_exam_name: string;
  readonly exam_board_name: string;
  readonly role?: string;
  readonly subject_name: string;
  readonly topic_name?: string;
  readonly questions: AIPublicExamQuestion[];
}

export const publicExamAnswersPrompt = {
  build: (input: PublicExamAnswersInput): string => {
    const { public_exam_name, exam_board_name, role, subject_name, topic_name, questions } = input;
    const topicoLine = topic_name ? `\n- Tópico: ${topic_name}` : '';
    const cargoLine = role ? `\n- Cargo pretendido: ${role}` : '';

    return `Você é um especialista em concursos públicos brasileiros validando o gabarito de questões.

CONTEXTO:
- Concurso: ${public_exam_name}
- Banca: ${exam_board_name}${cargoLine}
- Matéria: ${subject_name}${topicoLine}

QUESTÕES:
${JSON.stringify(questions, null, 2)}

OBJETIVO: Para cada questão acima, retorne:
1. "questionId": o id da questão.
2. "correctOptions": array com as letras corretas (de 1 a "correctCount" entradas, dentro de A–E).

REGRAS:
1. Responda em português brasileiro formal.
2. "correctOptions" deve ter exatamente "correctCount" letras para cada questão.
3. Quando aplicável, baseie a resposta no dispositivo legal, súmula ou conceito doutrinário correto.
4. NÃO altere o texto da questão nem das alternativas.

SAÍDA: responda APENAS com JSON válido no seguinte formato:
{
  "answers": [
    {
      "questionId": 1,
      "correctOptions": ["A"]
    }
  ]
}`;
  },
} satisfies PromptDefinition<PublicExamAnswersInput>;
