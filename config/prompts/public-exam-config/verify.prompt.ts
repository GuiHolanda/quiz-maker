import type { PromptDefinition } from '../types';

export interface EditalVerifyInput {
  readonly examName: string;
  readonly role: string;
}

// Runs inside locateEdital's verification loop, one call per downloaded PDF candidate — the
// same input_file shape editalExtractPrompt uses, but asking a much narrower question than
// full extraction: is this document the edital itself, or an auxiliary annex? The locate
// step's LLM+webSearch call already tried to answer this from search-result snippets alone
// and gets it wrong often enough to cause the bug this exists to fix — actually opening the
// PDF is the only reliable signal. It also asks for the edital's own year/number as stated
// inside the document: the locate step's guess for these (from search-result metadata) is
// frequently wrong — e.g. tagging a years-old edital still indexed by search engines with the
// year of the concurso being searched — and locateEdital uses this reading to correct it before
// deciding whether the target year was actually found.
export const editalVerifyPrompt = {
  build: (input: EditalVerifyInput): string => {
    const { examName, role } = input;
    const roleHint = role ? ` para o cargo "${role}"` : '';

    return `Você é um especialista em editais de concursos públicos brasileiros. Este PDF foi encontrado numa busca pelo edital do concurso "${examName}"${roleHint}.

TAREFA 1: Determine se este PDF é o EDITAL PRINCIPAL (ou seu anexo de conteúdo programático) — ou seja, se ele contém o conteúdo programático das provas: as disciplinas/matérias e os tópicos/assuntos que serão cobrados.

NÃO é o edital principal — mesmo que o nome do arquivo ou o cabeçalho contenha a palavra "Edital" — quando o documento é apenas:
- Quadro de vagas, quadro de cargos ou tabela de remuneração (lista cargos/vagas/salários, sem conteúdo programático)
- Gabarito (preliminar ou definitivo)
- Resultado, classificação ou homologação
- Convocação para prova, perícia ou posse
- Retificação/errata que não republica o conteúdo programático inteiro
- Cronograma do certame
- Formulário de isenção de taxa

É o edital principal quando o documento traz, ele mesmo, a lista de disciplinas e tópicos cobrados nas provas — seja no corpo do edital de abertura, seja num anexo específico de "Conteúdo Programático" publicado como arquivo separado.

TAREFA 2 (somente se for o edital principal): Extraia o ANO e o NÚMERO do próprio edital, exatamente como declarados no documento (normalmente na capa ou no preâmbulo — ex.: "Edital nº 004/2026", "Edital de Abertura nº 1 - PSP TERRA/2026"). Não confunda com o ano do cargo/carreira ou com datas de provas/inscrições citadas no meio do texto — é o ano/número que identifica o edital em si. Se o documento não declarar isso claramente, responda null.

Abra e leia o PDF antes de responder. Não infira pelo nome do arquivo nem pelo nome do concurso buscado — reporte o que está escrito no documento, mesmo que ele acabe sendo de um ano diferente do buscado.

Responda APENAS com JSON válido, sem texto antes ou depois:
{"isMainEdital":true,"hasConteudoProgramatico":true,"documentType":"edital","subjectCount":8,"year":2026,"editalNumber":"004/2026"}

"documentType" — classifique o documento como um destes valores: "edital" (contém conteúdo programático), "quadro_vagas", "gabarito", "resultado", "convocacao", "retificacao", "cronograma", "outro".
"subjectCount" — número aproximado de disciplinas/matérias distintas identificadas no conteúdo programático (0 se não houver).
"year" — ano do edital (número) declarado no documento, ou null se não identificado ou se não for o edital principal.
"editalNumber" — número do edital (string, como aparece no documento, ex. "004/2026") declarado no documento, ou null se não identificado ou se não for o edital principal.
"isMainEdital" deve ser true somente quando "hasConteudoProgramatico" também é true.`;
  },
} satisfies PromptDefinition<EditalVerifyInput>;
