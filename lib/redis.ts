import { Redis } from '@upstash/redis';

// Sem as variáveis, tudo aqui vira no-op e cada chamador cai no caminho que já existia.
// A integração Upstash da Vercel injeta os nomes KV_*; um Redis criado à mão usa UPSTASH_*.
function readCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  return url && token ? { url, token } : null;
}

// O cliente vem com 5 retries e backoff exponencial, e sem teto de tempo por request.
// Num caminho de usuário isso transforma "Redis fora do ar" em vários segundos de espera
// antes do fallback — o oposto da degradação que esta camada promete.
//
// O teto é 2s por medição, não por chute: em regime a ida e volta ficou em ~190ms, mas a
// primeira chamada de um processo frio custou 713ms (TLS + DNS). Um teto de 1s reprovaria
// justamente os cold starts, que é quando o cache mais ajudaria. Estourar não é erro — cai
// no fallback — mas cair à toa desperdiça o cache.
const REQUEST_TIMEOUT_MS = 2000;

let cachedClient: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (cachedClient === undefined) {
    const credentials = readCredentials();

    cachedClient = credentials
      ? new Redis({
          ...credentials,
          retry: { retries: 1, backoff: () => 100 },
          signal: () => AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
      : null;
  }

  return cachedClient;
}

export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

export function resetRedisForTests(): void {
  cachedClient = undefined;
}

// Um Redis indisponível é uma degradação, nunca um erro de request: quem chama recebe
// "não tenho isso em cache" e segue para o banco.
async function tolerate<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    console.error('Redis operation failed, falling back:', err);

    return fallback;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();

  if (!redis) return null;

  return tolerate(() => redis.get<T>(key), null);
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();

  if (!redis) return;

  await tolerate(() => redis.set(key, value, { ex: ttlSeconds }), null);
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis();

  if (!redis) return;

  await tolerate(() => redis.del(key), 0);
}

// SET NX: só o primeiro chamador recebe true dentro da janela do TTL. Sem Redis devolve
// true — quem usa isto para deduplicar precisa continuar processando quando não há trava,
// e não pular o trabalho.
export async function claimOnce(key: string, ttlSeconds: number): Promise<boolean> {
  const redis = getRedis();

  if (!redis) return true;

  const result = await tolerate<'OK' | null>(
    () => redis.set(key, Date.now(), { nx: true, ex: ttlSeconds }) as Promise<'OK' | null>,
    'OK'
  );

  return result === 'OK';
}
