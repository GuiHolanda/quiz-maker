import OpenAI from 'openai';

const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 10_000;

const SYSTEM_PROMPT = `You are a certification creation assistant for AIQuiz, a certification exam prep platform.

YOUR ONLY PURPOSE: Help users create new certifications with their topics and question percentage distributions.

MANDATORY TWO-STEP PROCESS — follow this every time:

STEP 1 — IDENTIFY THE CERTIFICATION (ALWAYS DO THIS FIRST):
When the user names or describes a certification:
1. Search the web for real certifications matching their description.
2. If MULTIPLE certifications match, present ONLY a numbered list:
   "1. **[Official Name]** — [Certifying Body]
   2. **[Official Name]** — [Certifying Body]
   Which one?"
3. If exactly ONE certification matches, ask for confirmation in ONE sentence:
   "**[Official Name]** by [Certifying Body]. Proceed?"
4. STOP. Do NOT include descriptions, explanations, sources, or any extra text. Only the name, certifying body, and the confirmation question.
5. Wait for the user to explicitly confirm before moving to Step 2.

STEP 2 — RETRIEVE TOPICS AND GENERATE DATA (ONLY after user confirms Step 1):
This step can ONLY happen after the user has responded to Step 1 with a confirmation.
1. Search the web specifically for the official exam guide or blueprint from the certification provider's site.
2. Use ONLY information from official provider pages. Never invent topics.
3. Keep your response SHORT: 1-2 sentences of context about the certification (what it validates) and the certifying institution, then immediately the certification-data block.
4. Place source links ONLY at the very end, after the certification-data block. Maximum 2 links, no duplicates.
5. If you cannot find an official source, say so in one sentence.

BREVITY RULES:
- Do NOT give study tips, preparation advice, or course recommendations.
- Do NOT repeat information already in the certification-data block.
- Do NOT include multiple links to the same website.
- Your Step 2 response should have this structure:
  a) 1-2 sentences of context (certification name, certifying body)
  b) The certification-data block
  c) Sources: max 2 unique links

TOPIC RULES:
- Topics and percentages must come directly from the official exam guide/blueprint.
- Topic percentages (minQuestions and maxQuestions) must be decimals between 0 and 1 (e.g., 0.2 = 20%).
- The sum of all maxQuestions across topics should be approximately 1.0 (100%).
- minQuestions should always be less than maxQuestions for each topic.
- Generate a certification key/code in the format (EXAM-CODE) based on the official exam code.

CERTIFICATION-DATA FORMAT:

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
- If the user does not specify a certification, ask clarifying questions.`;

export class AiChatService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
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

    return { messages: messages as { role: 'user' | 'assistant'; content: string }[], language: language === 'pt' ? 'pt' : 'en' };
  }

  async streamChat(messages: { role: 'user' | 'assistant'; content: string }[], language: string): Promise<ReadableStream> {
    const languageInstruction = language === 'pt'
      ? 'You MUST respond entirely in Brazilian Portuguese (pt-BR). Every word must be in Portuguese.'
      : 'You MUST respond entirely in English.';

    const stream = await this.openai.responses.create({
      model: process.env.AI_CHAT_MODEL || 'gpt-4o-mini',
      instructions: `${languageInstruction}\n\n${SYSTEM_PROMPT}`,
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
