// Deterministic classifier that tells a concurso's main edital PDF apart from an auxiliary
// annex (quadro de vagas, gabarito, resultado, convocação, ...) using only the URL/filename
// tokens — no network, no LLM. The locate step's LLM+webSearch call cannot do this reliably:
// the most-indexed PDF of a concurso is often an annex, and its filename usually still
// contains the word "edital", so the model rationalizes picking it. We reorder and flag
// candidates on top of the model's output instead of trusting its judgment alone.
//
// Retificação is deliberately NOT an annex signal: a consolidated retificação (filename
// suffix like "_ret1", "_ret2") that republishes the edital in full is the authoritative,
// currently-valid document — exactly what a search for "the edital" should surface. Telling
// a full republication apart from a partial one (which genuinely carries no conteúdo
// programático of its own) needs to read the PDF, which is what editalVerifyPrompt does in
// the locate step's verification loop. This classifier only ever sees the URL.

import type { EditalDocumentKind, EditalDomainClass } from '@/shared/types';

export type { EditalDocumentKind, EditalDomainClass };

// Auxiliary documents that carry no conteúdo programático and are therefore useless for
// question generation. Deliberately WITHOUT a bare "anexo" pattern: the conteúdo programático
// itself is frequently published as "Anexo II — Conteúdo Programático", so "anexo" alone is not
// an annex signal — only these specific auxiliary kinds are.
const ANNEX_PATTERNS: readonly RegExp[] = [
  /\bvagas?\b/,
  /\bquadro\b/,
  /\bgabarito\b/,
  /\bresultado\b/,
  /\bconvocacao\b/,
  /\brecursos?\b/,
  /\bcronograma\b/,
  /\bisencao\b/,
  /\bhomologacao\b/,
  /\berrata\b/,
  /\bclassificacao\b/,
];

// Signals that the document is (or contains) the real edital. "edital" is intentionally weak:
// annex filenames carry it too, so an annex token co-occurring with it still wins (see scoring).
const MAIN_PATTERNS: readonly RegExp[] = [
  /\bedital\b/,
  /\babertura\b/,
  /\bconteudo\b/,
  /\bprogramatico\b/,
  /\bmaterias\b/,
];

