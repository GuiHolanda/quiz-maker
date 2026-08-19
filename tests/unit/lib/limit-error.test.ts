import { parseLimitError } from '@/lib/limit-error';

// The client decides between "explain the limit with an upgrade CTA" and "show a generic
// error toast" purely from this parser, so a wrong answer either hides a real failure
// behind an upsell or tells a blocked user that something broke.

describe('parseLimitError', () => {
  const axiosLike = (status: number, data: unknown) => ({ response: { status, data } });

  it('returns null for non-403 errors so normal handling stays in place', () => {
    expect(parseLimitError(axiosLike(500, { error: 'Database error' }))).toBeNull();
    expect(parseLimitError(axiosLike(409, { error: 'duplicate' }))).toBeNull();
    expect(parseLimitError(new Error('Network Error'))).toBeNull();
  });

  it('reads the quota code and counters from a 403 body', () => {
    const err = axiosLike(403, {
      error: 'quota_exceeded',
      code: 'exam_limit',
      limit: 2,
      used: 2,
      plan: 'free',
    });

    expect(parseLimitError(err)).toEqual({ code: 'exam_limit', limit: 2, used: 2, plan: 'free' });
  });

  it('recognises each quota code', () => {
    for (const code of ['questions_limit', 'exam_limit', 'auto_config_limit'] as const) {
      expect(parseLimitError(axiosLike(403, { code }))?.code).toBe(code);
    }
  });

  it('recognises a plan gate sent as `error` without a `code`', () => {
    expect(parseLimitError(axiosLike(403, { error: 'plan_required' }))).toEqual({ code: 'plan_required' });
  });

  it('returns null for an ownership 403 so it never becomes a bogus upsell', () => {
    // ExamService/BrowseService throw a bare "Forbidden" when a user touches someone
    // else's record — upgrading would not grant that access, so it must not be offered.
    expect(parseLimitError(axiosLike(403, { error: 'Forbidden', message: 'Forbidden' }))).toBeNull();
    expect(parseLimitError(axiosLike(403, {}))).toBeNull();
  });

  it('reads a fetch-style error that carries status and payload on the error itself', () => {
    // useExamSeed's SSE reader throws this shape (no axios wrapper).
    const err = Object.assign(new Error('Exam limit reached (2)'), {
      status: 403,
      response: { status: 403, data: { code: 'exam_limit', limit: 2, used: 2, plan: 'free' } },
    });

    expect(parseLimitError(err)).toEqual({ code: 'exam_limit', limit: 2, used: 2, plan: 'free' });
  });

  it('omits counters that are absent or the wrong type', () => {
    expect(parseLimitError(axiosLike(403, { code: 'exam_limit', limit: '2', used: null }))).toEqual({
      code: 'exam_limit',
    });
  });
});
