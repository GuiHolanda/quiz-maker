export type DetectedLanguage = 'pt' | 'en' | 'unknown';

const PT_DIACRITICS = /[ãõáâàéêíóôúüç]/g;

// Function words that appear in one language and essentially never as a whole word
// in the other. Ambiguous tokens ("a", "e", "o", "as") are left out on purpose.
const PT_STOPWORDS = new Set(
  `que de da do das dos para com uma não nao como qual quais são sao está esta pela pelo
   seu sua entre sobre quando porque também tambem foi pode deve aos nas nos num numa esse
   essa isso ao seguinte acordo`.split(/\s+/)
);

const EN_STOPWORDS = new Set(
  `the of and to in which that for with on by this these those from was were following when
   what how why should must will an its are is be at`.split(/\s+/)
);

// Best-effort language of a generated question, used only to catch a question the
// model wrote wholesale in the wrong language. Returns 'unknown' whenever the
// signal is weak — the caller keeps a question on 'unknown', never drops on doubt.
export function detectQuestionLanguage(text: string): DetectedLanguage {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-zà-öø-ÿ]+/g) ?? [];
  if (words.length < 6) return 'unknown';

  const diacritics = (normalized.match(PT_DIACRITICS) ?? []).length;

  let pt = 0;
  let en = 0;
  for (const word of words) {
    if (PT_STOPWORDS.has(word)) pt += 1;
    if (EN_STOPWORDS.has(word)) en += 1;
  }

  // Portuguese accents are near-conclusive against English technical prose.
  if (diacritics >= 2 && pt >= 2) return 'pt';

  if (pt + en < 4) return 'unknown';
  if (pt >= 3 && pt >= en * 3) return 'pt';
  if (en >= 4 && en >= pt * 3 && diacritics === 0) return 'en';

  return 'unknown';
}
