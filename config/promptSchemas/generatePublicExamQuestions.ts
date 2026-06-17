import { PublicExamQuestionParams } from '@/shared/types';

export function buildGeneratePublicExamQuestionsPrompt(params: PublicExamQuestionParams): string {
  const { public_exam_name, exam_board_name, subject_name, topic_name, num_questions } = params;
  const topicoLine = topic_name ? `focadas no tópico "${topic_name}"` : 'cobrindo a matéria de forma ampla';

  return `Você é um especialista em concursos públicos brasileiros e vai gerar questões de alta fidelidade.

## ETAPA 1 — PESQUISA (execute antes de gerar)

Pesquise na web por questões reais da banca "${exam_board_name}" sobre "${subject_name}"${topic_name ? ` (tópico: "${topic_name}")` : ''} em concursos anteriores. Use queries como:
- "${exam_board_name} questões ${subject_name}${topic_name ? ` ${topic_name}` : ''} gabarito prova"
- site:qconcursos.com OR site:questoeseconcursos.com.br "${exam_board_name}" "${subject_name}"

Analise as questões encontradas para identificar: estilo de enunciado, pegadinhas típicas, dispositivos legais frequentes e nível de dificuldade habitual da banca.

## ETAPA 2 — GERAÇÃO

Com base na pesquisa, crie exatamente ${num_questions} questões **inéditas** (não copie as encontradas) para:
- Concurso: ${public_exam_name}
- Banca: ${exam_board_name}
- Matéria: ${subject_name}
- Foco: ${topicoLine}

Regras:
1. Português brasileiro formal, no padrão de prova oficial.
2. Reflita o estilo da banca pesquisada (vocabulário, pegadinhas, exigência).
3. Apenas conteúdo factualmente correto (leis, artigos, súmulas vigentes).
4. Não indique a resposta correta — isso ocorre em etapa separada.
5. Cada questão deve ser autocontida.

Perfis de banca:
- Cebraspe/CESPE: afirmações longas; "exceto/não/apenas"; troca sutil de termos legais.
- FGV: denso; cobra conflitos doutrinários e jurisprudência.
- FCC: literal; alternativas muito parecidas; letra da lei.
- Vunesp: moderado; interpretação + aspectos formais.
- IBFC/Quadrix/AOCP: direto; cobertura ampla de conteúdo.

## SAÍDA

Responda **apenas** com o JSON abaixo, sem nenhum texto antes ou depois, sem markdown fences:

{"questions":[{"id":1,"text":"<enunciado>","correctCount":1,"publicExamName":"${public_exam_name}","examBoardName":"${exam_board_name}","subject":"${subject_name}",${topic_name ? `"topic":"${topic_name}",` : ''}"difficulty":"medium","options":{"A":"<texto>","B":"<texto>","C":"<texto>","D":"<texto>","E":"<texto>"}}]}

Campos obrigatórios por questão: id, text (≥20 chars), correctCount (1–3), publicExamName, examBoardName, subject, difficulty (easy/medium/hard), options (A–E não vazias).`;
}
