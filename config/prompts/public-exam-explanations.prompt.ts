import type { PromptDefinition } from './types';

export interface PublicExamExplanationsInput {
  readonly public_exam_name: string;
  readonly exam_board_name: string;
  readonly role?: string;
  readonly subject: string;
  readonly topic?: string;
  readonly question: {
    readonly text: string;
    readonly options: Record<string, string>;
    readonly correctOptions: string[];
  };
}

export const publicExamExplanationsPrompt = {
  build: (input: PublicExamExplanationsInput): string => {
    const { public_exam_name, exam_board_name, role, subject, topic, question } = input;
    const cargoLine = role ? `\n- Cargo pretendido: ${role}` : '';
    const topicoLine = topic ? `\n- Tópico: ${topic}` : '';
    const optionsText = Object.entries(question.options)
      .map(([label, text]) => `${label}) ${text}`)
      .join('\n');
    const correctLabel =
      question.correctOptions.length === 1
        ? `Alternativa correta: ${question.correctOptions[0]}`
        : `Alternativas corretas: ${question.correctOptions.join(', ')}`;

    return `Você é um especialista em concursos públicos brasileiros. Explique o gabarito da questão abaixo.

CONTEXTO:
- Concurso: ${public_exam_name}
- Banca: ${exam_board_name}${cargoLine}
- Matéria: ${subject}${topicoLine}

QUESTÃO:
${question.text}

ALTERNATIVAS:
${optionsText}

${correctLabel}

OBJETIVO: Para CADA alternativa listada acima, escreva uma explicação objetiva de 1 a 3 frases explicando por que ela é correta ou incorreta. Baseie-se no dispositivo legal, súmula ou conceito doutrinário aplicável.

SAÍDA: responda APENAS com JSON válido no seguinte formato (inclua todas as alternativas da questão):
{
  "explanations": {
    "A": "Explicação da alternativa A.",
    "B": "Explicação da alternativa B."
  }
}`;
  },
} satisfies PromptDefinition<PublicExamExplanationsInput>;
