import { vi, describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';

const {
  openAICallMock,
  quotaConstructorMock,
  quotaInstance,
  fetchEditalPdfMock,
  editalExtractMock,
  editalVerifyMock,
} = vi.hoisted(() => {
  const instance = {
    checkAndRecordAutoConfig: vi.fn().mockResolvedValue({ logId: 'log-1' }),
    rollbackQuota: vi.fn().mockResolvedValue(undefined),
  };
  return {
    openAICallMock: vi.fn(),
    quotaConstructorMock: vi.fn().mockImplementation(function () {
      return instance;
    }),
    quotaInstance: instance,
    fetchEditalPdfMock: vi.fn(),
    editalExtractMock: vi.fn(),
    editalVerifyMock: vi.fn(),
  };
});

vi.mock('@/features/services/openAI.service', () => ({
  OpenAIService: class {
    call = openAICallMock;
  },
}));

vi.mock('@/features/services/quota.service', () => ({
  QuotaService: quotaConstructorMock,
}));

vi.mock('next/server', () => ({
  after: vi.fn(),
}));

vi.mock('@/lib/edital-fetch', () => ({
  fetchEditalPdf: fetchEditalPdfMock,
}));

vi.mock('@/features/services/edital-extractor.service', () => ({
  EditalExtractorService: class {
    extract = editalExtractMock;
    verifyIsMainEdital = editalVerifyMock;
  },
}));

import { after } from 'next/server';
import {
  identifyExam,
  locateEdital,
  createAutoConfigJob,
  runAutoConfigJob,
  cancelAutoConfigJob,
} from '@/features/services/auto-config-job.service';

const makeJob = (overrides = {}) => ({
  id: 'job-1',
  userId: 'user-1',
  type: 'certification',
  seedName: 'AWS Certified Solutions Architect – Associate',
  seedKey: 'SAA-C03',
  seedProvider: 'AWS',
  seedBoard: null,
  seedRole: null,
  seedYear: null,
  status: 'queued',
  stage: null,
  resultJson: null,
  errorMessage: null,
  errorType: null,
  usageLogId: 'log-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const BLUEPRINT_JSON = JSON.stringify({
  context: 'Validates AWS solution design skills.',
  sources: ['[AWS Exam Guide](https://aws.amazon.com/certification/)'],
  exam: {
    label: 'AWS Certified Solutions Architect – Associate',
    key: 'SAA-C03',
    provider: 'AWS',
    topics: [{ name: 'Design Secure Architectures', minQuestions: 26, maxQuestions: 34 }],
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  quotaInstance.checkAndRecordAutoConfig.mockResolvedValue({ logId: 'log-1' });
  quotaInstance.rollbackQuota.mockResolvedValue(undefined);
  prismaMock.usageLog.create.mockResolvedValue({ id: 'identify-log-1' } as any);
  prismaMock.usageLogStep.create.mockResolvedValue({} as any);
  prismaMock.usageLog.update.mockResolvedValue({} as any);
  fetchEditalPdfMock.mockReset();
  editalExtractMock.mockReset();
  editalVerifyMock.mockReset();
});

describe('identifyExam', () => {
  it('parses a well-formed matches response and records an identify step under a count:0 log', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        matches: [{ label: 'AWS Certified Solutions Architect – Associate', key: 'SAA-C03', provider: 'AWS' }],
        clarification: null,
      }),
      inputTokens: 50,
      outputTokens: 30,
    });

    const result = await identifyExam('user-1', 'AWS solutions architect', 'certification', 'en');

    expect(result.matches).toEqual([
      {
        label: 'AWS Certified Solutions Architect – Associate',
        key: 'SAA-C03',
        provider: 'AWS',
        examBoard: null,
        role: null,
        roles: [],
        year: null,
      },
    ]);
    expect(result.clarification).toBeNull();

    expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', action: 'auto_config', count: 0 },
    });
    expect(prismaMock.usageLogStep.create).toHaveBeenCalledWith({
      data: {
        usageLogId: 'identify-log-1',
        step: 'identify',
        inputTokens: 50,
        outputTokens: 30,
        durationMs: expect.any(Number),
      },
    });
    expect(prismaMock.usageLog.update).toHaveBeenCalledWith({
      where: { id: 'identify-log-1' },
      data: { totalDurationMs: expect.any(Number) },
    });
  });

  it('caps matches at 5 and drops entries without a label', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        matches: [
          { label: 'A' },
          { label: 'B' },
          { label: 'C' },
          { label: 'D' },
          { label: 'E' },
          { label: 'F' },
          { provider: 'no label' },
        ],
      }),
      inputTokens: 1,
      outputTokens: 1,
    });

    const result = await identifyExam('user-1', 'query', 'certification', 'pt');

    expect(result.matches).toHaveLength(5);
    expect(result.matches.map((m) => m.label)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('returns an empty matches array with a clarification when nothing is found', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ matches: [], clarification: 'Qual certificação você tem em mente?' }),
      inputTokens: 5,
      outputTokens: 5,
    });

    const result = await identifyExam('user-1', 'xyz', 'certification', 'pt');

    expect(result.matches).toEqual([]);
    expect(result.clarification).toBe('Qual certificação você tem em mente?');
  });

  it('finalizes the log and rethrows when the LLM call fails', async () => {
    openAICallMock.mockRejectedValue(new Error('network error'));

    await expect(identifyExam('user-1', 'query', 'certification', 'en')).rejects.toThrow('network error');

    expect(prismaMock.usageLog.update).toHaveBeenCalledWith({
      where: { id: 'identify-log-1' },
      data: { totalDurationMs: expect.any(Number) },
    });
  });

  it('normalizes roles: trims, dedupes case-insensitively, caps at 12', async () => {
    const rawRoles = [
      'Analista Judiciário',
      '  analista judiciário  ',
      'Técnico Judiciário',
      'Role 3',
      'Role 4',
      'Role 5',
      'Role 6',
      'Role 7',
      'Role 8',
      'Role 9',
      'Role 10',
      'Role 11',
      'Role 12',
      'Role 13',
    ];
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        matches: [{ label: 'TRF 2025', examBoard: 'CEBRASPE', roles: rawRoles, role: null }],
        clarification: null,
      }),
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await identifyExam('user-1', 'TRF', 'public_exam', 'pt');

    expect(result.matches[0].roles).toHaveLength(12);
    expect(result.matches[0].roles[0]).toBe('Analista Judiciário');
    expect(result.matches[0].roles[1]).toBe('Técnico Judiciário');
  });

  it('prepends role to roles when role is not already in the array', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        matches: [
          { label: 'TRF 2025', examBoard: 'CEBRASPE', roles: ['Técnico Judiciário'], role: 'Analista Judiciário' },
        ],
        clarification: null,
      }),
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await identifyExam('user-1', 'TRF', 'public_exam', 'pt');

    expect(result.matches[0].roles).toEqual(['Analista Judiciário', 'Técnico Judiciário']);
    expect(result.matches[0].role).toBe('Analista Judiciário');
  });

  it('does not duplicate role when role is already in roles', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        matches: [
          {
            label: 'TRF 2025',
            examBoard: 'CEBRASPE',
            roles: ['Analista Judiciário', 'Técnico Judiciário'],
            role: 'Analista Judiciário',
          },
        ],
        clarification: null,
      }),
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await identifyExam('user-1', 'TRF', 'public_exam', 'pt');

    expect(result.matches[0].roles).toEqual(['Analista Judiciário', 'Técnico Judiciário']);
    expect(result.matches[0].role).toBe('Analista Judiciário');
  });
});

