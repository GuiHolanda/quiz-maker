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
