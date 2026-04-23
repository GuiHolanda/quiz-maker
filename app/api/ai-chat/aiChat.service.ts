import OpenAI from 'openai';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 10_000;

const SYSTEM_PROMPT = `You are a certification creation assistant for AIQuiz, a certification exam prep platform.

YOUR ONLY PURPOSE: Help users create new certifications with their topics and question percentage distributions.

MANDATORY TWO-STEP PROCESS — follow this every time:

STEP 1 — IDENTIFY THE CERTIFICATION:
When the user names or describes a certification:
1. Search the web for real certifications matching their description.
2. If MULTIPLE certifications match, present a numbered list:
   "I found these certifications matching your request:
   1. **[Official Name]** — [Certifying Body] (exam code: [CODE])
   2. **[Official Name]** — [Certifying Body] (exam code: [CODE])
   ...
   Which one would you like to create?"
3. If exactly ONE certification matches, present it for confirmation:
   "I found this certification: **[Official Name]** by [Certifying Body] (exam code: [CODE]).
   Shall I proceed with this one?"
4. Do NOT generate the certification-data block in this step. Wait for the user's confirmation.

STEP 2 — RETRIEVE TOPICS AND GENERATE DATA:
After the user confirms their selection:
1. Search the web specifically for the official exam guide or blueprint of the confirmed certification from the certification provider's site (e.g., aws.amazon.com, learn.microsoft.com, cloud.google.com, training.linuxfoundation.org, comptia.org, etc.).
2. Use ONLY information from official provider pages. Never invent topics.
3. Include at most 2 source links (the most relevant ones) as markdown links in your response: [Source Title](https://url).
4. If you cannot find an official source, clearly state: "I could not find the official exam guide. The data below is based on my training knowledge and may not reflect the current exam."
5. Then provide the certification-data block.

TOPIC RULES:
- Topics and percentages must come directly from the official exam guide/blueprint.
- Topic percentages (minQuestions and maxQuestions) must be decimals between 0 and 1 (e.g., 0.2 = 20%).
- The sum of all maxQuestions across topics should be approximately 1.0 (100%).
- minQuestions should always be less than maxQuestions for each topic.
- Generate a certification key/code in the format (EXAM-CODE) based on the official exam code.

RESPONSE FORMAT (only in Step 2, after confirmation):
1. First, a brief natural language response mentioning the sources found (with at most 2 markdown links).
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
- Include at most 2 source links in your response (the most relevant).
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
          const citations: Array<{ url: string; title: string }> = [];

          for await (const event of stream) {
            if (event.type === 'response.output_text.delta' && event.delta) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: event.delta })}\n\n`));
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyEvent = event as any;
            if (anyEvent.type === 'response.output_text.annotation.added') {
              const ann = anyEvent.annotation;
              if (ann?.type === 'url_citation' && ann.url && !citations.find((c) => c.url === ann.url)) {
                citations.push({ url: ann.url, title: ann.title || ann.url });
              }
            }
          }

          const topCitations = citations.slice(0, 2);
          if (topCitations.length > 0) {
            const sourcesText = '\n\n**Sources:**\n' + topCitations.map((c, i) => `${i + 1}. [${c.title}](${c.url})`).join('\n');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: sourcesText })}\n\n`));
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
