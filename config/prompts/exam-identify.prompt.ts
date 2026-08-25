import type { PromptDefinition } from './types';
import type { ExamType } from '@/shared/types';

export interface ExamIdentifyInput {
  readonly query: string;
  readonly type: ExamType;
  readonly language: 'pt' | 'en';
}

// Single identify prompt shared by both exam types — the task is the same ("find the real
// exam the user means"), only the domain vocabulary differs (certifying body vs órgão/banca/
// cargo). Kept separate from the research/review/format chain: this is a short, cheap call
// whose result is a user decision (pick a match), not something that should block on the
// expensive multi-step blueprint pipeline.
export const examIdentifyPrompt = {
  build: (input: ExamIdentifyInput): string => {
    const { query, type, language } = input;

    const languageInstruction =
      language === 'pt'
        ? 'Responda em português do Brasil (pt-BR): os campos "label", "provider", "examBoard", "roles" e "clarification" devem estar em pt-BR.'
        : 'Respond in English: the "label", "provider", "examBoard", "roles", and "clarification" fields must be in English.';

    const domainInstructions =
      type === 'certification'
        ? `Search the web for real professional certifications (any domain: technology, finance, engineering, healthcare, law, and others) matching the query "${query}".
- "label" is the full official certification name.
- "provider" is the certifying body's short, recognizable name (e.g. "AWS", not "Amazon Web Services, Inc.").
- "key" is the official exam code when one exists (e.g. "SAA-C03") — omit it otherwise.
- Leave "examBoard", "role", and "roles" out of every match.`
        : `Search the web for a real Brazilian concurso público (órgão + cargo + banca organizadora) matching the query "${query}".
- "label" is a human name for the concurso: órgão + ano, without the cargo (e.g. "Concurso Público TRF 1ª Região 2025").
- "examBoard" is the banca organizadora's short name (e.g. "CEBRASPE", "FGV", "FCC", "VUNESP").
- "roles" is the array of cargos published in this edital, most relevant first, maximum 12. Use the exact names as published (e.g. "Analista Judiciário – Área Judiciária"). Empty array when the cargos cannot be determined.
- "role" is set only when the query explicitly names a cargo; it must be one of the items in "roles".
- "key" is the edital number when publicly known — omit it otherwise.
- Leave "provider" out of every match.`;

    return `You are an exam-identification assistant for CertifiqueAI, a platform for professional certification and Brazilian concurso público practice exams.

TASK: Given the user's query, identify the real, existing exam(s) they mean.

${domainInstructions}

RULES:
1. Return at most 5 matches, most likely first.
2. If exactly one exam clearly matches, return it alone in "matches".
3. If multiple distinct exams could match (e.g. "Azure" could mean several certifications), return all of them so the user can choose.
4. If you cannot find any real exam matching the query, return an empty "matches" array and set "clarification" to a short question asking for the missing detail (e.g. the certifying body, or the órgão/cargo/banca).
5. Never invent an exam that does not exist. Only real, verifiable exams.
6. ${languageInstruction}

OUTPUT FORMAT — respond ONLY with valid JSON, no text before or after:
{"matches":[{"label":"...","key":"...","provider":"...","examBoard":"...","roles":["...","..."],"role":"...","year":2024}],"clarification":null}

Omit any match field other than "label" when it does not apply. When "matches" is empty, "clarification" must be a non-empty string; when "matches" is non-empty, set "clarification" to null.`;
  },
} satisfies PromptDefinition<ExamIdentifyInput>;