// Strip the origin, keep the path + query (that is where the filename hints live), decode
// percent-encoding, drop accents, split letter/digit boundaries (so "Edital042026" tokenizes
// as "edital 042026" instead of one glued word that \bedital\b can't match), and collapse
// every separator to a space so token patterns with \b match uniformly across "_", "-", "%20",
// ".", etc.
function normalizeUrlForTokens(url: string): string {
  let hint = url;

  try {
    const parsed = new URL(url);
    hint = `${parsed.pathname} ${parsed.search}`;
  } catch {
    // Not a well-formed absolute URL — fall back to the raw string.
  }

  let decoded = hint;
  try {
    decoded = decodeURIComponent(hint);
  } catch {
    // Malformed escape sequence — keep the undecoded hint.
  }

  return decoded
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function countMatches(text: string, patterns: readonly RegExp[]): number {
  return patterns.reduce((sum, pattern) => (pattern.test(text) ? sum + 1 : sum), 0);
}

export function classifyEditalUrl(url: string): EditalDocumentKind {
  const text = normalizeUrlForTokens(url);
  if (!text) return 'unknown';

  const annexScore = countMatches(text, ANNEX_PATTERNS);
  const mainScore = countMatches(text, MAIN_PATTERNS);

  // Annex tokens dominate a co-occurring "edital": "Quadro Vagas_Edital ...pdf" scores
  // annex 2 / main 1 and is correctly flagged. A genuine "Edital de Abertura" that merely
  // mentions vagas scores main 2 / annex 1 and stays main.
  if (annexScore > 0 && annexScore >= mainScore) return 'annex';
  if (mainScore > 0) return 'main';
  return 'unknown';
}

// Deterministic classifier for who is serving a located edital PDF, and the reverse lookup
// used to scope the locate step's web_search to a banca's own domain first. Same rationale as
// `classifyEditalUrl` above: no network, no LLM — the locate step's own judgment regularly ranks a
// third-party aggregator mirror above the official file (search engines index mirrors just as
// well, sometimes better), so we correct that on top of its output instead of trusting it.

// Suffixes the Brazilian public sector publishes under. A host matches when it equals the
// suffix or ends with ".<suffix>" (subdomains included).
const OFFICIAL_ORG_SUFFIXES: readonly string[] = ['gov.br', 'leg.br', 'jus.br', 'mp.br', 'def.br', 'mil.br'];

// Banca organizadora domains, keyed by the short name identify.prompt.ts asks the model to
// return in "examBoard" (e.g. "CEBRASPE", "FGV"). Keys are matched case-insensitively.
const BANCA_DOMAINS: Readonly<Record<string, string>> = {
  cesgranrio: 'cesgranrio.org.br',
  cebraspe: 'cebraspe.org.br',
  fgv: 'fgv.br',
  fcc: 'fcc.org.br',
  vunesp: 'vunesp.com.br',
  ibfc: 'ibfc.org.br',
  quadrix: 'quadrix.org.br',
  idecan: 'idecan.org.br',
  consulplan: 'consulplan.net',
  iades: 'iades.com.br',
  aocp: 'institutoaocp.org.br',
  institutoaocp: 'institutoaocp.org.br',
  avancasp: 'avancasp.org.br',
};

// Third-party sites that mirror or re-host edital PDFs for their own concurso-prep content.
// A candidate served from one of these is never wrong, but it should rank behind the same
// file served from the órgão or banca's own domain — see orderByVerification in
// auto-config-job.service.ts.
const AGGREGATOR_DOMAINS: readonly string[] = [
  'qconcursos.com',
  'estrategiaconcursos.com.br',
  'direcaoconcursos.com.br',
  'tecconcursos.com.br',
  'pciconcursos.com.br',
  'folhadirigida.com.br',
  'grancursosonline.com.br',
  'atepassarconcursos.com.br',
  'jcconcursos.com.br',
  'glbimg.com',
];

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// True when `hostname` is exactly `domain` or a subdomain of it.
function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function classifyEditalDomain(url: string): EditalDomainClass {
  const hostname = hostnameOf(url);
  if (!hostname) return 'other';

  if (OFFICIAL_ORG_SUFFIXES.some((suffix) => hostMatches(hostname, suffix))) return 'official-org';
  if (Object.values(BANCA_DOMAINS).some((domain) => hostMatches(hostname, domain))) return 'official-banca';
  if (AGGREGATOR_DOMAINS.some((domain) => hostMatches(hostname, domain))) return 'aggregator';
  return 'other';
}

// Scopes the locate step's web_search filters.allowed_domains to the banca's own domain when
// it's known, so the first search round looks there before opening up to the whole web. An
// empty array means "no filter" — resolveAllowedDomains never guesses at an órgão's domain
// from the exam name; that would be too fragile (state, federal, and municipal bodies don't
// follow one pattern), and a wrong guess would silently exclude the real result instead of
// just failing to narrow the search.
export function resolveAllowedDomains(examBoard: string | null): string[] {
  if (!examBoard) return [];

  const key = examBoard.trim().toLowerCase();
  const domain = BANCA_DOMAINS[key];

  return domain ? [domain] : [];
}

// Reduces the edital key identify returns to the short "number/year" form people actually
// search for. Identify hands back the edital's full official title (e.g. "EDITAL Nº 04 -
// TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR-2026.4"); quoting that whole string as a search phrase
// matches nothing and sends the locate step to search-engine result pages instead of the PDF.

// Any run of 1-3 digits that isn't part of a longer one, so a four-digit year is never read
// as the edital's own number.
const EDITAL_NUMBER = /(?<!\d)(\d{1,3})(?!\d)/;

export function compactEditalReference(editalKey: string | null, year: number | null): string | null {
  if (!editalKey) return null;

  const match = EDITAL_NUMBER.exec(editalKey);
  if (!match) return null;

  const number = match[1];

  return year ? `${number}/${year}` : number;
}

const REFERENCE_YEAR = /\b(19|20)\d{2}\b/;
const NUMBER_SLASH_YEAR = /(\d{1,4})\s*\/\s*(?:19|20)\d{2}\b/;
const NUMBERED_EDITAL = /\bn[º°o]?\.?\s*(\d{1,4})\b/i;

// Turns the free-text "Edital" hint people type ("Edital nº 1/2026 · TRT 4ª Região") into
// the { editalKey, year } pair locateEdital works with. Never throws — anything it can't
// read out becomes null and the flow falls back to the identify match's own values.
export function parseEditalReference(raw: string): { editalKey: string | null; year: number | null } {
  const text = raw.trim();

  if (!text) return { editalKey: null, year: null };

  const yearMatch = REFERENCE_YEAR.exec(text);
  const year = yearMatch ? Number(yearMatch[0]) : null;

  const slashMatch = NUMBER_SLASH_YEAR.exec(text);
  if (slashMatch) return { editalKey: `${Number(slashMatch[1])}/${year}`, year };

  const numberedMatch = NUMBERED_EDITAL.exec(text);
  if (numberedMatch) {
    const number = Number(numberedMatch[1]);

    return { editalKey: year ? `${number}/${year}` : String(number), year };
  }

  return { editalKey: null, year };
}
