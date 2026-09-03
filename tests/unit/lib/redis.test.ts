import { beforeEach, afterEach, vi } from 'vitest';

const redisConstructor = vi.fn();
const get = vi.fn();
const set = vi.fn();
const del = vi.fn();

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = get;
    set = set;
    del = del;
    constructor(config: unknown) {
      redisConstructor(config);
    }
  },
}));

const ENV_KEYS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const;

async function loadRedisModule() {
  const module = await import('@/lib/redis');

  module.resetRedisForTests();

  return module;
}

function clearCredentials() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe('lib/redis', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    clearCredentials();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('sem credenciais configuradas', () => {
    it('não instancia cliente algum', async () => {
      const { getRedis, isRedisConfigured } = await loadRedisModule();

      expect(getRedis()).toBeNull();
      expect(isRedisConfigured()).toBe(false);
      expect(redisConstructor).not.toHaveBeenCalled();
    });

    it('cacheGet devolve null para quem chamar cair no banco', async () => {
      const { cacheGet } = await loadRedisModule();

      await expect(cacheGet('qualquer')).resolves.toBeNull();
      expect(get).not.toHaveBeenCalled();
    });

    it('cacheSet e cacheDelete são no-op silenciosos', async () => {
      const { cacheSet, cacheDelete } = await loadRedisModule();

      await expect(cacheSet('k', { a: 1 }, 30)).resolves.toBeUndefined();
      await expect(cacheDelete('k')).resolves.toBeUndefined();
      expect(set).not.toHaveBeenCalled();
      expect(del).not.toHaveBeenCalled();
    });

    it('claimOnce concede a trava, para o trabalho deduplicado ainda acontecer', async () => {
      const { claimOnce } = await loadRedisModule();

      await expect(claimOnce('evento-1', 60)).resolves.toBe(true);
    });
  });

  describe('com credenciais', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://exemplo.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token-secreto';
    });

    it('instancia uma única vez e reaproveita o cliente', async () => {
      const { getRedis } = await loadRedisModule();

      const first = getRedis();
      const second = getRedis();

      expect(first).toBe(second);
      expect(redisConstructor).toHaveBeenCalledTimes(1);
      expect(redisConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://exemplo.upstash.io', token: 'token-secreto' })
      );
    });

    // O padrão do SDK é 5 retries com backoff exponencial e nenhum teto por request, o que
    // faria um Redis fora do ar custar segundos antes do fallback. Sem este teste a
    // configuração some numa refatoração e ninguém percebe até a produção ficar lenta.
    it('limita retry e impõe teto de tempo por request', async () => {
      (await loadRedisModule()).getRedis();

      const [config] = redisConstructor.mock.calls[0] as [any];

      expect(config.retry).toEqual({ retries: 1, backoff: expect.any(Function) });
      expect(config.retry.backoff(1)).toBe(100);
      expect(typeof config.signal).toBe('function');
      expect(config.signal()).toBeInstanceOf(AbortSignal);
    });

    it('aceita os nomes KV_* que a integração da Vercel injeta', async () => {
      clearCredentials();
      process.env.KV_REST_API_URL = 'https://vercel.upstash.io';
      process.env.KV_REST_API_TOKEN = 'token-kv';

      const { isRedisConfigured } = await loadRedisModule();

      expect(isRedisConfigured()).toBe(true);
      expect(redisConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://vercel.upstash.io', token: 'token-kv' })
      );
    });

    it('cacheSet aplica o TTL recebido', async () => {
      const { cacheSet } = await loadRedisModule();

      await cacheSet('chave', { valor: 1 }, 45);

      expect(set).toHaveBeenCalledWith('chave', { valor: 1 }, { ex: 45 });
    });

    it('claimOnce usa SET NX e só concede quando o Redis grava', async () => {
      const { claimOnce } = await loadRedisModule();

      set.mockResolvedValueOnce('OK');
      await expect(claimOnce('evento-1', 60)).resolves.toBe(true);
      expect(set).toHaveBeenCalledWith('evento-1', expect.any(Number), { nx: true, ex: 60 });

      set.mockResolvedValueOnce(null);
      await expect(claimOnce('evento-1', 60)).resolves.toBe(false);
    });
  });

  describe('quando o Redis falha em runtime', () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://exemplo.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token-secreto';
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('cacheGet degrada para null em vez de propagar o erro', async () => {
      const { cacheGet } = await loadRedisModule();

      get.mockRejectedValueOnce(new Error('ECONNRESET'));

      await expect(cacheGet('chave')).resolves.toBeNull();
    });

    it('cacheSet engole o erro para não derrubar o request', async () => {
      const { cacheSet } = await loadRedisModule();

      set.mockRejectedValueOnce(new Error('timeout'));

      await expect(cacheSet('chave', 1, 10)).resolves.toBeUndefined();
    });

    it('claimOnce concede a trava quando o Redis está fora, preservando o processamento', async () => {
      const { claimOnce } = await loadRedisModule();

      set.mockRejectedValueOnce(new Error('indisponível'));

      await expect(claimOnce('evento-1', 60)).resolves.toBe(true);
    });
  });
});
