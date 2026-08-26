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

import type { EditalDocumentKind } from '@/shared/types';

export type { EditalDocumentKind };

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
