// Deterministic classifier for who is serving a located edital PDF, and the reverse lookup
// used to scope the locate step's web_search to a banca's own domain first. Same rationale as
// edital-classifier.ts: no network, no LLM — the locate step's own judgment regularly ranks a
// third-party aggregator mirror above the official file (search engines index mirrors just as
// well, sometimes better), so we correct that on top of its output instead of trusting it.

import type { EditalDomainClass } from '@/shared/types';

export type { EditalDomainClass };

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
