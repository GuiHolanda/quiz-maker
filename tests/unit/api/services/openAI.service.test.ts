import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenAIService } from '@/features/services/openAI.service';
import type { PromptDefinition } from '@/config/prompts/types';

const prompt: PromptDefinition<Record<string, never>> = { build: () => 'hello' };

function makeFakeClient(createImpl: (params: Record<string, unknown>) => Promise<Record<string, unknown>>) {
  return {
    apiKey: '',
    responses: { create: vi.fn().mockImplementation(createImpl) },
  } as any;
}

describe('OpenAIService.call — web_search controls', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
  });

  it('sends filters.allowed_domains when allowedDomains is provided', async () => {
    let sentParams: Record<string, unknown> = {};
    const client = makeFakeClient(async (params) => {
      sentParams = params;
      return { output_text: '{}', usage: {} };
    });
    const service = new OpenAIService(client);

    await service.call(prompt, {}, { allowedDomains: ['cesgranrio.org.br'] });

    expect(sentParams.tools).toEqual([{ type: 'web_search', filters: { allowed_domains: ['cesgranrio.org.br'] } }]);
  });

  it('omits filters when allowedDomains is empty', async () => {
    let sentParams: Record<string, unknown> = {};
    const client = makeFakeClient(async (params) => {
      sentParams = params;
      return { output_text: '{}', usage: {} };
    });
    const service = new OpenAIService(client);

    await service.call(prompt, {}, { allowedDomains: [] });

    expect(sentParams.tools).toEqual([{ type: 'web_search' }]);
  });

  it('sends search_context_size when provided', async () => {
    let sentParams: Record<string, unknown> = {};
    const client = makeFakeClient(async (params) => {
      sentParams = params;
      return { output_text: '{}', usage: {} };
    });
    const service = new OpenAIService(client);

    await service.call(prompt, {}, { searchContextSize: 'high' });

    expect(sentParams.tools).toEqual([{ type: 'web_search', search_context_size: 'high' }]);
  });

  it('sends include: web_search_call.action.sources when includeSources is true', async () => {
    let sentParams: Record<string, unknown> = {};
    const client = makeFakeClient(async (params) => {
      sentParams = params;
      return { output_text: '{}', usage: {} };
    });
    const service = new OpenAIService(client);

    await service.call(prompt, {}, { includeSources: true });

    expect(sentParams.include).toEqual(['web_search_call.action.sources']);
  });

  it('omits include by default', async () => {
    let sentParams: Record<string, unknown> = {};
    const client = makeFakeClient(async (params) => {
      sentParams = params;
      return { output_text: '{}', usage: {} };
    });
    const service = new OpenAIService(client);

    await service.call(prompt, {});

    expect(sentParams.include).toBeUndefined();
  });

  it('extracts source URLs from web_search_call output items when includeSources is true', async () => {
    const client = makeFakeClient(async () => ({
      output_text: '{}',
      usage: { input_tokens: 1, output_tokens: 2 },
      output: [
        {
          type: 'web_search_call',
          id: 'ws_1',
          status: 'completed',
          action: {
            type: 'search',
            query: 'edital transpetro',
            sources: [
              { type: 'url', url: 'https://transpetro.com.br/edital.pdf' },
              { type: 'url', url: 'https://qconcursos.com/edital.pdf' },
            ],
          },
        },
        { type: 'message', id: 'm_1' },
      ],
    }));
    const service = new OpenAIService(client);

    const result = await service.call(prompt, {}, { includeSources: true });

    expect(result.sources).toEqual(['https://transpetro.com.br/edital.pdf', 'https://qconcursos.com/edital.pdf']);
  });

  it('returns an empty sources array when includeSources was not requested', async () => {
    const client = makeFakeClient(async () => ({
      output_text: '{}',
      usage: {},
      output: [
        {
          type: 'web_search_call',
          action: { type: 'search', sources: [{ type: 'url', url: 'https://x.gov.br/y.pdf' }] },
        },
      ],
    }));
    const service = new OpenAIService(client);

    const result = await service.call(prompt, {});

    expect(result.sources).toEqual([]);
  });

  it('keeps existing webSearch/jsonMode/model behavior unchanged (regression)', async () => {
    let sentParams: Record<string, unknown> = {};
    const client = makeFakeClient(async (params) => {
      sentParams = params;
      return { output_text: 'ok', usage: {} };
    });
    const service = new OpenAIService(client);

    await service.call(prompt, {}, { webSearch: false, jsonMode: true, model: 'gpt-x' });

    expect(sentParams.tools).toBeUndefined();
    expect(sentParams.text).toEqual({ format: { type: 'json_object' } });
    expect(sentParams.model).toBe('gpt-x');
  });
});
