import OpenAI from 'openai';

import type { PromptDefinition } from '@/config/prompts/types';

export interface OpenAICallOptions {
  webSearch?: boolean;
  jsonMode?: boolean;
  model?: string;
}

const MAX_429_ATTEMPTS = 3;

export class OpenAIService {
  // Single attempt with a generous 280s timeout (maxRetries: 0). Slow generations get
  // one window under Vercel's 300s ceiling; 429 rate-limit errors are retried manually
  // with exponential backoff below, since those ARE transient and benefit from waiting.
  constructor(
    private readonly openAIClient: OpenAI = new OpenAI({
      timeout: 280_000,
      maxRetries: 0,
    })
  ) {}

  async call<TInput>(
    prompt: PromptDefinition<TInput>,
    input: TInput,
    options?: OpenAICallOptions
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error('API key not configured');
    this.openAIClient.apiKey = apiKey;

    const webSearch = options?.webSearch ?? true;
    const jsonMode = options?.jsonMode ?? false;
    const model = options?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o';

    const response = await this.callWithBackoff(() =>
      this.openAIClient.responses.create({
        model,
        // `web_search` (not the legacy `web_search_preview`) with `tool_choice: 'required'`
        // — the tool being *available* doesn't mean the model uses it; left to its own
        // judgment it can answer from (possibly stale) training data instead, which is how
        // fields like a certification's current passing score or version year come back
        // blank even though they're on the official page. Forcing the call is only safe
        // because every webSearch:true call site here is single-purpose research — never
        // combined with a multi-branch prompt where a search would sometimes be wrong.
        ...(webSearch ? { tools: [{ type: 'web_search' as const }], tool_choice: 'required' as const } : {}),
        ...(jsonMode ? { text: { format: { type: 'json_object' as const } } } : {}),
        input: prompt.build(input),
        max_output_tokens: 16000,
      })
    );

    return {
      text: response.output_text ?? '',
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  }

  // Retries only on HTTP 429 (rate limit). Timeouts and other errors propagate immediately —
  // retrying a known-slow generation just doubles the wait.
  private async callWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_429_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err: unknown) {
        const is429 = (err as { status?: number })?.status === 429;
        if (is429 && attempt < MAX_429_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
          continue;
        }
        throw err;
      }
    }
    throw new Error('unreachable');
  }
}
