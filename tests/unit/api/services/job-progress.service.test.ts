import { beforeEach, vi } from 'vitest';

import { prismaMock } from '../__mocks__/prisma';
import {
  readGenerationProgress,
  publishGenerationProgress,
  readAutoConfigProgress,
  publishAutoConfigProgress,
  JOB_SNAPSHOT_TTL_SECONDS,
} from '@/features/services/job-progress.service';

const cacheGet = vi.fn();
const cacheSet = vi.fn();
const isRedisConfigured = vi.fn();

vi.mock('@/lib/redis', () => ({
  cacheGet: (...args: unknown[]) => cacheGet(...args),
  cacheSet: (...args: unknown[]) => cacheSet(...args),
  isRedisConfigured: () => isRedisConfigured(),
}));


const DB_JOB = {
  status: 'running',
  savedCount: 3,
  topics: [
    {
      id: 't1',
      topicName: 'Redes',
      questionCount: 5,
      status: 'done',
      savedCount: 3,
      errorMessage: null,
      errorType: null,
    },
  ],
};

describe('job-progress.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheGet.mockResolvedValue(null);
    cacheSet.mockResolvedValue(undefined);
    isRedisConfigured.mockReturnValue(true);
  });

  describe('leitura do progresso de geração', () => {
    it('serve o snapshot do cache sem tocar no Postgres', async () => {
      cacheGet.mockResolvedValueOnce(DB_JOB);

      const result = await readGenerationProgress('job-1');

      expect(result).toEqual(DB_JOB);
      expect(prismaMock.generationJob.findUnique).not.toHaveBeenCalled();
    });

    // Esta é a propriedade que sustenta o desenho: um publish perdido, um Redis fora do ar
    // ou um TTL expirado degradam para o comportamento anterior, nunca para dado errado.
    it('cai no Postgres quando o cache não tem o job', async () => {
      cacheGet.mockResolvedValueOnce(null);
      prismaMock.generationJob.findUnique.mockResolvedValue(DB_JOB as never);

      const result = await readGenerationProgress('job-1');

      expect(result).toEqual(DB_JOB);
      expect(prismaMock.generationJob.findUnique).toHaveBeenCalledTimes(1);
    });

    it('repovoa o cache depois de ler do banco, para o próximo poll não repetir a query', async () => {
      cacheGet.mockResolvedValueOnce(null);
      prismaMock.generationJob.findUnique.mockResolvedValue(DB_JOB as never);

      await readGenerationProgress('job-1');

      expect(cacheSet).toHaveBeenCalledWith('job:generation:job-1', DB_JOB, JOB_SNAPSHOT_TTL_SECONDS);
    });

    it('devolve null e não cacheia quando o job não existe', async () => {
      cacheGet.mockResolvedValueOnce(null);
      prismaMock.generationJob.findUnique.mockResolvedValue(null as never);

      await expect(readGenerationProgress('sumiu')).resolves.toBeNull();
      expect(cacheSet).not.toHaveBeenCalled();
    });
  });

  describe('publicação do progresso de geração', () => {
    it('publica o estado atual sob a chave do job', async () => {
      prismaMock.generationJob.findUnique.mockResolvedValue(DB_JOB as never);

      await publishGenerationProgress('job-1');

      expect(cacheSet).toHaveBeenCalledWith('job:generation:job-1', DB_JOB, JOB_SNAPSHOT_TTL_SECONDS);
    });

    // Sem Redis o publish não teria destino; pagar a query mesmo assim seria custo puro
    // no worker, que é justamente o caminho que esta mudança tenta não onerar.
    it('não consulta o banco quando não há Redis configurado', async () => {
      isRedisConfigured.mockReturnValue(false);

      await publishGenerationProgress('job-1');

      expect(prismaMock.generationJob.findUnique).not.toHaveBeenCalled();
      expect(cacheSet).not.toHaveBeenCalled();
    });
  });

  describe('auto-config', () => {
    const DB_AUTO = {
      status: 'running',
      stage: 'research',
      errorMessage: null,
      errorType: null,
      resultJson: null,
    };

    it('usa uma chave própria, separada da de geração', async () => {
      prismaMock.autoConfigJob.findUnique.mockResolvedValue(DB_AUTO as never);

      await publishAutoConfigProgress('job-9');

      expect(cacheSet).toHaveBeenCalledWith('job:auto-config:job-9', DB_AUTO, JOB_SNAPSHOT_TTL_SECONDS);
    });

    it('cai no Postgres quando o cache não tem o job', async () => {
      cacheGet.mockResolvedValueOnce(null);
      prismaMock.autoConfigJob.findUnique.mockResolvedValue(DB_AUTO as never);

      await expect(readAutoConfigProgress('job-9')).resolves.toEqual(DB_AUTO);
      expect(prismaMock.autoConfigJob.findUnique).toHaveBeenCalledTimes(1);
    });

    it('não consulta o banco para publicar sem Redis', async () => {
      isRedisConfigured.mockReturnValue(false);

      await publishAutoConfigProgress('job-9');

      expect(prismaMock.autoConfigJob.findUnique).not.toHaveBeenCalled();
    });
  });
});
