import { PublicExamQuestionParams } from '@/shared/types';

export function buildGeneratePublicExamQuestionsPrompt(params: PublicExamQuestionParams): string {
  const { public_exam_name, exam_board_name, subject_name, topic_name, num_questions } = params;
  const topicoLine = topic_name
    ? `, focadas no tópico "${topic_name}"`
    : ', cobrindo a matéria de forma ampla';

  return `Você é um gerador de questões para concursos públicos brasileiros do AIQuiz.

OBJETIVO: Gere exatamente ${num_questions} questões de múltipla escolha para o concurso "${public_exam_name}", da banca "${exam_board_name}", da matéria "${subject_name}"${topicoLine}.

REGRAS GERAIS:
1. Todas as questões DEVEM ser escritas em português brasileiro formal, no estilo de provas oficiais.
2. Alinhe o estilo, vocabulário, nível de formalidade e dificuldade ao padrão da banca informada (Cebraspe/CESPE, FGV, FCC, Vunesp, IBFC, Quadrix, AOCP, IDIB, Instituto Acesso, etc.).
3. Use o vocabulário técnico/jurídico apropriado à matéria (Direito Constitucional, Português, Raciocínio Lógico, Direito Administrativo, Informática, etc.).
4. NUNCA invente concursos, leis, súmulas, jurisprudências ou dispositivos. Use apenas conteúdo factualmente correto.
5. NÃO marque a resposta correta nesta etapa — apenas formule a questão e as alternativas.

FORMATO DE CADA QUESTÃO:
- Exatamente 5 alternativas: A, B, C, D, E. Nenhuma pode estar vazia.
- "text": enunciado com no mínimo 20 caracteres, autocontido.
- "correctCount": inteiro de 1 a 3, indicando quantas alternativas estarão corretas na etapa de gabarito.
- "difficulty": "easy", "medium" ou "hard".
- "publicExamName": "${public_exam_name}"
- "examBoardName": "${exam_board_name}"
- "subject": "${subject_name}"
- "topic": ${topic_name ? `"${topic_name}"` : 'omitir este campo ou null'}

ESTILO POR BANCA (orientativo):
- Cebraspe/CESPE: enunciados longos; pegadinhas em "exceto", "não" ou trocas sutis de termos legais.
- FGV: denso e conceitual; cobra interpretação fina de doutrina e jurisprudência.
- FCC: linguagem direta; foco em letra de lei e literalidade.
- Vunesp: enunciado moderado; atenção a interpretação de texto e detalhes formais.
- IBFC/Quadrix/AOCP: linguagem clara; foco em conhecimento de base.

SAÍDA: responda APENAS com JSON válido no seguinte formato:
{
  "questions": [
    {
      "id": 1,
      "text": "...",
      "correctCount": 1,
      "publicExamName": "${public_exam_name}",
      "examBoardName": "${exam_board_name}",
      "subject": "${subject_name}",
      "difficulty": "medium",
      "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." }
    }
  ]
}`;
}
