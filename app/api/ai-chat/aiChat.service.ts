import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a certification creation assistant for AIQuiz, a certification exam prep platform.

YOUR ONLY PURPOSE: Help users create new certifications with their topics and question percentage distributions.

RULES:
1. Only respond to requests about creating certifications. For anything else, politely explain that you can only help with certification creation.
2. When the user names a certification, research its official exam topics and suggest a complete certification structure.
3. Topic percentages (minQuestions and maxQuestions) must be decimals between 0 and 1 (e.g., 0.2 = 20%).
4. The sum of all maxQuestions across topics should be approximately 1.0 (100%).
5. minQuestions should always be less than maxQuestions for each topic.
6. Generate a certification key/code in the format (EXAM-CODE) based on the official exam code.

WHEN YOU HAVE ENOUGH INFORMATION to create a certification, output the data in this exact format:

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
- Output the certification-data block AFTER your natural language explanation.
- If the user asks to adjust topics, regenerate the ENTIRE certification-data block with all modifications applied.
- If the user does not specify a certification, ask clarifying questions.
- Respond in the same language the user writes in.`;

export class AiChatService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI();
  }

  validate(body: unknown): { role: string; content: string }[] {
    if (!body || typeof body !== 'object') {
      throw Object.assign(new Error('Invalid request body'), { status: 400 });
    }

    const { messages } = body as Record<string, unknown>;

    if (!Array.isArray(messages) || messages.length === 0) {
      throw Object.assign(new Error('Messages array is required'), { status: 400 });
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        throw Object.assign(new Error('Each message must have role and content'), { status: 400 });
      }
    }

    return messages as { role: string; content: string }[];
  }

  async streamChat(messages: { role: string; content: string }[]): Promise<ReadableStream> {
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'developer', content: SYSTEM_PROMPT },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const stream = await this.openai.chat.completions.create({
      model: process.env.AI_CHAT_MODEL || 'gpt-4o-mini',
      messages: openaiMessages,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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
