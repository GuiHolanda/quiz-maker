import OpenAI from 'openai';

export interface TemplateReference {
  promptId: string;
  version: string;
}

export class OpenAIService {
  // Configure the SDK transport with an explicit per-request timeout and one
  // retry. Without this, slow OpenAI responses surface as the bare
  // "TypeError: fetch failed" undici error when Vercel kills the function or
  // the underlying socket is reset, which is hard to diagnose downstream.
  constructor(
    private readonly openAIClient: OpenAI = new OpenAI({
      timeout: 90_000,
      maxRetries: 1,
    })
  ) {}

  async getLLMResponse(template: TemplateReference, variables: any): Promise<string> {
    const { promptId, version } = template;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error('API key not configured');
    this.openAIClient.apiKey = apiKey;

    const response = await this.openAIClient.responses.create({
      prompt: {
        id: promptId,
        version,
        variables,
      },
    });

    return response?.output_text;
  }

  async getLLMResponseInline(systemPrompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error('API key not configured');
    this.openAIClient.apiKey = apiKey;

    const response = await this.openAIClient.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      response_format: { type: 'json_object' },
    });

    return response.choices[0]?.message?.content ?? '';
  }

  // Uses the Responses API with the web_search_preview tool so the model can
  // search for real exam questions before generating new ones.
  async getLLMResponseWithWebSearch(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error('API key not configured');
    this.openAIClient.apiKey = apiKey;

    const response = await this.openAIClient.responses.create({
      model: process.env.OPENAI_WEB_SEARCH_MODEL ?? 'gpt-4o',
      tools: [{ type: 'web_search_preview' }],
      input: prompt,
      max_output_tokens: 16000,
    } as any);

    return response?.output_text ?? '';
  }
}
