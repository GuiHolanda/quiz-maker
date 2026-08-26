import { compactEditalReference } from '@/lib/edital-reference';

import type { PromptDefinition } from '../types';

export interface EditalLocateInput {
  readonly examName: string;
  readonly examBoard: string | null;
  readonly editalKey: string | null;
  readonly year: number | null;
  readonly role: string;
  readonly language: 'pt' | 'en';
  // URLs the verification loop already downloaded and rejected (confirmed-not-main-edital or
  // unreadable) in a prior round — see locateEdital() in auto-config-job.service.ts. Empty on
  // the first round.
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

    const compactRef = compactEditalReference(editalKey, year);

    const hints = [
      examBoard ? `Banca organizadora: ${examBoard}.` : '',
      editalKey
        ? `Número do edital: ${compactRef ?? editalKey} — é assim que ele aparece nas buscas. Título oficial completo, para conferir que o documento é o certo: "${editalKey}".`
        : '',
      year ? `Ano alvo: ${year}.` : '',
      role ? `Cargo pretendido: ${role}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const primaryQuery = compactRef
      ? `${examName} edital ${compactRef} pdf`
      : `${examName} edital${examBoard ? ` ${examBoard}` : ''} pdf`;

    return `Você é um assistente especializado em localizar editais oficiais de concursos públicos brasileiros.

TAREFA: Encontre o link direto para o arquivo PDF do edital oficial do concurso "${examName}". ${hints}

ESTRATÉGIA DE BUSCA — siga nesta ordem, e não pare no primeiro passo que falhar:
1. Busque pelo número do edital combinado com o nome do concurso: ${primaryQuery}. Nunca use o título oficial completo do edital como frase de busca entre aspas — ele é longo demais e não casa com nada.
2. O PDF do edital muitas vezes NÃO aparece direto nos resultados de busca, mas as páginas de notícias e os sites de concursos que noticiam o certame trazem o link para baixá-lo. ABRA essas páginas e leia o HTML delas procurando âncoras (<a href>) que apontem para o arquivo do edital, e extraia dali a URL do PDF. Isso é obrigatório sempre que a busca direta não devolver um PDF.
3. Abra também a página do próprio órgão e a da banca sobre o certame e procure nelas o link do edital. Em muitos portais o link não termina em ".pdf" — é um handler de download (ex.: "fileDownload.jsp?fileId=...", "/media/.../arquivo"). Esses links são válidos e devem ser devolvidos como estão.
4. Se ainda assim não achar o edital do ano alvo, procure editais de anos anteriores do mesmo concurso.${excludeUrls.length > 0 ? `\n\nAs URLs abaixo já foram baixadas e verificadas: NÃO contêm o conteúdo programático das provas (são anexos auxiliares como quadro de vagas, gabarito, resultado, convocação, cronograma) ou não puderam ser lidas. NÃO as devolva novamente — procure outro documento.\nURLs já descartadas:\n${excludeUrls.map((u) => `- ${u}`).join('\n')}` : ''}

REGRAS:
1. A "url" devolvida DEVE ser o arquivo do edital em si. NUNCA devolva uma página HTML — nem uma notícia, nem uma landing page, nem um portal de inscrição, nem um ".htm"/".html". Essas páginas servem para você encontrar o link do arquivo, não para serem a resposta. Se você não encontrou o arquivo, devolva "editais": [] em vez de inventar.
2. Prefira o domínio oficial: o site do próprio órgão ou o da banca organizadora (ex: cebraspe.org.br, cesgranrio.org.br, fgv.br, vunesp.com.br, fcc.org.br). Mas um PDF hospedado por terceiros (site de concursos, cursinho, portal de notícias, Diário Oficial) é ACEITÁVEL e deve ser devolvido quando for o mesmo documento — marque-o com "isOfficialDomain": false. Encontrar o documento certo importa mais do que encontrá-lo no domínio oficial.
3. O documento procurado é o edital principal — aquele que contém, ele mesmo ou em anexo publicado como arquivo separado, o conteúdo programático das provas (disciplinas e tópicos cobrados). NÃO devolva PDFs que sejam somente: quadro de vagas, quadro de cargos, resultado final, gabarito, convocação para prova, cronograma ou formulário de isenção. Uma retificação ou republicação do edital (frequentemente com sufixo "_ret1", "_ret2") que republica o edital por inteiro É o edital vigente e deve ser preferida sobre a versão original — não descarte um documento só porque o nome do arquivo sugere retificação.
4. Se encontrar o edital do ano alvo, marque "targetYearFound": true e inclua-o em "editais" com "year" igual ao ano alvo.
5. Se NÃO encontrar o edital do ano alvo, marque "targetYearFound": false e inclua até 5 editais de anos anteriores do mesmo concurso (mesmo órgão, mesmo cargo ou equivalente) que sirvam de modelo de conteúdo programático, do mais recente para o mais antigo.
6. ${role ? `"coversRole" é true somente quando você tem razão para crer que o edital cobre o cargo "${role}" especificamente (não apenas o concurso em geral).` : '"coversRole" deve ser false para todos os itens (nenhum cargo foi especificado).'}
7. "isOfficialDomain" é true quando a URL pertence ao domínio do órgão ou da banca; false para qualquer outra fonte.
8. Nunca invente uma URL. Só devolva uma URL que você viu na busca ou dentro do HTML de uma página que abriu.
9. ${languageInstruction}

OUTPUT FORMAT — responda APENAS com JSON válido, sem texto antes ou depois:
{"editais":[{"url":"https://...pdf","editalNumber":"001/2025","year":2025,"orgao":"...","isOfficialDomain":true,"coversRole":true}],"targetYearFound":true}

Máximo 5 itens em "editais", ordenados por relevância: primeiro o edital do ano alvo${role ? ' que cobre o cargo' : ''}, depois o do ano alvo sem confirmação de cargo, depois os anos anteriores em ordem decrescente.`;
  },
} satisfies PromptDefinition<EditalLocateInput>;
