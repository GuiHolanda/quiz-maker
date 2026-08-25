import type { PromptDefinition } from '../types';

export interface EditalLocateInput {
  readonly examName: string;
  readonly examBoard: string | null;
  readonly editalKey: string | null;
  readonly year: number | null;
  readonly role: string;
  readonly language: 'pt' | 'en';
  // URLs the verification loop already downloaded and rejected (annex or unreadable) in a
  // prior round — see locateEdital() in auto-config-job.service.ts. Empty on the first round.
  readonly excludeUrls: readonly string[];
}

// Pre-job, cheap lookup — same rationale as identify.prompt.ts: its result can become a
// user decision (pick a prior-year edital as a stand-in), so it stays outside the persisted
// AutoConfigJob pipeline. One call returns both the target-year PDF (if found) and fallback
// candidates from prior years, so offering the user a choice never costs a second LLM call.
export const editalLocatePrompt = {
  build: (input: EditalLocateInput): string => {
    const { examName, examBoard, editalKey, year, role, language, excludeUrls } = input;

    const languageInstruction =
      language === 'pt'
        ? 'Responda em português do Brasil (pt-BR): o campo "orgao" deve estar em pt-BR.'
        : 'Respond in English: the "orgao" field must be in English.';

    const hints = [
      examBoard ? `Banca organizadora: ${examBoard}.` : '',
      editalKey
        ? `Número do edital: ${editalKey} — use este número como sinal de busca mais forte e priorize o documento exato que o corresponde.`
        : '',
      year ? `Ano alvo: ${year}.` : '',
      role ? `Cargo pretendido: ${role}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const excludeInstruction =
      excludeUrls.length > 0
        ? `\n\nAs URLs abaixo já foram baixadas e verificadas: são anexos auxiliares (quadro de vagas, gabarito, resultado, convocação, cronograma etc.) ou não puderam ser lidas. NÃO as devolva novamente — procure o EDITAL DE ABERTURA COMPLETO, o documento que efetivamente contém o conteúdo programático das provas, incluindo o anexo de conteúdo programático quando publicado como arquivo separado.\nURLs já descartadas:\n${excludeUrls.map((u) => `- ${u}`).join('\n')}`
        : '';

    return `Você é um assistente especializado em localizar editais oficiais de concursos públicos brasileiros.

TAREFA: Encontre o link direto para o arquivo PDF do edital oficial do concurso "${examName}". ${hints}${excludeInstruction}

REGRAS DE BUSCA:
1. Priorize domínios oficiais: o site do próprio órgão (gov.br ou domínio institucional) ou da banca organizadora (ex: cebraspe.org.br, fgv.br, vunesp.com.br, fcc.com.br). Somente se nenhum PDF oficial for encontrado, um link de fonte confiável (ex: Diário Oficial, repositório oficial) é aceitável — marque esses com "isOfficialDomain": false.
2. O link deve levar diretamente ao arquivo PDF do edital principal (corpo do edital ou seu anexo de conteúdo programático/matérias). NÃO use PDFs que sejam somente: quadro de vagas, quadro de cargos, resultado final, gabarito, convocação para prova, recurso ou qualquer outro anexo que não contenha o conteúdo programático das provas — esses documentos não têm valor para geração de questões. Se o nome do arquivo na URL contiver palavras como "vagas", "quadro", "gabarito", "resultado", "convocacao", "ret" isoladas, trate o documento como auxiliar e busque o edital principal completo. URLs com query-string ou handlers do próprio domínio oficial são aceitos — não é obrigatório que o caminho termine em ".pdf", desde que a resposta seja o próprio arquivo PDF do edital.
3. Primeiro, procure o edital do ano alvo informado acima. Se encontrar, marque "targetYearFound": true e inclua-o em "editais" com "year" igual ao ano alvo.
4. Se NÃO encontrar o edital do ano alvo, procure editais de anos anteriores do mesmo concurso (mesmo órgão, mesmo cargo ou cargo equivalente) que possam servir de modelo de conteúdo programático. Marque "targetYearFound": false e inclua até 5 desses editais anteriores em "editais", do mais recente para o mais antigo.
5. ${role ? `"coversRole" é true somente quando você tem razão para crer que o edital cobre o cargo "${role}" especificamente (não apenas o concurso em geral).` : '"coversRole" deve ser false para todos os itens (nenhum cargo foi especificado).'}
6. "isOfficialDomain" é true quando a URL pertence ao domínio do órgão ou da banca; false para qualquer outra fonte.
7. Nunca invente uma URL. Só inclua um edital cuja existência você verificou na busca.
8. Se não encontrar NENHUM edital (nem do ano alvo, nem de anos anteriores), devolva "editais": [] e "targetYearFound": false.
9. ${languageInstruction}

OUTPUT FORMAT — responda APENAS com JSON válido, sem texto antes ou depois:
{"editais":[{"url":"https://...pdf","editalNumber":"001/2025","year":2025,"orgao":"...","isOfficialDomain":true,"coversRole":true}],"targetYearFound":true}

Máximo 5 itens em "editais", ordenados por relevância: primeiro o edital do ano alvo${role ? ' que cobre o cargo' : ''}, depois o do ano alvo sem confirmação de cargo, depois os anos anteriores em ordem decrescente.`;
  },
} satisfies PromptDefinition<EditalLocateInput>;
