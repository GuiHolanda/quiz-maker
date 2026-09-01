import { sanitizeAiQuestions, validateAiQuestions } from '@/features/services/exam-question.service';
import { QUESTION_FORMATS } from '@/config/question-formats';

const question = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  text: 'Um enunciado suficientemente longo para ser plausível.',
  correctCount: 1,
  difficulty: 'medium',
  options: { A: 'a', B: 'b', C: 'c', D: 'd', E: 'e' },
  ...overrides,
});

const payload = (overrides: Record<string, unknown> = {}) => ({ questions: [question(overrides)] });

describe('validateAiQuestions — structural checks', () => {
  it('rejects a payload without a questions array', () => {
    expect(() => validateAiQuestions({})).toThrow(/questions array is required/);
    expect(() => validateAiQuestions({ questions: 'nope' })).toThrow(/questions array is required/);
  });

  it('rejects a question without text or without options', () => {
    expect(() => validateAiQuestions({ questions: [{ options: { A: 'a', B: 'b' } }] })).toThrow(/text is required/);
    expect(() => validateAiQuestions({ questions: [{ text: 'x' }] })).toThrow(/options are required/);
  });

  it('rejects a question with fewer than two options', () => {
    expect(() => validateAiQuestions(payload({ options: { A: 'só uma' } }))).toThrow(/at least 2 options/);
  });

  it('rejects blank option texts', () => {
    expect(() => validateAiQuestions(payload({ options: { A: 'a', B: '   ' } }))).toThrow(/non-empty strings/);
    expect(() => validateAiQuestions(payload({ options: { A: 'a', B: 42 } }))).toThrow(/non-empty strings/);
  });

  it('accepts a well-formed payload and returns the questions', () => {
    const result = validateAiQuestions(payload());

    expect(result).toHaveLength(1);
    expect(result[0].text).toMatch(/enunciado/);
  });
});

describe('validateAiQuestions — correctCount ceiling', () => {
  it('rejects a question where every option is correct', () => {
    // Unanswerable: with 5 options, 5 correct leaves no wrong choice.
    expect(() => validateAiQuestions(payload({ correctCount: 5 }))).toThrow(/between 1 and 4/);
  });

  it('rejects correctCount below 1', () => {
    expect(() => validateAiQuestions(payload({ correctCount: 0 }))).toThrow(/between 1 and/);
  });

  it('caps correctCount at the format maximum when a format is supplied', () => {
    // 3 of 5 is fine for mc_5 but above the mc_4 ceiling of 2.
    expect(() =>
      validateAiQuestions(payload({ correctCount: 3 }), QUESTION_FORMATS.mc_5)
    ).not.toThrow();

    expect(() =>
      validateAiQuestions(
        payload({ correctCount: 3, options: { A: 'a', B: 'b', C: 'c', D: 'd' } }),
        QUESTION_FORMATS.mc_4
      )
    ).toThrow(/between 1 and 2/);
  });

  it('skips the ceiling check when correctCount is absent', () => {
    const { correctCount, ...withoutCount } = question();

    expect(() => validateAiQuestions({ questions: [withoutCount] })).not.toThrow();
  });
});

describe('validateAiQuestions — format label set', () => {
  it('accepts options matching the declared format exactly', () => {
    expect(() => validateAiQuestions(payload(), QUESTION_FORMATS.mc_5)).not.toThrow();

    expect(() =>
      validateAiQuestions(
        payload({ options: { C: 'Certo', E: 'Errado' } }),
        QUESTION_FORMATS.true_false
      )
    ).not.toThrow();
  });

  it('rejects a five-option question when the exam expects four', () => {
    expect(() => validateAiQuestions(payload(), QUESTION_FORMATS.mc_4)).toThrow(
      /expected options A, B, C, D but received A, B, C, D, E/
    );
  });

  it('rejects a dropped option', () => {
    expect(() =>
      validateAiQuestions(payload({ options: { A: 'a', B: 'b', C: 'c', D: 'd' } }), QUESTION_FORMATS.mc_5)
    ).toThrow(/expected options A, B, C, D, E/);
  });

  it('rejects an invented label even when the count is right', () => {
    expect(() =>
      validateAiQuestions(
        payload({ options: { A: 'a', B: 'b', C: 'c', D: 'd', F: 'f' } }),
        QUESTION_FORMATS.mc_5
      )
    ).toThrow(/expected options A, B, C, D, E but received A, B, C, D, F/);
  });

  it('rejects multiple-choice options when the exam is Certo/Errado', () => {
    expect(() => validateAiQuestions(payload(), QUESTION_FORMATS.true_false)).toThrow(/expected options C, E/);
  });

  it('leaves the label set unchecked when no format is supplied', () => {
    // Legacy payloads and jobs saved before the exam carried a format still validate.
    expect(() => validateAiQuestions(payload({ options: { A: 'a', B: 'b', C: 'c', D: 'd' } }))).not.toThrow();
  });
});

describe('sanitizeAiQuestions — per-question resilience', () => {
  const good = (id: number) => question({ id });
  const badCorrectCount = (id: number) => question({ id, correctCount: 5 });
  const badLabels = (id: number) => question({ id, options: { A: 'a', B: 'b' } });

  it('returns every question and no drops when all are valid', () => {
    const result = sanitizeAiQuestions({ questions: [good(1), good(2)] }, QUESTION_FORMATS.mc_5);

    expect(result.questions).toHaveLength(2);
    expect(result.dropped).toEqual([]);
  });

  it('drops only the malformed questions and keeps the rest', () => {
    const result = sanitizeAiQuestions(
      { questions: [good(1), badCorrectCount(2), good(3), badLabels(4)] },
      QUESTION_FORMATS.mc_5
    );

    expect(result.questions.map((q) => q.id)).toEqual([1, 3]);
    expect(result.dropped).toHaveLength(2);
    expect(result.dropped[0]).toMatch(/correctCount must be between 1 and 3/);
    expect(result.dropped[1]).toMatch(/expected options A, B, C, D, E/);
  });

  it('returns an empty question list when every question is malformed', () => {
    const result = sanitizeAiQuestions({ questions: [badCorrectCount(1), badLabels(2)] }, QUESTION_FORMATS.mc_5);

    expect(result.questions).toEqual([]);
    expect(result.dropped).toHaveLength(2);
  });

  it('still throws when the questions array itself is missing', () => {
    expect(() => sanitizeAiQuestions({})).toThrow(/questions array is required/);
  });
});
