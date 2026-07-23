import type { PromptDefinition } from './types';

export interface PublicExamQuestionsResearchInput {
  readonly public_exam_name: string;
  readonly exam_board_name: string;
  readonly subject_name: string;
  readonly topic_name?: string;
  readonly num_questions: string;
}

export const publicExamQuestionsResearchPrompt = {
  build: (input: PublicExamQuestionsResearchInput): string => {
    const { public_exam_name, exam_board_name, subject_name, topic_name, num_questions } = input;
    const topicoLine = topic_name ? `focadas no tópico "${topic_name}"` : 'cobrindo a matéria de forma ampla';

    return `Você é um especialista em concursos públicos brasileiros e vai gerar questões de alta fidelidade.

## ETAPA 1 — PESQUISA

Pesquise na web por questões reais da banca "${exam_board_name}" sobre "${subject_name}"${topic_name ? ` (tópico: "${topic_name}")` : ''} em concursos anteriores. Use queries como:
- "${exam_board_name} questões ${subject_name}${topic_name ? ` ${topic_name}` : ''} gabarito prova"
- site:qconcursos.com OR site:questoeseconcursos.com.br "${exam_board_name}" "${subject_name}"

Analise as questões encontradas para identificar: estilo de enunciado, pegadinhas típicas, dispositivos legais frequentes e nível de dificuldade habitual da banca.

## ETAPA 2 — GERAÇÃO

Com base na pesquisa, escreva exatamente ${num_questions} questões **inéditas** (não copie as encontradas) para:
- Concurso: ${public_exam_name}
- Banca: ${exam_board_name}
- Matéria: ${subject_name}
- Foco: ${topicoLine}

Regras:
1. Português brasileiro formal, no padrão de prova oficial.
2. Reflita o estilo da banca pesquisada (vocabulário, pegadinhas, exigência).
3. Apenas conteúdo factualmente correto (leis, artigos, súmulas vigentes).
4. Não indique a resposta correta.
5. Cada questão deve ser autocontida.

Perfis de banca:
- Cebraspe/CESPE: afirmações longas; "exceto/não/apenas"; troca sutil de termos legais.
- FGV: denso; cobra conflitos doutrinários e jurisprudência.
- FCC: literal; alternativas muito parecidas; letra da lei.
- Vunesp: moderado; interpretação + aspectos formais.
- IBFC/Quadrix/AOCP: direto; cobertura ampla de conteúdo.

## FORMATO DE SAÍDA

Escreva cada questão no seguinte formato estruturado em texto simples. Não use JSON. Não adicione texto extra antes ou depois da lista.

---
QUESTÃO 1
publicExamName: ${public_exam_name}
examBoardName: ${exam_board_name}
subject: ${subject_name}${topic_name ? `\ntopic: ${topic_name}` : ''}
difficulty: <easy|medium|hard>
correctCount: <1|2|3>
text: <enunciado>
A: <texto>
B: <texto>
C: <texto>
D: <texto>
E: <texto>
---
QUESTÃO 2
...`;
  },
} satisfies PromptDefinition<PublicExamQuestionsResearchInput>;
