import type { PromptDefinition } from './types';

export interface CertificationExplanationsInput {
  readonly certification_name: string;
  readonly topic: string;
  readonly question: {
    readonly text: string;
    readonly options: Record<string, string>;
    readonly correctOptions: string[];
  };
}

export const certificationExplanationsPrompt = {
  build: (input: CertificationExplanationsInput): string => {
    const { certification_name, topic, question } = input;
    const optionsText = Object.entries(question.options)
      .map(([label, text]) => `${label}) ${text}`)
      .join('\n');
    const correctLabel =
      question.correctOptions.length === 1
        ? `Correct answer: ${question.correctOptions[0]}`
        : `Correct answers: ${question.correctOptions.join(', ')}`;

    return `You are a certification exam expert. Explain the answer to the question below.

CONTEXT:
- Certification: ${certification_name}
- Topic: ${topic}

QUESTION:
${question.text}

OPTIONS:
${optionsText}

${correctLabel}

OBJECTIVE: For EACH option listed above, write an objective explanation of 1 to 3 sentences explaining why it is correct or incorrect. Base your explanation on official documentation, standards, or best practices for the "${certification_name}" certification.

OUTPUT: respond ONLY with valid JSON in the following format (include all options from the question):
{
  "explanations": {
    "A": "Explanation for option A.",
    "B": "Explanation for option B."
  }
}`;
  },
} satisfies PromptDefinition<CertificationExplanationsInput>;
