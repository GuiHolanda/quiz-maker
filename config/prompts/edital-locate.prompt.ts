import type { PromptDefinition } from './types';

export interface EditalLocateInput {
  readonly examName: string;
  readonly examBoard: string | null;
  readonly editalKey: string | null;
  readonly year: number | null;
  readonly role: string;
  readonly language: 'pt' | 'en';
}

// Pre-job, cheap lookup — same rationale as exam-identify.prompt.ts: its result can become a
// user decision (pick a prior-year edital as a stand-in), so it stays outside the persisted
// AutoConfigJob pipeline. One call returns both the target-year PDF (if found) and fallback
// candidates from prior years, so offering the user a choice never costs a second LLM call.
export const editalLocatePrompt = {
  build: (input: EditalLocateInput): string => {
    const { examName, examBoard, editalKey, year, role, language } = input;

    const languageInstruction =
      language === 'pt'
        ? 'Responda em português do Brasil (pt-BR): o campo "orgao" deve estar em pt-BR.'
        : 'Respond in English: the "orgao" field must be in English.';

    const hints = [
      examBoard ? `Banca organizadora: ${examBoard}.` : '',
      editalKey ? `Número do edital: ${editalKey}.` : '',
      year ? `Ano alvo: ${year}.` : '',
      role ? `Cargo pretendido: ${role}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `Você é um assistente especializado em localizar editais oficiais de concursos públicos brasileiros.

TAREFA: Encontre o link direto para o arquivo PDF do edital oficial do concurso "${examName}". ${hints}

REGRAS DE BUSCA:
1. Priorize domínios oficiais: o site do próprio órgão (gov.br ou domínio institucional) ou da banca organizadora (ex: cebraspe.org.br, fgv.br, vunesp.com.br, fcc.com.br). NUNCA prefira agregadores de terceiros (cursinhos, portais de notícias sobre concursos) quando um link oficial existir.
2. O link deve apontar diretamente para o arquivo PDF do edital (ou de seu anexo de conteúdo programático), não para uma página de listagem ou notícia sobre o concurso.
3. Primeiro, procure o edital do ano alvo informado acima. Se encontrar, marque "targetYearFound": true e inclua-o em "editais" com "year" igual ao ano alvo.
4. Se NÃO encontrar o edital do ano alvo, procure editais de anos anteriores do mesmo concurso (mesmo órgão, mesmo cargo ou cargo equivalente) que possam servir de modelo de conteúdo programático. Marque "targetYearFound": false e inclua até 5 desses editais anteriores em "editais", do mais recente para o mais antigo.
5. "coversRole" é true somente quando você tem razão para crer que o edital cobre o cargo "${role}" especificamente (não apenas o concurso em geral).
6. "isOfficialDomain" é true quando a URL pertence ao domínio do órgão ou da banca; false para agregadores.
7. Nunca invente uma URL. Só inclua um edital cuja existência você verificou na busca.
8. Se não encontrar NENHUM edital (nem do ano alvo, nem de anos anteriores), devolva "editais": [] e "targetYearFound": false.
9. ${languageInstruction}

OUTPUT FORMAT — responda APENAS com JSON válido, sem texto antes ou depois:
{"editais":[{"url":"https://...pdf","editalNumber":"001/2025","year":2025,"orgao":"...","isOfficialDomain":true,"coversRole":true}],"targetYearFound":true}

Máximo 5 itens em "editais", ordenados por relevância: primeiro o edital do ano alvo que cobre o cargo, depois o do ano alvo sem confirmação de cargo, depois os anos anteriores em ordem decrescente.`;
  },
} satisfies PromptDefinition<EditalLocateInput>;
