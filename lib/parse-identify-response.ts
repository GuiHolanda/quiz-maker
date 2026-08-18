export interface CertificationMatch {
  readonly label: string;
  readonly provider: string;
}

export type IdentifyResponseResult =
  | { readonly kind: 'multiple'; readonly matches: CertificationMatch[] }
  | { readonly kind: 'single'; readonly match: CertificationMatch }
  | { readonly kind: 'none'; readonly message: string };

// AI_CHAT_IDENTIFY_PROMPT (config/prompts/ai-chat-identify.prompt.ts) always answers in one
// of these shapes: a numbered list to disambiguate, a single "**Name** — Body" confirmation,
// or free-text (a clarifying question, or "not found"). There's no structured-output mode
// for this turn — chat readers tolerate prose, so this parser must too, falling back to the
// raw text rather than guessing when the shape doesn't match either pattern.
export function parseIdentifyResponse(text: string): IdentifyResponseResult {
  const listItemPattern = /^\s*\d+\.\s*\*\*(.+?)\*\*\s*(?:—|-)\s*(.+?)\s*$/gm;
  const listMatches: CertificationMatch[] = [];
  let item: RegExpExecArray | null;

  while ((item = listItemPattern.exec(text)) !== null) {
    listMatches.push({ label: item[1].trim(), provider: item[2].trim() });
  }
  if (listMatches.length >= 2) return { kind: 'multiple', matches: listMatches };

  const singlePattern = /\*\*(.+?)\*\*\s*(?:—|-)\s*([^.\n]+)/;
  const single = singlePattern.exec(text);

  if (single) return { kind: 'single', match: { label: single[1].trim(), provider: single[2].trim() } };

  return { kind: 'none', message: text.trim() };
}
