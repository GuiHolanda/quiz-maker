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
