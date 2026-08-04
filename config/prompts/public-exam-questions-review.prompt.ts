import type { PromptDefinition } from './types';

export interface PublicExamQuestionsReviewInput {
  readonly public_exam_name: string;
  readonly exam_board_name: string;
  readonly subject_name: string;
  readonly topic_name?: string;
  readonly draft_questions: string;
  readonly topics_list?: string;
}

export const publicExamQuestionsReviewPrompt = {
  build: (input: PublicExamQuestionsReviewInput): string => {
    const { public_exam_name, exam_board_name, subject_name, topic_name, draft_questions, topics_list } = input;
    const topicsContext = topics_list
      ? ` Os tópicos que devem ser cobertos são:\n${topics_list}\nVerifique se as questões estão distribuídas entre esses tópicos.`
      : '';

    return `Você é um editor sênior de questões de concurso público revisando um rascunho de questões para o concurso "${public_exam_name}", banca "${exam_board_name}", matéria "${subject_name}"${topic_name ? `, tópico "${topic_name}"` : ''}.${topicsContext}

## QUESTÕES EM RASCUNHO

${draft_questions}

## CRITÉRIOS DE REVISÃO

Para cada questão, verifique e corrija se necessário:
1. **Precisão legal/técnica** — o conteúdo reflete a legislação, súmulas e doutrina vigentes.
2. **Fidelidade ao estilo da banca** — enunciado, vocabulário e pegadinhas são coerentes com o estilo de "${exam_board_name}".
3. **Qualidade dos distratores** — alternativas erradas são plausíveis mas claramente incorretas para quem domina o conteúdo.
4. **Português formal** — gramática e redação corretas no padrão de prova oficial.
5. **Calibração de dificuldade** — o rótulo (easy/medium/hard) está adequado.
6. **Consistência de correctCount** — o número de alternativas corretas declarado é realista para a questão.
7. **Autocontida** — cada questão é respondível sem contexto externo.

## SAÍDA

Retorne a lista de questões revisadas no mesmo formato estruturado em texto simples do input. Aplique todas as correções inline. Não adicione comentários, notas ou explicações fora dos blocos de questão. Se uma questão já estiver perfeita, reproduza-a sem alterações.

**Restrição crítica:** A saída deve conter **exatamente o mesmo número de questões** que o input — nem mais, nem menos. Você pode reescrever uma questão inteiramente, mas não pode adicionar novas questões nem remover as existentes. Conte as questões do input antes de começar e verifique se a contagem da saída é igual antes de responder.`;
  },
} satisfies PromptDefinition<PublicExamQuestionsReviewInput>;
