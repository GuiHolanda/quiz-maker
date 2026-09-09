export function parseNumber(value: string | null, fallback: number | null = null) {
  if (value === null) return fallback;
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
}

export function toSafeString(v: unknown) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  const json = JSON.stringify(v);

  return json || Object.prototype.toString.call(v);
}
