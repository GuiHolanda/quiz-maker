import { afterEach, describe, expect, it, vi } from 'vitest';

import { logger, serializeError } from '@/lib/logger';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes errors to console.error as one JSON line with level and event first', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('mock_exam.finish.failed', { attemptId: 10 });

    expect(spy).toHaveBeenCalledOnce();
    const line = spy.mock.calls[0][0] as string;

    expect(line).not.toContain('\n');
    expect(JSON.parse(line)).toEqual({ level: 'error', event: 'mock_exam.finish.failed', attemptId: 10 });
    expect(line.startsWith('{"level":"error","event":"mock_exam.finish.failed"')).toBe(true);
  });

  it('routes warn to console.warn and info to console.info', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.warn('a');
    logger.info('b', { n: 1 });

    expect(JSON.parse(warnSpy.mock.calls[0][0] as string)).toMatchObject({ level: 'warn', event: 'a' });
    expect(JSON.parse(infoSpy.mock.calls[0][0] as string)).toMatchObject({ level: 'info', event: 'b', n: 1 });
  });

  it('still emits the event when a field cannot be serialized', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const circular: Record<string, unknown> = {};

    circular.self = circular;

    expect(() => logger.error('evt', { circular })).not.toThrow();
    expect(JSON.parse(spy.mock.calls[0][0] as string)).toMatchObject({ level: 'error', event: 'evt' });
  });
});

describe('serializeError', () => {
  it('keeps name, message, code and status of an Error', () => {
    const err = Object.assign(new Error('boom'), { code: 'P2024', status: 500 });

    expect(serializeError(err)).toMatchObject({
      errorName: 'Error',
      errorMessage: 'boom',
      errorCode: 'P2024',
      errorStatus: 500,
    });
  });

  it('keeps the provider request id when the error carries one', () => {
    const err = Object.assign(new Error('rate limited'), { status: 429, requestID: 'req_abc' });

    expect(serializeError(err)).toMatchObject({ errorStatus: 429, errorRequestId: 'req_abc' });
  });

  it('truncates a very long message and keeps only the top of the stack', () => {
    const serialized = serializeError(new Error('x'.repeat(5000)));

    expect((serialized.errorMessage as string).length).toBeLessThan(600);
    expect((serialized.errorStack as string).split('\n').length).toBeLessThanOrEqual(6);
  });

  it('describes a thrown non-Error value', () => {
    expect(serializeError('just a string')).toEqual({ errorMessage: 'just a string' });
  });
});
