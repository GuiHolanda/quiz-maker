import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

import { logApiError, toApiErrorResponse } from '@/lib/api-error';

const loggerMock = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }));

vi.mock('@/lib/logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/logger')>()),
  logger: loggerMock,
}));

describe('toApiErrorResponse', () => {
  // Business-logic errors from the service layer
  describe('service business-logic errors (Error with .status)', () => {
    it('passes the message through and uses the .status', () => {
      const err = Object.assign(new Error('Certification with key "X" already exists'), { status: 409 });
      const result = toApiErrorResponse(err);

      expect(result.message).toBe('Certification with key "X" already exists');
      expect(result.error).toBe('Certification with key "X" already exists');
      expect(result.status).toBe(409);
    });

    it('works for 403 ownership errors', () => {
      const err = Object.assign(new Error('Access denied'), { status: 403 });
      const result = toApiErrorResponse(err);

      expect(result.message).toBe('Access denied');
      expect(result.status).toBe(403);
    });

    it('works for 404 not-found errors', () => {
      const err = Object.assign(new Error('Not found'), { status: 404 });
      const result = toApiErrorResponse(err);

      expect(result.message).toBe('Not found');
      expect(result.status).toBe(404);
    });

    // Quota rejections carry a structured body; the client keys its limit modal off it,
    // so dropping these fields would degrade every cap into a generic error toast.
    it('forwards the quota code and counters from a service error body', () => {
      const err = Object.assign(new Error('Exam limit reached (2)'), {
        status: 403,
        body: { error: 'quota_exceeded', code: 'exam_limit', limit: 2, used: 2, plan: 'free' },
      });
      const result = toApiErrorResponse(err);

      expect(result).toMatchObject({ status: 403, code: 'exam_limit', limit: 2, used: 2, plan: 'free' });
    });

    it('omits quota fields entirely for errors without a structured body', () => {
      const result = toApiErrorResponse(Object.assign(new Error('Forbidden'), { status: 403 }));

      expect(result.code).toBeUndefined();
      expect(result.limit).toBeUndefined();
    });
  });

  // Prisma validation errors — schema mismatch, unknown field, wrong type
  describe('PrismaClientValidationError', () => {
    it('returns 500 with no message field', () => {
      const err = new Prisma.PrismaClientValidationError(
        'Invalid `prisma.certification.update()` invocation\n\nUnknown argument `totalQuestions`.',
        { clientVersion: '6.0.0' }
      );
      const result = toApiErrorResponse(err);

      expect(result.status).toBe(500);
      expect(result.message).toBeUndefined();
    });
  });

  // Prisma known request errors — unique constraint, record not found
  describe('PrismaClientKnownRequestError', () => {
    it('returns 409 with no message for P2002 (unique constraint)', () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`key`)', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      const result = toApiErrorResponse(err);

      expect(result.status).toBe(409);
      expect(result.message).toBeUndefined();
    });

    it('returns 500 with no message for other Prisma known errors (e.g. P2025)', () => {
      const err = new Prisma.PrismaClientKnownRequestError('Record to update not found.', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      const result = toApiErrorResponse(err);

      expect(result.status).toBe(500);
      expect(result.message).toBeUndefined();
    });
  });

  // Generic unexpected errors
  describe('generic Error (no .status)', () => {
    it('returns 500 and surfaces the error message', () => {
      const err = new Error('Unexpected failure');
      const result = toApiErrorResponse(err);

      expect(result.status).toBe(500);
      expect(result.error).toBe('Unexpected failure');
      // message is present (for server-side logging) but there is no contract to strip it
    });
  });

  // Non-Error thrown values
  describe('non-Error thrown values', () => {
    it('returns 500 for a thrown string', () => {
      const result = toApiErrorResponse('something broke');

      expect(result.status).toBe(500);
      expect(result.error).toBe('Internal server error');
      expect(result.message).toBeUndefined();
    });

    it('returns 500 for null', () => {
      const result = toApiErrorResponse(null);

      expect(result.status).toBe(500);
      expect(result.error).toBe('Internal server error');
    });
  });
});

describe('logApiError', () => {
  beforeEach(() => {
    loggerMock.info.mockClear();
    loggerMock.warn.mockClear();
    loggerMock.error.mockClear();
  });

  it('logs an unexpected failure as an error with status, error details and the caller context', () => {
    logApiError('mock_exam.finish.failed', new TypeError('boom'), { attemptId: 10, userId: 'u1' });

    expect(loggerMock.error).toHaveBeenCalledWith(
      'mock_exam.finish.failed',
      expect.objectContaining({
        attemptId: 10,
        userId: 'u1',
        status: 500,
        errorName: 'TypeError',
        errorMessage: 'boom',
      })
    );
    expect(loggerMock.warn).not.toHaveBeenCalled();
  });

  it('logs a business-logic rejection as a warning with its own status', () => {
    logApiError('mock_exam.finish.failed', Object.assign(new Error('Tentativa não encontrada'), { status: 404 }), {
      attemptId: 10,
    });

    expect(loggerMock.warn).toHaveBeenCalledWith(
      'mock_exam.finish.failed',
      expect.objectContaining({ attemptId: 10, status: 404, errorMessage: 'Tentativa não encontrada' })
    );
    expect(loggerMock.error).not.toHaveBeenCalled();
  });
});
