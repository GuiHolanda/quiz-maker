import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';

import { toApiErrorResponse } from '@/lib/api-error';

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
