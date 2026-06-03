import { PublicExamQuestionParams } from '@/shared/types';

export function buildGeneratePublicExamQuestionsPrompt(params: PublicExamQuestionParams): string {
  const { public_exam_name, exam_board_name, subject_name, topic_name, num_questions } = params;
  const topicoLine = topic_name
    ? `focadas no tópico "${topic_name}"`
    : 'cobrindo a matéria de forma ampla';

  return `Você é um especialista em concursos públicos brasileiros e vai gerar questões de alta fidelidade.

## ETAPA 1 — PESQUISA (faça antes de gerar)

Pesquise na web por questões reais da banca "${exam_board_name}" sobre a matéria "${subject_name}"${topic_name ? `, especificamente sobre "${topic_name}",` : ''} em concursos anteriores. Use queries como:
- "${exam_board_name} questões ${subject_name}${topic_name ? ` ${topic_name}` : ''} concurso gabarito"
- "questões ${exam_board_name} ${subject_name} provas anteriores"
- site:qconcursos.com OR site:questoeseconcursos.com.br OR site:pciconcursos.com.br "${exam_board_name}" "${subject_name}"

Analise as questões encontradas para entender:
- O estilo de enunciado (tamanho, tom, vocabulário jurídico/técnico)
- As pegadinhas e distractores típicos da banca
- O nível de dificuldade habitual
- Quais dispositivos legais, artigos ou conceitos doutrinários essa banca costuma cobrar nessa matéria

## ETAPA 2 — GERAÇÃO

Com base na pesquisa acima, gere exatamente ${num_questions} questões inéditas (não copie as encontradas) para:
- **Concurso:** ${public_exam_name}
- **Banca:** ${exam_board_name}
- **Matéria:** ${subject_name}
- **Foco:** ${topicoLine}

### Regras de geração:
1. Escreva em português brasileiro formal, no estilo de prova oficial.
2. Reflita fielmente o padrão da banca pesquisada (vocabulário, pegadinhas, nível de exigência).
3. Use apenas conteúdo factualmente correto (leis, artigos, súmulas, jurisprudência vigente).
4. Não indique qual alternativa é correta — isso é feito em etapa separada.
5. Cada questão deve ser autocontida (enunciado completo, sem referências externas).

### Estilo por banca (use como guia complementar):
- **Cebraspe/CESPE:** enunciados longos com afirmações a julgar; pegadinhas sutis com "exceto", "não", "apenas", troca de termos legais. Alta taxa de questões que exigem conhecimento literal de lei.
- **FGV:** enunciados densos e conceituais; cobra interpretação fina de doutrina, jurisprudência e conflitos entre princípios.
- **FCC:** linguagem direta e objetiva; foco na literalidade do texto de lei; alternativas muito parecidas exigem atenção ao detalhe.
- **Vunesp:** enunciado moderado; combina interpretação de texto com conhecimento de lei; atenção a aspectos formais e procedimentais.
- **IBFC/Quadrix/AOCP:** linguagem mais acessível; foco em conhecimento de base; menos pegadinhas, mais cobertura de conteúdo.

### Formato de saída — JSON puro, sem texto antes ou depois:
{
  "questions": [
    {
      "id": 1,
      "text": "<enunciado completo da questão>",
      "correctCount": 1,
      "publicExamName": "${public_exam_name}",
      "examBoardName": "${exam_board_name}",
      "subject": "${subject_name}",
      ${topic_name ? `"topic": "${topic_name}",` : ''}
      "difficulty": "medium",
      "options": {
        "A": "<texto da alternativa A>",
        "B": "<texto da alternativa B>",
        "C": "<texto da alternativa C>",
        "D": "<texto da alternativa D>",
        "E": "<texto da alternativa E>"
      }
    }
  ]
}

Restrições do JSON:
- "correctCount": inteiro de 1 a 3.
- "difficulty": "easy", "medium" ou "hard".
- Todas as alternativas A–E devem ter texto não vazio.
- Nenhum campo de metadados fora do schema acima.`;
}
