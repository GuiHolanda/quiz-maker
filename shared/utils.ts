export function parseNumber(value: string | null, fallback: number | null = null) {
  if (value === null) return fallback;
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
}

export function safeJsonParse<T = unknown>(s: string): { ok: boolean; error: string | null; value: T | null } {
  try {
    return { ok: true, error: null, value: JSON.parse(s) as T };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err), value: null };
  }
}

export function toSafeString(v: unknown) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  // Prefer JSON when possible
  const json = JSON.stringify(v);

  return json || Object.prototype.toString.call(v);
}

/**
 * Normalize a free-form name (subject, topic, exam name) to a canonical form
 * for byte-exact equality storage and comparison.
 *
 * - NFC: collapses combining-mark sequences (e.g. "à" as U+00E0 vs "a" + U+0300)
 * - trim: strips leading/trailing whitespace
 * - collapse internal whitespace (incl. NBSP U+00A0) to single spaces
 *
 * Apply on every write boundary (DB row create/update) and as defense-in-depth
 * before string equality reads. This is the only level of normalization the
 * platform performs — never lowercase or strip accents (those carry meaning).
 */
export function normalizeName(s: string): string {
  return s.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/**
 * Loose key for case-insensitive comparison when reconciling drift between two
 * already-normalized strings. Use ONLY for diagnostics/recovery — never persist.
 */
export function looseKey(s: string): string {
  return normalizeName(s).toLowerCase();
}
