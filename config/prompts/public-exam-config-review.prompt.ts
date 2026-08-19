import type { PromptDefinition } from './types';

export interface PublicExamConfigReviewInput {
  readonly public_exam_name: string;
  readonly role?: string | null;
  readonly exam_board_name?: string | null;
  readonly draft_blueprint: string;
}

export const publicExamConfigReviewPrompt = {
  build: (input: PublicExamConfigReviewInput): string => {
    const { public_exam_name, role, exam_board_name, draft_blueprint } = input;
    const context = [role ? `cargo: ${role}` : '', exam_board_name ? `banca: ${exam_board_name}` : '']
      .filter(Boolean)
      .join(', ');

    return `Você é um editor sênior revisando um rascunho de configuração para o concurso "${public_exam_name}"${context ? ` (${context})` : ''}.

## RASCUNHO A REVISAR

${draft_blueprint}

## CRITÉRIOS DE REVISÃO

1. **Precisão factual** — disciplinas, percentuais e metadados condizem com o edital oficial.
2. **Achatamento correto** — nenhuma SECTION representa um bloco/grupo de prova; cada disciplina individual é sua própria SECTION.
3. **Sanidade dos percentuais** — minQuestions ≤ maxQuestions em cada disciplina; a soma de todos os maxQuestions é aproximadamente 100.
4. **Nomes genéricos qualificados** — "Conhecimentos Específicos" e variantes trazem o cargo no nome.
5. **Numeração removida** — nenhum nome de disciplina ou tópico carrega prefixo de numeração do edital.
6. **Metadados corretos** — totalQuestions, examDurationMinutes e passingScore só aparecem quando o edital os publica.

## SAÍDA

Devolva o blueprint corrigido no mesmo formato de texto estruturado da entrada (blocos EXAM / SECTION separados por "---"). Aplique as correções diretamente nos blocos. Não adicione comentários fora dos blocos. Se o rascunho já estiver correto, reproduza-o sem alterações.

**Restrição crítica:** mantenha o mesmo bloco EXAM e o mesmo número de blocos SECTION da entrada — corrija o conteúdo de uma seção se necessário, mas nunca adicione ou remova seções.`;
  },
} satisfies PromptDefinition<PublicExamConfigReviewInput>;
