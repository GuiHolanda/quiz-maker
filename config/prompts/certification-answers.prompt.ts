import type { PromptDefinition } from './types';

export interface CertificationAnswersInput {
  readonly certification_name: string;
  readonly topic: string;
  readonly questions: string;
}

export const certificationAnswersPrompt = {
  build: (input: CertificationAnswersInput): string => {
    const { certification_name, topic, questions } = input;

    return `You are an IT certification exam expert validating correct answers for exam questions.

CONTEXT:
- Certification: ${certification_name}
- Topic: ${topic}

QUESTIONS:
${questions}

OBJECTIVE: For each question above, return:
1. "questionId": the id of the question.
2. "correctOptions": array with the correct letter(s) (exactly "correctCount" entries, from A–E).

RULES:
1. Respond in English.
2. "correctOptions" must have exactly "correctCount" letters for each question.
3. Base answers on current official documentation, best practices, and the certification's exam guide.
4. Search the web for the authoritative answer if there is any doubt.
5. Do NOT alter the question text or option text.

OUTPUT: respond ONLY with valid JSON in the following format:
{
  "answers": [
    {
      "questionId": 1,
      "correctOptions": ["A"]
    }
  ]
}`;
  },
} satisfies PromptDefinition<CertificationAnswersInput>;