describe('locateEdital', () => {
  const seed = {
    examName: 'Concurso TRF 1ª Região 2025',
    examBoard: 'CEBRASPE',
    editalKey: 'PGJ-001/2025',
    year: 2025,
    role: 'Analista Judiciário',
    language: 'pt' as const,
  };

  it('confirms a candidate in round 1 and returns early — one locate call, one verify call', async () => {
    openAICallMock.mockResolvedValueOnce({
      text: JSON.stringify({
        editais: [
          {
            url: 'https://www.trf1.jus.br/editais/edital-001-2025.pdf',
            editalNumber: 'PGJ-001/2025',
            year: 2025,
            orgao: 'TRF 1ª Região',
            isOfficialDomain: true,
            coversRole: true,
          },
        ],
        targetYearFound: true,
      }),
      inputTokens: 40,
      outputTokens: 20,
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: 'PGJ-001/2025' });

    const result = await locateEdital('user-1', seed);

    expect(result).toEqual({
      editais: [
        {
          url: 'https://www.trf1.jus.br/editais/edital-001-2025.pdf',
          editalNumber: 'PGJ-001/2025',
          year: 2025,
          orgao: 'TRF 1ª Região',
          isOfficialDomain: true,
          coversRole: true,
          documentKind: 'main',
          verification: 'confirmed',
        },
      ],
      targetYearFound: true,
      confirmedFound: true,
    });
    // Confirmed on round 1 — no need for a second locate search.
    expect(openAICallMock).toHaveBeenCalledTimes(1);
    expect(fetchEditalPdfMock).toHaveBeenCalledWith('https://www.trf1.jus.br/editais/edital-001-2025.pdf');
    expect(editalVerifyMock).toHaveBeenCalledWith(
      {},
      { examName: seed.examName, role: seed.role },
      { logId: 'identify-log-1' }
    );
    expect(prismaMock.usageLog.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', action: 'auto_config', count: 0 },
    });
    expect(prismaMock.usageLogStep.create).toHaveBeenCalledWith({
      data: {
        usageLogId: 'identify-log-1',
        step: 'locate',
        inputTokens: 40,
        outputTokens: 20,
        durationMs: expect.any(Number),
      },
    });
  });

  it('drops candidates with a missing or non-http url and caps at 5', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        editais: [
          { url: 'https://a.gov.br/1.pdf' },
          { url: 'https://a.gov.br/2.pdf' },
          { url: 'https://a.gov.br/3.pdf' },
          { url: 'https://a.gov.br/4.pdf' },
          { url: 'https://a.gov.br/5.pdf' },
          { url: 'https://a.gov.br/6.pdf' },
          { editalNumber: 'no url' },
          { url: 'ftp://not-http.gov.br/x.pdf' },
        ],
        targetYearFound: false,
      }),
      inputTokens: 1,
      outputTokens: 1,
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: false, documentType: 'outro', year: null, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    expect(result.editais).toHaveLength(5);
    expect(result.targetYearFound).toBe(false);
    expect(result.confirmedFound).toBe(false);
  });

  it('demotes annex candidates below real editais and tags each with a documentKind', async () => {
    openAICallMock.mockResolvedValueOnce({
      text: JSON.stringify({
        editais: [
          { url: 'https://x.gov.br/quadro-vagas-2025.pdf', year: 2025 },
          { url: 'https://x.gov.br/edital-de-abertura-2025.pdf', year: 2025 },
        ],
        targetYearFound: true,
      }),
      inputTokens: 1,
      outputTokens: 1,
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    // The LLM ranked the quadro de vagas first; the URL classifier free-filters it as an annex
    // (never downloaded), while the real edital gets downloaded, confirmed, and promoted above it.
    expect(result.editais.map((e) => e.url)).toEqual([
      'https://x.gov.br/edital-de-abertura-2025.pdf',
      'https://x.gov.br/quadro-vagas-2025.pdf',
    ]);
    expect(result.editais.map((e) => e.documentKind)).toEqual(['main', 'annex']);
    expect(result.editais.map((e) => e.verification)).toEqual(['confirmed', 'annex']);
    expect(fetchEditalPdfMock).not.toHaveBeenCalledWith('https://x.gov.br/quadro-vagas-2025.pdf');
  });

  it('free-filters a URL-flagged annex without downloading it, and excludes it from the next search round', async () => {
    openAICallMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [{ url: 'https://x.gov.br/quadro-vagas-2025.pdf', year: 2025 }],
          targetYearFound: false,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ editais: [], targetYearFound: false }),
        inputTokens: 1,
        outputTokens: 1,
      });

    const result = await locateEdital('user-1', seed);

    expect(fetchEditalPdfMock).not.toHaveBeenCalled();
    expect(editalVerifyMock).not.toHaveBeenCalled();
    expect(openAICallMock).toHaveBeenCalledTimes(2);
    const secondRoundInput = openAICallMock.mock.calls[1][1] as { excludeUrls: string[] };
    expect(secondRoundInput.excludeUrls).toEqual(['https://x.gov.br/quadro-vagas-2025.pdf']);
    expect(result.confirmedFound).toBe(false);
  });

  it('marks a candidate unreadable when the PDF download fails, without failing the round', async () => {
    openAICallMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [{ url: 'https://x.gov.br/edital-de-abertura-2025.pdf', year: 2025 }],
          targetYearFound: true,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ editais: [], targetYearFound: false }),
        inputTokens: 1,
        outputTokens: 1,
      });
    fetchEditalPdfMock.mockRejectedValue(new Error('refused: private address'));

    const result = await locateEdital('user-1', seed);

    expect(editalVerifyMock).not.toHaveBeenCalled();
    expect(result.confirmedFound).toBe(false);
    expect(result.editais).toEqual([
      expect.objectContaining({
        url: 'https://x.gov.br/edital-de-abertura-2025.pdf',
        verification: 'unreadable',
      }),
    ]);
  });

  it('probes at most 3 candidates per round and keeps the rest unchecked ahead of confirmed annexes', async () => {
    openAICallMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [
            { url: 'https://x.gov.br/doc-a.pdf' },
            { url: 'https://x.gov.br/doc-b.pdf' },
            { url: 'https://x.gov.br/doc-c.pdf' },
            { url: 'https://x.gov.br/doc-d.pdf' },
          ],
          targetYearFound: false,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      // Round 2's search itself fails — the loop stops instead of failing the whole call,
      // leaving doc-d exactly as round 1 left it: never probed.
      .mockRejectedValueOnce(new Error('search timed out'));
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: false, documentType: 'quadro_vagas', year: null, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    expect(editalVerifyMock).toHaveBeenCalledTimes(3);
    expect(result.confirmedFound).toBe(false);
    expect(result.editais.map((e) => ({ url: e.url, verification: e.verification }))).toEqual([
      { url: 'https://x.gov.br/doc-d.pdf', verification: 'unchecked' },
      { url: 'https://x.gov.br/doc-a.pdf', verification: 'annex' },
      { url: 'https://x.gov.br/doc-b.pdf', verification: 'annex' },
      { url: 'https://x.gov.br/doc-c.pdf', verification: 'annex' },
    ]);
  });

  it("corrects a confirmed candidate's year/editalNumber from the verify step's reading of the PDF (not the locate step's guess), and keeps searching in round 2 when it is not the target year", async () => {
    openAICallMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [
            // The locate step's own metadata guess is wrong — it believes this is the target year.
            {
              url: 'https://x.gov.br/edital-antigo.pdf',
              editalNumber: 'PGJ-001/2025',
              year: 2025,
              orgao: 'TRF 1ª Região',
            },
          ],
          targetYearFound: true,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [{ url: 'https://x.gov.br/edital-2025.pdf', year: 2025 }],
          targetYearFound: true,
        }),
        inputTokens: 1,
        outputTokens: 1,
      });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock
      // Round 1: a genuine edital, but the document itself is from 2008 — the verify step's
      // reading of the actual PDF overrides the locate step's (wrong) year/number guess.
      .mockResolvedValueOnce({ isMainEdital: true, documentType: 'edital', year: 2008, editalNumber: 'PGJ-014/2008' })
      // Round 2: the genuine target-year edital.
      .mockResolvedValueOnce({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: 'PGJ-001/2025' });

    const result = await locateEdital('user-1', seed);

    // A confirmed-but-wrong-year candidate does not stop the search — round 2 still runs.
    expect(openAICallMock).toHaveBeenCalledTimes(2);
    const secondRoundInput = openAICallMock.mock.calls[1][1] as { excludeUrls: string[] };
    expect(secondRoundInput.excludeUrls).toEqual(['https://x.gov.br/edital-antigo.pdf']);

    expect(result.confirmedFound).toBe(true);
    expect(result.targetYearFound).toBe(true);
    // The genuine target-year edital leads, even though it was found in round 2; the stale one
    // is still listed — with its year/number corrected — as a usable prior-year fallback.
    expect(result.editais).toEqual([
      expect.objectContaining({ url: 'https://x.gov.br/edital-2025.pdf', year: 2025, verification: 'confirmed' }),
      expect.objectContaining({
        url: 'https://x.gov.br/edital-antigo.pdf',
        year: 2008,
        editalNumber: 'PGJ-014/2008',
        verification: 'confirmed',
      }),
    ]);
  });

  it('accepts an empty role string (locate runs before cargo is chosen)', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [], targetYearFound: false }),
      inputTokens: 5,
      outputTokens: 5,
    });

    const result = await locateEdital('user-1', { ...seed, role: '' });

    expect(result).toEqual({ editais: [], targetYearFound: false, confirmedFound: false });
  });

  it('returns an empty result when nothing is found', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [], targetYearFound: false }),
      inputTokens: 5,
      outputTokens: 5,
    });

    const result = await locateEdital('user-1', seed);

    expect(result).toEqual({ editais: [], targetYearFound: false, confirmedFound: false });
  });

  it('finalizes the log and rethrows when the first round LLM call fails', async () => {
    openAICallMock.mockRejectedValue(new Error('network error'));

    await expect(locateEdital('user-1', seed)).rejects.toThrow('network error');

    expect(prismaMock.usageLog.update).toHaveBeenCalledWith({
      where: { id: 'identify-log-1' },
      data: { totalDurationMs: expect.any(Number) },
    });
  });
});
describe('createAutoConfigJob', () => {
  it('rejects when the user already has a job in progress', async () => {
    prismaMock.autoConfigJob.findFirst.mockResolvedValue(makeJob({ status: 'running' }) as any);

    await expect(
      createAutoConfigJob('user-1', { type: 'certification', name: 'AWS SAA', language: 'en' })
    ).rejects.toMatchObject({ status: 409 });

    expect(quotaInstance.checkAndRecordAutoConfig).not.toHaveBeenCalled();
  });

  it('charges one auto_config unit, creates the job, and dispatches the pipeline via after()', async () => {
    prismaMock.autoConfigJob.findFirst.mockResolvedValue(null);
    prismaMock.autoConfigJob.create.mockResolvedValue(makeJob() as any);

    const result = await createAutoConfigJob('user-1', {
      type: 'certification',
      name: 'AWS Certified Solutions Architect – Associate',
      key: 'SAA-C03',
      provider: 'AWS',
      language: 'en',
    });

    expect(result).toEqual({ jobId: 'job-1' });
    expect(quotaInstance.checkAndRecordAutoConfig).toHaveBeenCalledWith('user-1');
    expect(prismaMock.autoConfigJob.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'certification',
        seedName: 'AWS Certified Solutions Architect – Associate',
        seedKey: 'SAA-C03',
        seedProvider: 'AWS',
        seedBoard: null,
        seedRole: null,
        seedYear: null,
        usageLogId: 'log-1',
      },
    });
    expect(after).toHaveBeenCalledTimes(1);
  });
});

