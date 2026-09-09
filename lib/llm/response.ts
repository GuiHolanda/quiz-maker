export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export type LlmErrorType = 'quota' | 'generation' | 'timeout';

export interface SanitizeLlmErrorMessages {
  readonly internal: string;
  readonly generic: string;
}

export function sanitizeLlmError(
  err: unknown,
  messages: SanitizeLlmErrorMessages
): { message: string; errorType: LlmErrorType } {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // 429 vem primeiro: um "insufficient_quota" da OpenAI tem status 429 e a palavra "quota"
    // na mensagem, mas é limite da plataforma, não do usuário — não deve virar errorType 'quota'.
    if ((err as { status?: number }).status === 429) {
      return { message: 'Limite de requisições da IA atingido', errorType: 'timeout' };
    }
    if (msg.includes('limit reached') || msg.includes('quota')) {
      return { message: 'Limite de quota atingido', errorType: 'quota' };
    }
    if (msg.includes('timeout') || msg.includes('econnaborted')) {
      return { message: 'Tempo limite de geração excedido', errorType: 'timeout' };
    }
    if ('code' in err) {
      return { message: messages.internal, errorType: 'generation' };
    }
  }
  return { message: messages.generic, errorType: 'generation' };
}
