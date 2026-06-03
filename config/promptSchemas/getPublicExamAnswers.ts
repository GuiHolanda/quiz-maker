import { AIPublicExamQuestion } from '@/shared/types';

interface GetAnswersParams {
  public_exam_name: string;
  exam_board_name: string;
  subject_name: string;
  topic_name?: string;
  questions: AIPublicExamQuestion[];
}

export function buildGetPublicExamAnswersPrompt(params: GetAnswersParams): string {
  const { public_exam_name, exam_board_name, subject_name, topic_name, questions } = params;
  const topicoLine = topic_name ? `\n- Tópico: ${topic_name}` : '';

  return `Você é um especialista em concursos públicos brasileiros validando o gabarito de questões.

CONTEXTO:
- Concurso: ${public_exam_name}
- Banca: ${exam_board_name}
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
}
