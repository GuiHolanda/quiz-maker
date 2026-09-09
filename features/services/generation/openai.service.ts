import OpenAI from 'openai';
import type { ResponseIncludable } from 'openai/resources/responses/responses';

import type { PromptDefinition } from '@/config/prompts/types';

export interface OpenAICallOptions {
  webSearch?: boolean;
  jsonMode?: boolean;
  model?: string;
  // Scopes web_search to these hosts (+ subdomains), up to the API's 100-domain cap. Empty/
  // omitted means unrestricted — never send an empty allowed_domains array to the API, that
  // means something different (no results ever pass the filter).
  allowedDomains?: readonly string[];
  // How much of the model's context window web_search may spend per query. Default (omitted)
  // is the API's own 'medium'.
  searchContextSize?: 'low' | 'medium' | 'high';
  // Requests the full list of URLs web_search consulted (not just the ones cited in the
  // answer) via `include`, and has call() collect them into the returned `sources` array.
  includeSources?: boolean;
}

const MAX_429_ATTEMPTS = 3;

// One URL entry inside a web_search_call output item's action.sources — present only when
// the call requested `include: ['web_search_call.action.sources']`. Declared locally because
// the installed SDK's ResponseFunctionWebSearch type doesn't yet model `action` (see the cast
// in extractSources below); this shape matches the documented API response.
interface WebSearchCallSource {
  readonly type: 'url';
  readonly url: string;
}

interface WebSearchCallOutputItem {
  readonly type: 'web_search_call';
  readonly action?: { readonly sources?: readonly WebSearchCallSource[] };
}

// Flattens every source URL across all web_search_call items in the response's output —
// there can be more than one when the model issues multiple searches in one turn. Silently
// skips anything not shaped like a web_search_call/url source instead of throwing, since this
// only ever augments a result the caller already has from output_text.
function extractSources(output: readonly unknown[]): string[] {
  const urls: string[] = [];

  for (const item of output) {
    const call = item as WebSearchCallOutputItem;
    if (call?.type !== 'web_search_call') continue;
    for (const source of call.action?.sources ?? []) {
      if (source?.type === 'url' && typeof source.url === 'string') urls.push(source.url);
    }
  }

  return urls;
}

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
  ): Promise<{ text: string; inputTokens: number; outputTokens: number; sources: string[] }> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error('API key not configured');
    this.openAIClient.apiKey = apiKey;

    const webSearch = options?.webSearch ?? true;
    const jsonMode = options?.jsonMode ?? false;
    const model = options?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o';
    const allowedDomains = options?.allowedDomains ?? [];
    const includeSources = options?.includeSources ?? false;

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
        ...(webSearch
          ? {
              tools: [
                {
                  type: 'web_search' as const,
                  ...(allowedDomains.length > 0 ? { filters: { allowed_domains: [...allowedDomains] } } : {}),
                  ...(options?.searchContextSize ? { search_context_size: options.searchContextSize } : {}),
                },
              ],
              tool_choice: 'required' as const,
            }
          : {}),
        ...(jsonMode ? { text: { format: { type: 'json_object' as const } } } : {}),
        // Cast: 'web_search_call.action.sources' is documented but missing from this SDK
        // version's ResponseIncludable union (see also WebSearchCallOutputItem above).
        ...(includeSources ? { include: ['web_search_call.action.sources'] as unknown as ResponseIncludable[] } : {}),
        input: prompt.build(input),
        max_output_tokens: 16000,
      })
    );

    return {
      text: response.output_text ?? '',
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      sources: includeSources ? extractSources(response.output ?? []) : [],
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
