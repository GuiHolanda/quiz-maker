import { vi, describe, it, expect, beforeEach } from 'vitest';

const { filesCreateMock, filesDeleteMock, responsesCreateMock, recordStepMock } = vi.hoisted(() => ({
  filesCreateMock: vi.fn(),
  filesDeleteMock: vi.fn(),
  responsesCreateMock: vi.fn(),
  recordStepMock: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class {
    files = { create: filesCreateMock, delete: filesDeleteMock };
    responses = { create: responsesCreateMock };
  },
}));

vi.mock('@/features/services/metrics.service', () => ({
  MetricsService: class {
    recordStep = recordStepMock;
  },
}));

import { EditalExtractorService } from '@/features/services/edital-extractor.service';

const DUMMY_FILE = {} as File;
const INPUT = { examName: 'Concurso X', role: 'Analista' };

beforeEach(() => {
  vi.clearAllMocks();
  filesCreateMock.mockResolvedValue({ id: 'file-1' });
  filesDeleteMock.mockResolvedValue(undefined);
});

describe('EditalExtractorService.verifyIsMainEdital', () => {
  it('parses a well-formed confirmation and records a verify_edital step under the caller-supplied logId', async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        isMainEdital: true,
        hasConteudoProgramatico: true,
        documentType: 'edital',
        subjectCount: 8,
        year: 2026,
        editalNumber: '004/2026',
      }),
      usage: { input_tokens: 900, output_tokens: 40 },
    });

    const service = new EditalExtractorService();
    const result = await service.verifyIsMainEdital(DUMMY_FILE, INPUT, { logId: 'log-1' });

    expect(result).toEqual({ isMainEdital: true, documentType: 'edital', year: 2026, editalNumber: '004/2026' });
    expect(filesCreateMock).toHaveBeenCalledWith({ file: DUMMY_FILE, purpose: 'user_data' });
    // Uses the caller's logId — never creates its own log, unlike extract()'s ownsLog branch.
    expect(recordStepMock).toHaveBeenCalledWith(
      'log-1',
      'verify_edital',
      { inputTokens: 900, outputTokens: 40 },
      expect.any(Number)
    );
    expect(filesDeleteMock).toHaveBeenCalledWith('file-1');
  });

  it('defaults year/editalNumber to null when the model omits them', async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({ isMainEdital: true, documentType: 'edital' }),
      usage: { input_tokens: 50, output_tokens: 10 },
    });

    const service = new EditalExtractorService();
    const result = await service.verifyIsMainEdital(DUMMY_FILE, INPUT, { logId: 'log-1' });

    expect(result).toEqual({ isMainEdital: true, documentType: 'edital', year: null, editalNumber: null });
  });

  it('strips markdown fences before parsing', async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: '```json\n{"isMainEdital":false,"documentType":"quadro_vagas"}\n```',
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const service = new EditalExtractorService();
    const result = await service.verifyIsMainEdital(DUMMY_FILE, { examName: 'X', role: '' }, { logId: 'log-1' });

    expect(result).toEqual({ isMainEdital: false, documentType: 'quadro_vagas', year: null, editalNumber: null });
  });

  it('returns isMainEdital: false on unparseable output instead of throwing', async () => {
    responsesCreateMock.mockResolvedValue({
      output_text: 'not json at all',
      usage: { input_tokens: 5, output_tokens: 2 },
    });

    const service = new EditalExtractorService();
    const result = await service.verifyIsMainEdital(DUMMY_FILE, { examName: 'X', role: '' }, { logId: 'log-1' });

    expect(result).toEqual({ isMainEdital: false, documentType: 'outro', year: null, editalNumber: null });
    // A content problem is not a network/SDK failure — cleanup still runs, nothing propagates.
    expect(filesDeleteMock).toHaveBeenCalledWith('file-1');
  });

  it('deletes the uploaded file even when responses.create throws, and propagates the error', async () => {
    responsesCreateMock.mockRejectedValue(new Error('rate limited'));

    const service = new EditalExtractorService();

    await expect(
      service.verifyIsMainEdital(DUMMY_FILE, { examName: 'X', role: '' }, { logId: 'log-1' })
    ).rejects.toThrow('rate limited');
    expect(filesDeleteMock).toHaveBeenCalledWith('file-1');
  });

  it('falls back to the default model when no OPENAI_MODEL_VERIFY/OPENAI_MODEL env var is set', async () => {
    const savedVerify = process.env.OPENAI_MODEL_VERIFY;
    const savedDefault = process.env.OPENAI_MODEL;

    delete process.env.OPENAI_MODEL_VERIFY;
    delete process.env.OPENAI_MODEL;
    responsesCreateMock.mockResolvedValue({
      output_text: '{"isMainEdital":true,"documentType":"edital"}',
      usage: {},
    });

    try {
      const service = new EditalExtractorService();
      await service.verifyIsMainEdital(DUMMY_FILE, { examName: 'X', role: '' }, { logId: 'log-1' });

      expect(responsesCreateMock.mock.calls[0][0].model).toBe('gpt-5.4-mini');
    } finally {
      if (savedVerify === undefined) delete process.env.OPENAI_MODEL_VERIFY;
      else process.env.OPENAI_MODEL_VERIFY = savedVerify;
      if (savedDefault === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = savedDefault;
    }
  });

  it('prefers OPENAI_MODEL_VERIFY over OPENAI_MODEL', async () => {
    const savedVerify = process.env.OPENAI_MODEL_VERIFY;
    const savedDefault = process.env.OPENAI_MODEL;

    process.env.OPENAI_MODEL_VERIFY = 'gpt-verify-cheap';
    process.env.OPENAI_MODEL = 'gpt-general';
    responsesCreateMock.mockResolvedValue({
      output_text: '{"isMainEdital":true,"documentType":"edital"}',
      usage: {},
    });

    try {
      const service = new EditalExtractorService();
      await service.verifyIsMainEdital(DUMMY_FILE, { examName: 'X', role: '' }, { logId: 'log-1' });

      expect(responsesCreateMock.mock.calls[0][0].model).toBe('gpt-verify-cheap');
    } finally {
      if (savedVerify === undefined) delete process.env.OPENAI_MODEL_VERIFY;
      else process.env.OPENAI_MODEL_VERIFY = savedVerify;
      if (savedDefault === undefined) delete process.env.OPENAI_MODEL;
      else process.env.OPENAI_MODEL = savedDefault;
    }
  });
});