describe('runAutoConfigJob', () => {
  it('runs research → review → format with the right webSearch/jsonMode/model options and records one step each', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(makeJob() as any) // initial load
      .mockResolvedValueOnce({ status: 'running' } as any); // cancel-race check before final write
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    openAICallMock
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 100, outputTokens: 50 })
      .mockResolvedValueOnce({
        text: 'EXAM\nname: X\n---\nSECTION\nname: A (reviewed)',
        inputTokens: 60,
        outputTokens: 40,
      })
      .mockResolvedValueOnce({ text: BLUEPRINT_JSON, inputTokens: 30, outputTokens: 200 });

    await runAutoConfigJob('job-1', 'en');

    expect(openAICallMock).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), { webSearch: true });
    expect(openAICallMock).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), {
      webSearch: false,
      model: expect.any(String),
    });
    expect(openAICallMock).toHaveBeenNthCalledWith(3, expect.anything(), expect.anything(), {
      webSearch: false,
      jsonMode: true,
    });

    expect(prismaMock.usageLogStep.create).toHaveBeenCalledTimes(3);
    const steps = prismaMock.usageLogStep.create.mock.calls.map((c) => (c[0] as any).data.step);
    expect(steps).toEqual(['config_research', 'config_review', 'config_format']);

    expect(prismaMock.autoConfigJob.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: 'done', stage: null, resultJson: expect.any(String) },
    });
  });

  it('rolls back quota and marks the job as error when a stage throws', async () => {
    prismaMock.autoConfigJob.findUnique.mockResolvedValue(makeJob() as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    openAICallMock.mockRejectedValue(Object.assign(new Error('quota exceeded'), {}));

    await runAutoConfigJob('job-1', 'en');

    expect(quotaInstance.rollbackQuota).toHaveBeenCalledWith('log-1');
    expect(prismaMock.autoConfigJob.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: 'error', errorMessage: expect.any(String), errorType: expect.any(String) },
    });
  });

  it('does not overwrite a cancelled job with error when a stage throws after cancellation', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(makeJob() as any) // initial load
      .mockResolvedValueOnce({ status: 'cancelled' } as any); // wasCancelled check in the catch block
    openAICallMock.mockRejectedValue(new Error('boom'));

    await runAutoConfigJob('job-1', 'en');

    expect(quotaInstance.rollbackQuota).not.toHaveBeenCalled();
    expect(prismaMock.autoConfigJob.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'error' }) })
    );
  });

  it('does not overwrite a cancelled job with done', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(makeJob() as any)
      .mockResolvedValueOnce({ status: 'cancelled' } as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    openAICallMock
      .mockResolvedValueOnce({ text: 'draft', inputTokens: 1, outputTokens: 1 })
      .mockResolvedValueOnce({ text: 'reviewed', inputTokens: 1, outputTokens: 1 })
      .mockResolvedValueOnce({ text: BLUEPRINT_JSON, inputTokens: 1, outputTokens: 1 });

    await runAutoConfigJob('job-1', 'en');

    expect(prismaMock.autoConfigJob.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'done' }) })
    );
  });

  it('returns without doing anything when the job has no usageLogId', async () => {
    prismaMock.autoConfigJob.findUnique.mockResolvedValue(makeJob({ usageLogId: null }) as any);

    await runAutoConfigJob('job-1', 'en');

    expect(openAICallMock).not.toHaveBeenCalled();
  });
});

