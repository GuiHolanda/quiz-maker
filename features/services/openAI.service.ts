import OpenAI from 'openai';

import type { PromptDefinition } from '@/config/prompts/types';

export class OpenAIService {
  // Single attempt with a generous 280s timeout. The earlier 90s + 1 retry
  // pattern produced ~180s spent on stacked timeouts — exactly the failure
  // mode reported in production logs. With maxRetries: 0, slow generations
  // get one window that fits under Vercel's 300s function ceiling; rare
  // transient errors surface to the user, who can re-submit faster than the
  // SDK can retry a request that is already known to be slow.
  constructor(
    private readonly openAIClient: OpenAI = new OpenAI({
      timeout: 280_000,
      maxRetries: 0,
    })
  ) {}

  async call<TInput>(prompt: PromptDefinition<TInput>, input: TInput): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error('API key not configured');
    this.openAIClient.apiKey = apiKey;

    const response = await (this.openAIClient.responses.create as Function)({
      model: process.env.OPENAI_MODEL ?? 'gpt-5.4',
      tools: [{ type: 'web_search_preview' }],
      input: prompt.build(input),
      max_output_tokens: 16000,
    });

    return response?.output_text ?? '';
  }
}
