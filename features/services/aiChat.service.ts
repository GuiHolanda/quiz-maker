import OpenAI from 'openai';

import { AI_CHAT_IDENTIFY_PROMPT } from '@/config/prompts/ai-chat/identify.prompt';
import { AI_CHAT_TOPICS_PROMPT } from '@/config/prompts/ai-chat/topics.prompt';
import { MetricsService } from '@/features/services/metrics.service';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 10_000;

export class AiChatService {
  private readonly openai: OpenAI;
  private readonly metricsService: MetricsService;

  constructor() {
    this.openai = new OpenAI();
    this.metricsService = new MetricsService();
  }

  validate(body: unknown): { messages: { role: 'user' | 'assistant'; content: string }[]; language: string } {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { messages, language } = body as Record<string, unknown>;

    if (!Array.isArray(messages) || messages.length === 0) {
      throw Object.assign(new Error('Messages array is required'), { status: 400 });
    }

    if (messages.length > MAX_MESSAGES) {
      throw Object.assign(new Error(`Maximum ${MAX_MESSAGES} messages allowed`), { status: 400 });
    }

    const valid: { role: 'user' | 'assistant'; content: string }[] = [];

    for (const msg of messages) {
      if (!msg.role || typeof msg.content !== 'string') {
        throw Object.assign(new Error('Each message must have role and content'), { status: 400 });
      }

      if (!ALLOWED_ROLES.has(msg.role as string)) {
        throw Object.assign(new Error('Role must be either "user" or "assistant"'), { status: 400 });
      }

      if (msg.content.length > MAX_CONTENT_LENGTH) {
        throw Object.assign(new Error(`Message content cannot exceed ${MAX_CONTENT_LENGTH} characters`), {
          status: 400,
        });
      }

      if (msg.content.trim() === '') continue;

      valid.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    if (valid.length === 0) {
      throw Object.assign(new Error('Messages array is required'), { status: 400 });
    }

    return { messages: valid, language: language === 'pt' ? 'pt' : 'en' };
  }

  private selectPrompt(messages: { role: string; content: string }[]): string {
    const hasAssistantMessage = messages.some((m) => m.role === 'assistant');

    if (!hasAssistantMessage) return AI_CHAT_IDENTIFY_PROMPT;

    return AI_CHAT_TOPICS_PROMPT;
  }

  async streamChat(
    userId: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    language: string
  ): Promise<ReadableStream> {
    const languageInstruction =
      language === 'pt'
        ? 'You MUST respond entirely in Brazilian Portuguese (pt-BR). Every word must be in Portuguese.'
        : 'You MUST respond entirely in English.';

    const prompt = this.selectPrompt(messages);

    const stream = await this.openai.responses.create({
      model: process.env.AI_CHAT_MODEL || 'gpt-5.4-mini',
      instructions: `${languageInstruction}\n\n${prompt}`,
      input: messages,
      // `web_search` (not the legacy `web_search_preview`) — see openAI.service.ts. Left
      // unforced here on purpose: unlike the single-purpose research prompts, a chat turn
      // can legitimately be a topic tweak, the concurso/edital flow, or a closing message,
      // none of which should be made to search.
      tools: [{ type: 'web_search' }],
      stream: true,
    });

    const logId = await this.metricsService.createLog(userId, 'ai_chat');
    const startMs = Date.now();
    const encoder = new TextEncoder();
    const metricsService = this.metricsService;

    return new ReadableStream({
      async start(controller) {
        let metricsFinalized = false;
        let durationMs = 0;

        try {
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta' && event.delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.delta })}\n\n`));
            }

            if (event.type === 'response.completed') {
              durationMs = Date.now() - startMs;
              const inputTokens = event.response.usage?.input_tokens ?? 0;
              const outputTokens = event.response.usage?.output_tokens ?? 0;
              void metricsService.recordStep(logId, 'chat', { inputTokens, outputTokens }, durationMs);
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          void metricsService.finalize(logId, durationMs);
          metricsFinalized = true;
        } catch {
          if (!metricsFinalized) {
            void metricsService.finalize(logId, Date.now() - startMs);
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      },
    });
  }
}
