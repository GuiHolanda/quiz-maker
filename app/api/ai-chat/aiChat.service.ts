import OpenAI from 'openai';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 10_000;

const SYSTEM_PROMPT = `You are a certification creation assistant for AIQuiz, a certification exam prep platform.

YOUR ONLY PURPOSE: Help users create new certifications with their topics and question percentage distributions.

MANDATORY PROCESS — follow this every time:
1. When the user names a certification, SEARCH THE WEB for the official exam guide or blueprint published by the certification provider (e.g., AWS, Microsoft, Google, Linux Foundation, CompTIA, etc.).
2. Use ONLY information from official provider pages (aws.amazon.com, learn.microsoft.com, cloud.google.com, training.linuxfoundation.org, comptia.org, etc.). Never invent topics.
3. After searching, tell the user which source you found and include the URL.
4. If you cannot find an official source, clearly state: "I could not find the official exam guide for this certification. The data below is based on my training knowledge and may not reflect the current exam." Then still provide your best estimate.
5. Only respond to certification creation requests. For anything else, politely decline.

TOPIC RULES:
- Topics and percentages must come directly from the official exam guide/blueprint.
- Topic percentages (minQuestions and maxQuestions) must be decimals between 0 and 1 (e.g., 0.2 = 20%).
- The sum of all maxQuestions across topics should be approximately 1.0 (100%).
- minQuestions should always be less than maxQuestions for each topic.
- Generate a certification key/code in the format (EXAM-CODE) based on the official exam code.

RESPONSE FORMAT:
1. First, a brief natural language response mentioning the source found (with URL) or inability to find one.
2. Then the certification-data block:

\`\`\`certification-data
{
  "label": "Full Certification Name",
  "key": "(EXAM-CODE)",
  "topics": [
    { "name": "Topic Name", "minQuestions": 0.15, "maxQuestions": 0.25 }
  ]
}
\`\`\`

IMPORTANT:
- Always include the \`\`\`certification-data delimiter — the client parses this block.
- If the user asks to adjust topics, regenerate the ENTIRE certification-data block with all modifications applied.
- If the user does not specify a certification, ask clarifying questions.
- Respond in the same language the user writes in.`;

export class AiChatService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  validate(body: unknown): { role: 'user' | 'assistant'; content: string }[] {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { messages } = body as Record<string, unknown>;

    if (!Array.isArray(messages) || messages.length === 0) {
      throw Object.assign(new Error('Messages array is required'), { status: 400 });
    }

    if (messages.length > MAX_MESSAGES) {
      throw Object.assign(new Error(`Maximum ${MAX_MESSAGES} messages allowed`), { status: 400 });
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        throw Object.assign(new Error('Each message must have role and content'), { status: 400 });
      }

      if (!ALLOWED_ROLES.has(msg.role as string)) {
        throw Object.assign(new Error('Role must be either "user" or "assistant"'), { status: 400 });
      }

      if (msg.content.length > MAX_CONTENT_LENGTH) {
        throw Object.assign(new Error(`Message content cannot exceed ${MAX_CONTENT_LENGTH} characters`), { status: 400 });
      }
    }

    return messages as { role: 'user' | 'assistant'; content: string }[];
  }

  async streamChat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<ReadableStream> {
    const stream = await this.openai.responses.create({
      model: process.env.AI_CHAT_MODEL || 'gpt-4o-mini',
      instructions: SYSTEM_PROMPT,
      input: messages,
      tools: [{ type: 'web_search_preview' }],
      stream: true,
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'response.output_text.delta' && event.delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.delta })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`));
          controller.close();
        }
      },
    });
  }
}
