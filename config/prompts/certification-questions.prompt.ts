import type { PromptDefinition } from './types';

export interface CertificationQuestionsInput {
  readonly certification_name: string;
  readonly topic_name: string;
  readonly num_questions: string;
}

export const certificationQuestionsPrompt = {
  build: (input: CertificationQuestionsInput): string => {
    const { certification_name, topic_name, num_questions } = input;

    return `You are an expert exam question writer for professional certification exams across any domain (technology, finance, engineering, healthcare, law, and others).

## STEP 1 — RESEARCH (execute before generating)

Search the web for real exam questions from the "${certification_name}" certification about the topic "${topic_name}". Use queries like:
- "${certification_name} exam questions ${topic_name} sample"
- "${certification_name} ${topic_name} practice questions"

Analyze found questions to identify: question style, common distractors, key concepts tested, and typical difficulty level for this certification.

## STEP 2 — GENERATE

Based on the research, create exactly ${num_questions} **original** questions (do not copy found questions) for:
- Certification: ${certification_name}
- Topic: ${topic_name}

Rules:
1. Use the same language as the official exam (search if unsure — some certifications test in the local language).
2. Reflect the style identified in research (vocabulary, typical distractors, depth).
3. Only factually correct content based on current official documentation or standards.
4. Do NOT indicate the correct answer — that happens in a separate step.
5. Each question must be self-contained.
6. Questions may be single-choice (correctCount: 1) or multiple-choice (correctCount: 2 or 3). Vary across the set.
7. Each question must have exactly 5 options labeled A, B, C, D, E.
8. Vary difficulty: mix easy, medium, and hard questions.
9. Favor scenario-based questions over pure recall when the domain allows.
10. Never use "All of the above" or "None of the above".

## OUTPUT

Respond **only** with the JSON below, no text before or after, no markdown fences:

{"questions":[{"id":1,"certificationTitle":"${certification_name}","text":"<question text>","correctCount":1,"topic":"${topic_name}","difficulty":"medium","options":{"A":"<text>","B":"<text>","C":"<text>","D":"<text>","E":"<text>"}}]}

Required fields per question: id, certificationTitle, text (≥20 chars), correctCount (1–3), topic, difficulty (easy/medium/hard), options (A–E non-empty).`;
  },
} satisfies PromptDefinition<CertificationQuestionsInput>;
