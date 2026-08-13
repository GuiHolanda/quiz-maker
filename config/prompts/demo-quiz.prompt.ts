import type { PromptDefinition } from './types';

export interface DemoQuizPromptInput {
  readonly examName: string;
  readonly examType: 'certification' | 'public_exam';
  readonly topics: string[];
  readonly count: number;
}

export const demoQuizPrompt = {
  build: (input: DemoQuizPromptInput): string => {
    const { examName, examType, topics, count } = input;

    const examContext =
      examType === 'public_exam'
        ? `a Brazilian concurso público (${examName})`
        : `the ${examName} certification exam`;

    return `Generate ${count} multiple-choice practice questions for ${examContext}.

TOPICS TO COVER (distribute questions proportionally):
${topics.map((t) => `- ${t}`).join('\n')}

REQUIREMENTS:
- Write all questions and answers in Brazilian Portuguese
- Each question must have exactly 4 answer options (A, B, C, D)
- Questions must match the style, difficulty, and depth of the real exam
- Distribute questions across all listed topics
- Each explanation must be 1–2 sentences explaining WHY the correct answer is right
- Vary difficulty: ~30% easy, ~50% medium, ~20% hard

RESPOND ONLY with valid JSON in this exact format, no text before or after:
{"questions":[{"text":"<question text>","options":["<A text>","<B text>","<C text>","<D text>"],"correctIndex":<0–3>,"topic":"<topic name from the list>","explanation":"<1–2 sentence explanation>"}]}

correctIndex is 0-based: 0=A, 1=B, 2=C, 3=D.
The "topic" field must exactly match one of the topic names provided above.`;
  },
} satisfies PromptDefinition<DemoQuizPromptInput>;
