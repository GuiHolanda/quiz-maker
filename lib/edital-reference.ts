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
