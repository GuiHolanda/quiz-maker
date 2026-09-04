import type { PromptDefinition } from '../types';

export interface CertificationIdentifyInput {
  readonly query: string;
  readonly language: 'pt' | 'en';
  readonly provider?: string;
  readonly key?: string;
}

export const certificationIdentifyPrompt = {
  build: (input: CertificationIdentifyInput): string => {
    const { query, language, provider, key } = input;

    const languageInstruction =
      language === 'pt'
        ? 'Responda em português do Brasil (pt-BR): os campos "label", "provider" e "clarification" devem estar em pt-BR.'
        : 'Respond in English: the "label", "provider", and "clarification" fields must be in English.';

    const hintLines = [
      provider?.trim() ? `- Certifying body: ${provider.trim()}` : '',
      key?.trim() ? `- Exam code: ${key.trim()}` : '',
    ].filter(Boolean);

    const hintsBlock =
      hintLines.length > 0
        ? `\n\nUSER-PROVIDED HINTS (partial or informal — a strong signal for disambiguation, but a real verifiable certification always wins over a contradicting hint):\n${hintLines.join('\n')}\n`
        : '';

    return `You are an exam-identification assistant for CertifiqueAI, a platform for professional certification practice exams.

TASK: Given the user's query, identify the real, existing professional certification(s) they mean.

Search the web for real professional certifications (any domain: technology, finance, engineering, healthcare, law, and others) matching the query "${query}".${hintsBlock}
- "label" is the full official certification name.
- "provider" is the certifying body's short, recognizable name (e.g. "AWS", not "Amazon Web Services, Inc.").
- "key" is the official exam code when one exists (e.g. "SAA-C03") — omit it otherwise.
- Leave "examBoard", "role", and "roles" out of every match.

RULES:
1. Return at most 5 matches, most likely first.
2. If exactly one exam clearly matches, return it alone in "matches".
3. If multiple distinct exams could match (e.g. "Azure" could mean several certifications), return all of them so the user can choose.
4. If you cannot find any real exam matching the query, return an empty "matches" array and set "clarification" to a short question asking for the missing detail (e.g. the certifying body or specialization).
5. Never invent an exam that does not exist. Only real, verifiable certifications.
6. ${languageInstruction}

OUTPUT FORMAT — respond ONLY with valid JSON, no text before or after:
{"matches":[{"label":"...","key":"...","provider":"..."}],"clarification":null}

Omit any match field other than "label" when it does not apply. When "matches" is empty, "clarification" must be a non-empty string; when "matches" is non-empty, set "clarification" to null.`;
  },
} satisfies PromptDefinition<CertificationIdentifyInput>;