describe('runAutoConfigJob — public_exam edital PDF branch', () => {
  const publicExamJob = () =>
    makeJob({
      type: 'public_exam',
      seedName: 'Concurso TRF 1ª Região 2025',
      seedKey: 'PGJ-001/2025',
      seedProvider: null,
      seedBoard: 'CEBRASPE',
      seedRole: 'Analista Judiciário',
      seedYear: 2025,
    });

  const EXTRACTED_EXAM = {
    type: 'public_exam',
    name: 'Concurso TRF 1ª Região 2025',
    key: 'PGJ-001/2025',
    role: 'Analista Judiciário',
    year: 2025,
    totalQuestions: 100,
    examDurationMinutes: 240,
    passingScore: 50,
    examBoard: { name: 'CEBRASPE', fullName: null },
    sections: [
      { name: 'Língua Portuguesa', minQuestions: 20, maxQuestions: 20, topics: [{ name: 'Interpretação de texto' }] },
    ],
  };

  it('reads the PDF and skips research/review/format when the target-year edital is found', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(publicExamJob() as any)
      .mockResolvedValueOnce({ status: 'running' } as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalExtractMock.mockResolvedValue(EXTRACTED_EXAM);

    await runAutoConfigJob('job-1', 'pt', {
      url: 'https://www.trf1.jus.br/editais/edital-001-2025.pdf',
      isPriorYear: false,
    });

    expect(fetchEditalPdfMock).toHaveBeenCalledWith('https://www.trf1.jus.br/editais/edital-001-2025.pdf');
    expect(editalExtractMock).toHaveBeenCalledWith('user-1', {}, 'Analista Judiciário', { logId: 'log-1' });
    expect(openAICallMock).not.toHaveBeenCalled();

    expect(prismaMock.autoConfigJob.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { stage: 'extract', status: 'running' },
    });

    const doneCall = prismaMock.autoConfigJob.update.mock.calls.find((c) => (c[0] as any).data.status === 'done');
    expect(doneCall).toBeDefined();
    const resultJson = JSON.parse((doneCall![0] as any).data.resultJson);
    expect(resultJson.confidence).toBe('official');
    expect(resultJson.examDraft.name).toBe('Concurso TRF 1ª Região 2025');
  });

  it('marks confidence as prior-year when the located edital is not the target year', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(publicExamJob() as any)
      .mockResolvedValueOnce({ status: 'running' } as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalExtractMock.mockResolvedValue(EXTRACTED_EXAM);

    await runAutoConfigJob('job-1', 'pt', {
      url: 'https://www.trf1.jus.br/editais/edital-002-2021.pdf',
      isPriorYear: true,
    });

    const doneCall = prismaMock.autoConfigJob.update.mock.calls.find((c) => (c[0] as any).data.status === 'done');
    const resultJson = JSON.parse((doneCall![0] as any).data.resultJson);
    expect(resultJson.confidence).toBe('prior-year');
  });

  it('falls back to research/review/format when the PDF download fails, marking the result estimated', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(publicExamJob() as any)
      .mockResolvedValueOnce({ status: 'running' } as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    fetchEditalPdfMock.mockRejectedValue(new Error('refused: private address'));
    openAICallMock
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 10, outputTokens: 10 })
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 10, outputTokens: 10 })
      .mockResolvedValueOnce({ text: BLUEPRINT_JSON, inputTokens: 10, outputTokens: 10 });

    await runAutoConfigJob('job-1', 'pt', {
      url: 'https://www.trf1.jus.br/editais/edital-001-2025.pdf',
      isPriorYear: false,
    });

    expect(editalExtractMock).not.toHaveBeenCalled();
    expect(openAICallMock).toHaveBeenCalledTimes(3);

    const extractStep = prismaMock.usageLogStep.create.mock.calls.find((c) => (c[0] as any).data.step === 'extract');
    expect(extractStep).toBeDefined();
    expect((extractStep![0] as any).data.inputTokens).toBe(0);

    const doneCall = prismaMock.autoConfigJob.update.mock.calls.find((c) => (c[0] as any).data.status === 'done');
    const resultJson = JSON.parse((doneCall![0] as any).data.resultJson);
    expect(resultJson.confidence).toBe('estimated');
  });

  it('falls back to research/review/format when the located PDF has no conteúdo programático (an annex like a quadro de vagas)', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(publicExamJob() as any)
      .mockResolvedValueOnce({ status: 'running' } as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    fetchEditalPdfMock.mockResolvedValue({} as any);
    // A quadro de vagas extracts cleanly but every section is topic-less.
    editalExtractMock.mockResolvedValue({
      ...EXTRACTED_EXAM,
      sections: [{ name: 'Quadro de Vagas', minQuestions: 0, maxQuestions: 0, topics: [] }],
    });
    openAICallMock
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 10, outputTokens: 10 })
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 10, outputTokens: 10 })
      .mockResolvedValueOnce({ text: BLUEPRINT_JSON, inputTokens: 10, outputTokens: 10 });

    await runAutoConfigJob('job-1', 'pt', {
      url: 'https://www.trf1.jus.br/editais/quadro-vagas-001-2025.pdf',
      isPriorYear: false,
    });

    // Extraction was attempted, but its empty result was rejected → text pipeline ran instead.
    expect(editalExtractMock).toHaveBeenCalledTimes(1);
    expect(openAICallMock).toHaveBeenCalledTimes(3);

    const extractStep = prismaMock.usageLogStep.create.mock.calls.find((c) => (c[0] as any).data.step === 'extract');
    expect(extractStep).toBeDefined();

    const doneCall = prismaMock.autoConfigJob.update.mock.calls.find((c) => (c[0] as any).data.status === 'done');
    const resultJson = JSON.parse((doneCall![0] as any).data.resultJson);
    expect(resultJson.confidence).toBe('estimated');
  });

  it('runs the research/review/format text pipeline as before when no edital was located', async () => {
    prismaMock.autoConfigJob.findUnique
      .mockResolvedValueOnce(publicExamJob() as any)
      .mockResolvedValueOnce({ status: 'running' } as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);
    openAICallMock
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 10, outputTokens: 10 })
      .mockResolvedValueOnce({ text: 'EXAM\nname: X\n---\nSECTION\nname: A', inputTokens: 10, outputTokens: 10 })
      .mockResolvedValueOnce({ text: BLUEPRINT_JSON, inputTokens: 10, outputTokens: 10 });

    await runAutoConfigJob('job-1', 'pt', null);

    expect(fetchEditalPdfMock).not.toHaveBeenCalled();
    expect(editalExtractMock).not.toHaveBeenCalled();
    expect(openAICallMock).toHaveBeenCalledTimes(3);
  });
});

describe('cancelAutoConfigJob', () => {
  it('throws 404 when the job does not belong to the user', async () => {
    prismaMock.autoConfigJob.findFirst.mockResolvedValue(null);

    await expect(cancelAutoConfigJob('job-1', 'user-1')).rejects.toMatchObject({ status: 404 });
  });

  it('throws 409 when the job already finished', async () => {
    prismaMock.autoConfigJob.findFirst.mockResolvedValue(makeJob({ status: 'done' }) as any);

    await expect(cancelAutoConfigJob('job-1', 'user-1')).rejects.toMatchObject({ status: 409 });
  });

  it('rolls back quota and marks the job cancelled', async () => {
    prismaMock.autoConfigJob.findFirst.mockResolvedValue(makeJob({ status: 'running' }) as any);
    prismaMock.autoConfigJob.update.mockResolvedValue({} as any);

    await cancelAutoConfigJob('job-1', 'user-1');

    expect(quotaInstance.rollbackQuota).toHaveBeenCalledWith('log-1');
    expect(prismaMock.autoConfigJob.update).toHaveBeenCalledWith({
      where: { id: 'job-1' },
      data: { status: 'cancelled', stage: null },
    });
  });
});
