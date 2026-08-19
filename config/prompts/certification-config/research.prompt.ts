import type { PromptDefinition } from '../types';

export interface CertificationConfigResearchInput {
  readonly certification_name: string;
  readonly provider?: string | null;
  readonly key?: string | null;
  readonly language: 'pt' | 'en';
}

export const certificationConfigResearchPrompt = {
  build: (input: CertificationConfigResearchInput): string => {
    const { certification_name, provider, key, language } = input;
    const knownHint = [provider ? `Certifying body: ${provider}.` : '', key ? `Exam code: ${key}.` : '']
      .filter(Boolean)
      .join(' ');

    return `You are an expert on professional certification exams across any domain (technology, finance, engineering, healthcare, law, and others).

## TASK

Search the web for the official exam guide or blueprint published by the certifying body for "${certification_name}". ${knownHint}

Look specifically for:
- The official list of exam domains/topics and their weight (percentage of the exam).
- Sub-areas or task statements the guide breaks each domain into.
- totalQuestions, examDurationMinutes, passingScore, and the exam's current/most recently updated version year.

## OUTPUT

Write your findings as a structured plain-text block. Do not use JSON. Do not add commentary before or after.

EXAM
name: <full official certification name>
key: <official exam code, or "-" if none>
provider: <certifying body short name>
year: <version year, or "-">
totalQuestions: <integer, or "-">
examDurationMinutes: <integer, or "-">
passingScore: <percentage 0-100, or "-" if the exam uses a scaled score instead>
context: <1-2 sentences on what the certification validates and who offers it>
sources: <up to 2 sources as "[Title](url)", separated by " | ", or "-" if none found>
---
SECTION
name: <domain/topic name>
minQuestions: <integer 0-100, lower bound of the domain's percentage weight>
maxQuestions: <integer 0-100, upper bound>
subtopics: <sub-areas separated by "; ", or omit this line if the guide lists none>
---
SECTION
...

## RULES

- Use ONLY information from official provider pages. Never invent domains, weights, or metadata.
- minQuestions must be less than or equal to maxQuestions for each section.
- The sum of all maxQuestions should be approximately 100 when the exam uses mutually exclusive domain allocations. For certifications that publish independent per-domain ranges (e.g. CFA), preserve the official ranges even if they sum above 100.
- Use the official exam code as plain text, with no surrounding parentheses (e.g. "SAA-C03", not "(SAA-C03)").
- passingScore: only report it when the source publishes a percentage of correct answers. Many certifications (e.g. AWS, PMI) publish a scaled score instead (such as 700 on a 100-1000 scale) — that is NOT a percentage; write "-" rather than reporting the scaled number.
- If you cannot find an official source at all, write your best-effort structure based on general knowledge of the certification, and say so in context.
- ${language === 'pt' ? 'Write every text field (name, context) in Brazilian Portuguese.' : 'Write every text field in English.'}`;
  },
} satisfies PromptDefinition<CertificationConfigResearchInput>;
