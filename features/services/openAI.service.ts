import OpenAI from 'openai';

export interface TemplateReference {
  promptId: string;
  version: string;
}

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
