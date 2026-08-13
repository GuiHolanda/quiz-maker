import { OpenAIService } from '@/features/services/openAI.service';
import { demoQuizPrompt } from '@/config/prompts/demo-quiz.prompt';
import type { DemoQuizPromptInput } from '@/config/prompts/demo-quiz.prompt';
import type { DemoQuestion } from '@/shared/types';

function isValidQuestion(q: unknown): q is DemoQuestion {
  if (!q || typeof q !== 'object') return false;
  const obj = q as Record<string, unknown>;
  return (
    typeof obj.text === 'string' &&
    obj.text.trim().length > 0 &&
    Array.isArray(obj.options) &&
    obj.options.length === 4 &&
    obj.options.every((option: unknown) => typeof option === 'string' && (option as string).trim().length > 0) &&
    typeof obj.correctIndex === 'number' &&
    Number.isInteger(obj.correctIndex) &&
    obj.correctIndex >= 0 &&
    obj.correctIndex <= 3 &&
    typeof obj.topic === 'string' &&
    obj.topic.trim().length > 0 &&
    typeof obj.explanation === 'string'
  );
}

export class DemoQuizService {
  constructor(private readonly openAI: OpenAIService = new OpenAIService()) {}

  async generate(input: DemoQuizPromptInput): Promise<DemoQuestion[]> {
    const result = await this.openAI.call(demoQuizPrompt, input, { webSearch: false, jsonMode: true });

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      throw new Error('Failed to parse demo quiz response');
    }

    const raw = parsed as Record<string, unknown>;
    if (!Array.isArray(raw?.questions)) {
      throw new Error('Failed to parse demo quiz response');
    }

    return raw.questions.filter(isValidQuestion);
  }
}
