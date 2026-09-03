import { Ratelimit } from '@upstash/ratelimit';

import { getRedis } from '@/lib/redis';

// Proteção de rajada, não quota de plano: PLAN_LIMITS controla quanto o usuário pode
// consumir no período; isto controla com que velocidade. Um usuário dentro da quota ainda
// não deve conseguir disparar trinta gerações no mesmo segundo — cada uma custa dinheiro
// na OpenAI e ocupa um slot de função.
export type RateLimitedAction =
  | 'generate_questions'
  | 'auto_config'
  | 'identify_exam'
  | 'extract_edital'
  | 'ai_chat'
  | 'explanation';

const LIMITS: Record<RateLimitedAction, { requests: number; window: `${number} ${'s' | 'm'}` }> = {
  generate_questions: { requests: 10, window: '1 m' },
  auto_config: { requests: 5, window: '1 m' },
  identify_exam: { requests: 20, window: '1 m' },
  extract_edital: { requests: 5, window: '1 m' },
  ai_chat: { requests: 20, window: '1 m' },
  explanation: { requests: 30, window: '1 m' },
};

const RATE_LIMITED_CODE = 'rate_limited';

const limiters = new Map<RateLimitedAction, Ratelimit>();

function limiterFor(action: RateLimitedAction): Ratelimit | null {
  const redis = getRedis();

  if (!redis) return null;

  const existing = limiters.get(action);

  if (existing) return existing;

  const { requests, window } = LIMITS[action];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `rl:${action}`,
    analytics: false,
  });

  limiters.set(action, limiter);

  return limiter;
}

function rateLimitError(action: RateLimitedAction, retryAfterSeconds: number) {
  const { requests } = LIMITS[action];

  return Object.assign(new Error(`Muitas requisições. Tente novamente em ${retryAfterSeconds}s.`), {
    status: 429,
    body: { error: 'rate_limited', code: RATE_LIMITED_CODE, limit: requests, used: requests },
  });
}

function isRateLimitError(err: unknown): boolean {
  return err instanceof Error && (err as Error & { status?: number }).status === 429;
}

export function resetRateLimitersForTests(): void {
  limiters.clear();
}

// Sem Redis, não limita. Com Redis fora do ar, também não limita — recusar requisições
// legítimas porque o limitador caiu é pior do que deixar passar uma rajada. Uma rejeição
// de verdade, essa sim, sobe.
export async function enforceRateLimit(action: RateLimitedAction, userId: string): Promise<void> {
  const limiter = limiterFor(action);

  if (!limiter) return;

  try {
    const { success, reset } = await limiter.limit(userId);

    if (!success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

      throw rateLimitError(action, retryAfterSeconds);
    }
  } catch (err) {
    if (isRateLimitError(err)) throw err;

    console.error(`Rate limiter unavailable for "${action}", allowing request:`, err);
  }
}
