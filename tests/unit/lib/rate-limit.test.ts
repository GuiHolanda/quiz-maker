import { beforeEach, vi } from 'vitest';

import { enforceRateLimit, resetRateLimitersForTests } from '@/lib/rate-limit';
import { toApiErrorResponse } from '@/lib/api-error';

const limit = vi.fn();
const slidingWindow = vi.fn(() => 'sliding-window-config');
const ratelimitConstructor = vi.fn();
const getRedis = vi.fn();

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    class {
      limit = limit;
      constructor(config: unknown) {
        ratelimitConstructor(config);
      }
    },
    { slidingWindow: (...args: unknown[]) => slidingWindow(...(args as [])) }
  ),
}));

vi.mock('@/lib/redis', () => ({
  getRedis: () => getRedis(),
}));

const FAKE_REDIS = { name: 'fake-redis' };

describe('enforceRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitersForTests();
    getRedis.mockReturnValue(FAKE_REDIS);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('sem Redis configurado', () => {
    it('não limita nada e não constrói limitador', async () => {
      getRedis.mockReturnValue(null);

      await expect(enforceRateLimit('ai_chat', 'user-1')).resolves.toBeUndefined();
      expect(ratelimitConstructor).not.toHaveBeenCalled();
    });
  });

  describe('dentro do limite', () => {
    it('deixa passar', async () => {
      limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });

      await expect(enforceRateLimit('generate_questions', 'user-1')).resolves.toBeUndefined();
      expect(limit).toHaveBeenCalledWith('user-1');
    });

    it('reaproveita o limitador entre chamadas da mesma ação', async () => {
      limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });

      await enforceRateLimit('generate_questions', 'user-1');
      await enforceRateLimit('generate_questions', 'user-2');

      expect(ratelimitConstructor).toHaveBeenCalledTimes(1);
    });

    it('isola as ações em prefixos distintos, para uma não consumir a cota da outra', async () => {
      limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });

      await enforceRateLimit('generate_questions', 'user-1');
      await enforceRateLimit('ai_chat', 'user-1');

      const prefixes = ratelimitConstructor.mock.calls.map(([config]: any) => config.prefix);
      expect(prefixes).toEqual(['rl:generate_questions', 'rl:ai_chat']);
    });
  });

  describe('estourando o limite', () => {
    it('lança 429 com o código que o cliente reconhece', async () => {
      limit.mockResolvedValue({ success: false, reset: Date.now() + 30_000 });

      await expect(enforceRateLimit('auto_config', 'user-1')).rejects.toMatchObject({ status: 429 });
    });

    it('o erro atravessa toApiErrorResponse preservando status e código', async () => {
      limit.mockResolvedValue({ success: false, reset: Date.now() + 30_000 });

      const thrown = await enforceRateLimit('auto_config', 'user-1').catch((err) => err);
      const response = toApiErrorResponse(thrown);

      expect(response.status).toBe(429);
      expect(response.code).toBe('rate_limited');
      expect(response.message).toContain('Tente novamente');
    });

    it('informa a espera em segundos, arredondando para cima', async () => {
      limit.mockResolvedValue({ success: false, reset: Date.now() + 4200 });

      const thrown = await enforceRateLimit('auto_config', 'user-1').catch((err) => err);

      expect(thrown.message).toMatch(/em 5s/);
    });

    it('nunca anuncia espera menor que um segundo', async () => {
      limit.mockResolvedValue({ success: false, reset: Date.now() - 5000 });

      const thrown = await enforceRateLimit('auto_config', 'user-1').catch((err) => err);

      expect(thrown.message).toMatch(/em 1s/);
    });
  });

  // Recusar requisição legítima porque o limitador caiu é pior do que deixar passar uma
  // rajada — mas uma rejeição de verdade não pode ser engolida junto.
  describe('quando o limitador está indisponível', () => {
    it('deixa a requisição passar em vez de derrubá-la', async () => {
      limit.mockRejectedValue(new Error('upstash indisponível'));

      await expect(enforceRateLimit('extract_edital', 'user-1')).resolves.toBeUndefined();
    });

    it('ainda assim propaga uma rejeição real de limite', async () => {
      limit.mockResolvedValue({ success: false, reset: Date.now() + 10_000 });

      await expect(enforceRateLimit('extract_edital', 'user-1')).rejects.toMatchObject({ status: 429 });
    });
  });
});
