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

  it('passes OPENAI_MODEL_IDENTIFY as the model option when set', async () => {
    const saved = process.env.OPENAI_MODEL_IDENTIFY;
    process.env.OPENAI_MODEL_IDENTIFY = 'gpt-identify-model';
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ matches: [], clarification: 'x' }),
      inputTokens: 1,
      outputTokens: 1,
    });

    try {
      await identifyExam('user-1', 'query', 'certification', 'en');
    } finally {
      if (saved === undefined) delete process.env.OPENAI_MODEL_IDENTIFY;
      else process.env.OPENAI_MODEL_IDENTIFY = saved;
    }

    const options = openAICallMock.mock.calls[0][2] as { model?: string };
    expect(options.model).toBe('gpt-identify-model');
  });

  it('falls back to OPENAI_MODEL when OPENAI_MODEL_IDENTIFY is unset', async () => {
    const savedIdentify = process.env.OPENAI_MODEL_IDENTIFY;
    const savedDefault = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL_IDENTIFY;
    process.env.OPENAI_MODEL = 'gpt-default-model';
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ matches: [], clarification: 'x' }),
      inputTokens: 1,
      outputTokens: 1,
    });

    try {
      await identifyExam('user-1', 'query', 'certification', 'en');
    } finally {
      if (savedIdentify === undefined) delete process.env.OPENAI_MODEL_IDENTIFY;
      else process.env.OPENAI_MODEL_IDENTIFY = savedIdentify;
      if (savedDefault === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = savedDefault;
    }

    const options = openAICallMock.mock.calls[0][2] as { model?: string };
    expect(options.model).toBe('gpt-default-model');
  });

  it('threads user-provided hints into the identify prompt', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ matches: [{ label: 'TRF 1ª Região 2026' }], clarification: null }),
      inputTokens: 1,
      outputTokens: 1,
    });

    await identifyExam('user-1', 'TRF', 'public_exam', 'pt', {
      examBoard: 'FCC',
      role: 'Analista Judiciário',
      edital: '1/2026',
    });

    const [promptArg, inputArg] = openAICallMock.mock.calls[0] as [
      { build: (input: unknown) => string },
      unknown,
    ];
    const builtPrompt = promptArg.build(inputArg);

    expect(builtPrompt).toContain('- Banca organizadora: FCC');
    expect(builtPrompt).toContain('- Cargo: Analista Judiciário');
    expect(builtPrompt).toContain('- Edital: 1/2026');
  });

  it('builds the identify prompt without a hints section when no hints are given', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ matches: [{ label: 'AWS' }], clarification: null }),
      inputTokens: 1,
      outputTokens: 1,
    });

    await identifyExam('user-1', 'AWS', 'certification', 'en');

    const [promptArg, inputArg] = openAICallMock.mock.calls[0] as [
      { build: (input: unknown) => string },
      unknown,
    ];

    expect(promptArg.build(inputArg)).not.toContain('USER-PROVIDED HINTS');
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
          domainClass: 'official-org',
          verification: 'confirmed',
        },
      ],
      targetYearFound: true,
      confirmedFound: true,
    });
    // Confirmed on round 1 — the scoped-to-CEBRASPE attempt already found it, so no
    // unrestricted fallback and no second locate search were needed.
    expect(openAICallMock).toHaveBeenCalledTimes(1);
    // Round 1 is scoped to the banca's own domain (resolved from examBoard) and asks for a
    // high-context search plus the full list of consulted sources.
    const [, , options] = openAICallMock.mock.calls[0] as [unknown, unknown, Record<string, unknown>];
    expect(options.allowedDomains).toEqual(['cebraspe.org.br']);
    expect(options.searchContextSize).toBe('high');
    expect(options.includeSources).toBe(true);
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

  it('does not scope the search to a domain filter when the banca is unrecognized', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [], targetYearFound: false }),
      inputTokens: 1,
      outputTokens: 1,
    });

    await locateEdital('user-1', { ...seed, examBoard: 'Banca Desconhecida XYZ' });

    // No banca domain resolved — round 1 never attempts a domain-scoped search (and so never
    // triggers the empty-result fallback either). Every call actually made — round 1's single
    // attempt, plus round 2 since nothing was ever found — goes out unrestricted.
    for (const call of openAICallMock.mock.calls) {
      const options = call[2] as Record<string, unknown>;
      expect(options.allowedDomains).toEqual([]);
    }
    expect(openAICallMock.mock.calls.length).toBeGreaterThan(0);
  });

  it('falls back to an unrestricted search within round 1 when the domain-scoped attempt finds nothing', async () => {
    openAICallMock
      // Scoped to cebraspe.org.br — finds nothing there.
      .mockResolvedValueOnce({
        text: JSON.stringify({ editais: [], targetYearFound: false }),
        inputTokens: 1,
        outputTokens: 1,
      })
      // Unrestricted retry, same round — the edital was mirrored elsewhere.
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [{ url: 'https://www.trf1.jus.br/editais/edital-001-2025.pdf', year: 2025 }],
          targetYearFound: true,
        }),
        inputTokens: 1,
        outputTokens: 1,
      });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    expect(openAICallMock).toHaveBeenCalledTimes(2);
    const [, , firstOptions] = openAICallMock.mock.calls[0] as [unknown, unknown, Record<string, unknown>];
    const [, , secondOptions] = openAICallMock.mock.calls[1] as [unknown, unknown, Record<string, unknown>];
    expect(firstOptions.allowedDomains).toEqual(['cebraspe.org.br']);
    expect(secondOptions.allowedDomains).toEqual([]);
    // The fallback call is still round 1 — excludeUrls carries nothing yet, unlike round 2.
    const secondRoundInput = openAICallMock.mock.calls[1][1] as { excludeUrls: string[] };
    expect(secondRoundInput.excludeUrls).toEqual([]);
    expect(result.confirmedFound).toBe(true);
    expect(result.editais[0].url).toBe('https://www.trf1.jus.br/editais/edital-001-2025.pdf');
  });

  it('drops candidates with a missing or non-http url and caps at 5', async () => {
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({
        editais: [
          { url: 'https://a.gov.br/1.pdf', year: 2024 },
          { url: 'https://a.gov.br/2.pdf', year: 2024 },
          { url: 'https://a.gov.br/3.pdf', year: 2024 },
          { url: 'https://a.gov.br/4.pdf', year: 2024 },
          { url: 'https://a.gov.br/5.pdf', year: 2024 },
          { url: 'https://a.gov.br/6.pdf', year: 2024 },
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

  it('downloads and verifies a URL-flagged annex candidate too when the round has verify budget for it, ranking a confirmed real edital above it', async () => {
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
    fetchEditalPdfMock.mockImplementation(async (url: string) => ({ sourceUrl: url }) as any);
    editalVerifyMock.mockImplementation(async (file: { sourceUrl: string }) =>
      file.sourceUrl.includes('quadro-vagas')
        ? { isMainEdital: false, documentType: 'quadro_vagas', year: null, editalNumber: null }
        : { isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: null }
    );

    const result = await locateEdital('user-1', seed);

    // Both candidates fit within the round's verify budget (2 ≤ MAX_VERIFY_PER_ROUND), so the
    // URL-flagged annex is opened and verified rather than free-rejected — its 'annex' outcome
    // here comes from the (fake) verify call actually saying so, not from the URL guess alone.
    expect(fetchEditalPdfMock).toHaveBeenCalledWith('https://x.gov.br/quadro-vagas-2025.pdf');
    expect(fetchEditalPdfMock).toHaveBeenCalledWith('https://x.gov.br/edital-de-abertura-2025.pdf');
    expect(result.editais.map((e) => e.url)).toEqual([
      'https://x.gov.br/edital-de-abertura-2025.pdf',
      'https://x.gov.br/quadro-vagas-2025.pdf',
    ]);
    expect(result.editais.map((e) => e.documentKind)).toEqual(['main', 'annex']);
    expect(result.editais.map((e) => e.verification)).toEqual(['confirmed', 'annex']);
  });

  it('confirms a URL-flagged annex candidate as the real edital when the verify step says so — the consolidated retificação case', async () => {
    // Regression for the Transpetro bug this refactor fixes: a consolidated retificação
    // ("_ret2") republishing the edital in full is exactly the kind of URL the classifier
    // flags as an annex on filename alone. It must still end up confirmed once opened.
    openAICallMock.mockResolvedValueOnce({
      text: JSON.stringify({
        editais: [
          {
            url: 'https://transpetro.com.br/x/Edital%20042026%20PSP%20TERRA%20-Transpetro_ret2.pdf',
            year: 2025,
          },
        ],
        targetYearFound: true,
      }),
      inputTokens: 1,
      outputTokens: 1,
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: '004/2026' });

    const result = await locateEdital('user-1', seed);

    expect(fetchEditalPdfMock).toHaveBeenCalledWith(
      'https://transpetro.com.br/x/Edital%20042026%20PSP%20TERRA%20-Transpetro_ret2.pdf'
    );
    expect(result.confirmedFound).toBe(true);
    expect(result.editais[0]).toEqual(
      expect.objectContaining({
        url: 'https://transpetro.com.br/x/Edital%20042026%20PSP%20TERRA%20-Transpetro_ret2.pdf',
        verification: 'confirmed',
        editalNumber: '004/2026',
      })
    );
  });

  it('opens and verifies a URL-flagged annex candidate, excluding it from the next round only after verify confirms it is not the edital', async () => {
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
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: false, documentType: 'quadro_vagas', year: null, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    // It WAS downloaded and read this time — that's what makes the exclusion trustworthy.
    expect(fetchEditalPdfMock).toHaveBeenCalledWith('https://x.gov.br/quadro-vagas-2025.pdf');
    expect(editalVerifyMock).toHaveBeenCalledTimes(1);
    const secondRoundInput = openAICallMock.mock.calls[1][1] as { excludeUrls: string[] };
    expect(secondRoundInput.excludeUrls).toEqual(['https://x.gov.br/quadro-vagas-2025.pdf']);
    expect(result.confirmedFound).toBe(false);
  });

  it('harvests a .pdf URL from the search sources even when the model did not return it in editais', async () => {
    openAICallMock.mockResolvedValueOnce({
      text: JSON.stringify({
        editais: [{ url: 'https://x.gov.br/edital-de-abertura-2025.pdf', year: 2025 }],
        targetYearFound: true,
      }),
      inputTokens: 1,
      outputTokens: 1,
      sources: [
        'https://x.gov.br/edital-de-abertura-2025.pdf',
        'https://mirror.example.com/edital-transpetro-2026.pdf',
        'https://x.gov.br/pagina-institucional.htm',
      ],
    });
    fetchEditalPdfMock.mockImplementation(async (url: string) => ({ sourceUrl: url }) as any);
    // Both mirrors carry the same edital — a harvested source-only candidate is not left
    // unchecked when there's budget to verify it too, it just ranks behind the official domain.
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    expect(fetchEditalPdfMock).toHaveBeenCalledWith('https://mirror.example.com/edital-transpetro-2026.pdf');
    const harvested = result.editais.find((e) => e.url === 'https://mirror.example.com/edital-transpetro-2026.pdf');
    expect(harvested).toBeDefined();
    expect(harvested?.verification).toBe('confirmed');
    expect(harvested?.domainClass).toBe('other');
    // The official x.gov.br domain still leads over the aggregator/other mirror of the
    // same confirmed, same-year edital.
    expect(result.editais[0].url).toBe('https://x.gov.br/edital-de-abertura-2025.pdf');
    // The non-.pdf source (an institutional page, not a document) is not turned into a candidate.
    expect(result.editais.some((e) => e.url === 'https://x.gov.br/pagina-institucional.htm')).toBe(false);
  });

  it('ranks a confirmed candidate on an official domain above a confirmed aggregator mirror of the same year', async () => {
    openAICallMock.mockResolvedValueOnce({
      text: JSON.stringify({
        editais: [
          { url: 'https://qconcursos.com/edital-2025.pdf', year: 2025 },
          { url: 'https://x.gov.br/edital-2025.pdf', year: 2025 },
        ],
        targetYearFound: true,
      }),
      inputTokens: 1,
      outputTokens: 1,
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    expect(result.editais.map((e) => e.url)).toEqual([
      'https://x.gov.br/edital-2025.pdf',
      'https://qconcursos.com/edital-2025.pdf',
    ]);
    expect(result.editais.map((e) => e.domainClass)).toEqual(['official-org', 'aggregator']);
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
            { url: 'https://x.gov.br/doc-a.pdf', year: 2019 },
            { url: 'https://x.gov.br/doc-b.pdf', year: 2019 },
            { url: 'https://x.gov.br/doc-c.pdf', year: 2019 },
            { url: 'https://x.gov.br/doc-d.pdf', year: 2019 },
          ],
          targetYearFound: false,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      // None of round 1's candidates is dated to the target year, so it widens to an
      // unrestricted attempt before any download happens.
      .mockResolvedValueOnce({
        text: JSON.stringify({ editais: [], targetYearFound: false }),
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

  it('drops an unverified candidate that carries no edital number, year or órgão to show', async () => {
    openAICallMock.mockResolvedValueOnce({
      text: JSON.stringify({
        editais: [
          { url: 'https://x.gov.br/a.pdf', editalNumber: 'E-1/2025', year: 2025, orgao: 'TRF 1ª Região' },
          { url: 'https://x.gov.br/b.pdf', editalNumber: 'E-2/2025', year: 2025, orgao: 'TRF 1ª Região' },
          { url: 'https://x.gov.br/c.pdf', editalNumber: 'E-3/2025', year: 2025, orgao: 'TRF 1ª Região' },
        ],
        targetYearFound: true,
      }),
      inputTokens: 1,
      outputTokens: 1,
      sources: ['https://mirror.example.com/harvested-no-label.pdf'],
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({ isMainEdital: true, documentType: 'edital', year: 2025, editalNumber: null });

    const result = await locateEdital('user-1', seed);

    // The 3 labelled editais use up the round's verify budget, so the harvested source-only
    // URL is never probed — it stays unchecked with nothing to display, and must be dropped.
    expect(result.editais.map((e) => e.url)).toEqual([
      'https://x.gov.br/a.pdf',
      'https://x.gov.br/b.pdf',
      'https://x.gov.br/c.pdf',
    ]);
  });

  it('finalizes the log and rethrows when the first round LLM call fails', async () => {
    openAICallMock.mockRejectedValue(new Error('network error'));

    await expect(locateEdital('user-1', seed)).rejects.toThrow('network error');

    expect(prismaMock.usageLog.update).toHaveBeenCalledWith({
      where: { id: 'identify-log-1' },
      data: { totalDurationMs: expect.any(Number) },
    });
  });

  it('passes OPENAI_MODEL_LOCATE as the model option when set', async () => {
    const saved = process.env.OPENAI_MODEL_LOCATE;
    process.env.OPENAI_MODEL_LOCATE = 'gpt-locate-model';
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [], targetYearFound: false }),
      inputTokens: 1,
      outputTokens: 1,
    });

    try {
      await locateEdital('user-1', seed);
    } finally {
      if (saved === undefined) delete process.env.OPENAI_MODEL_LOCATE;
      else process.env.OPENAI_MODEL_LOCATE = saved;
    }

    const options = openAICallMock.mock.calls[0][2] as { model?: string };
    expect(options.model).toBe('gpt-locate-model');
  });

  it('falls back to OPENAI_MODEL when OPENAI_MODEL_LOCATE is unset', async () => {
    const savedLocate = process.env.OPENAI_MODEL_LOCATE;
    const savedDefault = process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MODEL_LOCATE;
    process.env.OPENAI_MODEL = 'gpt-default-model';
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [], targetYearFound: false }),
      inputTokens: 1,
      outputTokens: 1,
    });

    try {
      await locateEdital('user-1', seed);
    } finally {
      if (savedLocate === undefined) delete process.env.OPENAI_MODEL_LOCATE;
      else process.env.OPENAI_MODEL_LOCATE = savedLocate;
      if (savedDefault === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = savedDefault;
    }

    const options = openAICallMock.mock.calls[0][2] as { model?: string };
    expect(options.model).toBe('gpt-default-model');
  });

  it('probes the target-year candidate first even when prior-year ones sit on the banca domain', async () => {
    const aggregatorTargetYear = 'https://qconcursos.com/edital-abertura-2025.pdf';
    openAICallMock
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [
            { url: 'https://cebraspe.org.br/edital-abertura-2023-a.pdf', year: 2023, isOfficialDomain: true },
            { url: 'https://cebraspe.org.br/edital-abertura-2023-b.pdf', year: 2023, isOfficialDomain: true },
            { url: 'https://cebraspe.org.br/edital-abertura-2023-c.pdf', year: 2023, isOfficialDomain: true },
            { url: aggregatorTargetYear, year: 2025, isOfficialDomain: false },
          ],
          targetYearFound: true,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      .mockResolvedValue({
        text: JSON.stringify({ editais: [], targetYearFound: false }),
        inputTokens: 1,
        outputTokens: 1,
      });
    fetchEditalPdfMock.mockImplementation(async (url: string) => ({ url }) as any);
    editalVerifyMock.mockImplementation(async (file: { url: string }) => ({
      isMainEdital: true,
      documentType: 'edital',
      year: file.url.includes('2025') ? 2025 : 2023,
      editalNumber: null,
    }));

    const result = await locateEdital('user-1', seed);

    // Only MAX_VERIFY_PER_ROUND (3) candidates are opened per round, so the one candidate the
    // model tagged with the target year has to win the budget over three prior-year files —
    // the banca domain those sit on must not outrank being the year actually being searched.
    expect(fetchEditalPdfMock.mock.calls[0][0]).toBe(aggregatorTargetYear);
    expect(result.editais[0].url).toBe(aggregatorTargetYear);
    expect(result.targetYearFound).toBe(true);
  });

  it('still widens round 1 to an unrestricted search when the domain-scoped attempt finds only prior years', async () => {
    openAICallMock
      // Scoped to cebraspe.org.br — turns up a real edital, but from 2023, not the target year.
      .mockResolvedValueOnce({
        text: JSON.stringify({
          editais: [{ url: 'https://cebraspe.org.br/edital-abertura-2023.pdf', year: 2023, isOfficialDomain: true }],
          targetYearFound: false,
        }),
        inputTokens: 1,
        outputTokens: 1,
      })
      .mockResolvedValue({
        text: JSON.stringify({
          editais: [{ url: 'https://www.trf1.jus.br/edital-abertura-2025.pdf', year: 2025, isOfficialDomain: true }],
          targetYearFound: true,
        }),
        inputTokens: 1,
        outputTokens: 1,
      });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockImplementation(async (_file: unknown) => ({
      isMainEdital: true,
      documentType: 'edital',
      year: 2025,
      editalNumber: '001/2025',
    }));

    await locateEdital('user-1', seed);

    // A prior-year hit is not the answer, so the domain-scoped attempt has not succeeded and
    // must still be widened. The retry is identifiable as round 1's — it runs before anything
    // has been downloaded, so it carries no excludeUrls yet, unlike a round 2 call.
    const [, secondInput, secondOptions] = openAICallMock.mock.calls[1] as [
      unknown,
      { excludeUrls: readonly string[] },
      Record<string, unknown>,
    ];
    expect(secondOptions.allowedDomains).toEqual([]);
    expect(secondInput.excludeUrls).toEqual([]);
  });

  it('treats the same document reported and harvested under different percent-encodings as one candidate', async () => {
    const reported = 'https://x.gov.br/media/edital.pdf?se=2035-08-12T20%3A08%3A15Z&sig=a%2Fb%3D';
    const harvested = 'https://x.gov.br/media/edital.pdf?se=2035-08-12T20:08:15Z&sig=a/b%3D';
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [{ url: reported, year: 2025 }], targetYearFound: true }),
      inputTokens: 1,
      outputTokens: 1,
      sources: [harvested],
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({
      isMainEdital: true,
      documentType: 'edital',
      year: 2025,
      editalNumber: '001/2025',
    });

    const result = await locateEdital('user-1', seed);

    // Signed portal URLs come back percent-encoded differently depending on where they were
    // read from, so keying `seen` on the raw string shows the user the same edital twice and
    // spends two of the round's three download slots on one document.
    expect(result.editais).toHaveLength(1);
    expect(result.editais[0].url).toBe(reported);
    expect(fetchEditalPdfMock).toHaveBeenCalledTimes(1);
  });

  it('harvests a download-handler URL from the search sources even though it is not a .pdf path', async () => {
    const handlerUrl = 'https://x.gov.br/lumis/portal/file/fileDownload.jsp?fileId=4028908C9E22CAA6';
    openAICallMock.mockResolvedValue({
      text: JSON.stringify({ editais: [], targetYearFound: false }),
      inputTokens: 1,
      outputTokens: 1,
      sources: [handlerUrl, 'https://x.gov.br/noticias/concurso-aberto.htm'],
    });
    fetchEditalPdfMock.mockResolvedValue({} as any);
    editalVerifyMock.mockResolvedValue({
      isMainEdital: true,
      documentType: 'edital',
      year: 2025,
      editalNumber: '001/2025',
    });

    const result = await locateEdital('user-1', seed);

    // Brazilian portals routinely serve editais through a download handler whose URL carries
    // no .pdf at all (lumis, SEI). fetchEditalPdf decides by magic bytes, so the URL shape is
    // not a reason to discard the candidate — the plain .htm page next to it still is.
    expect(fetchEditalPdfMock).toHaveBeenCalledWith(handlerUrl);
    expect(fetchEditalPdfMock).not.toHaveBeenCalledWith('https://x.gov.br/noticias/concurso-aberto.htm');
    expect(result.editais[0]).toMatchObject({ url: handlerUrl, verification: 'confirmed' });
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
