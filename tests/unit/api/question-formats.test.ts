import {
  DEFAULT_QUESTION_FORMAT,
  QUESTION_FORMATS,
  defaultFormatForSource,
  isQuestionFormatKey,
  resolveQuestionFormat,
} from '@/config/question-formats';

describe('QUESTION_FORMATS', () => {
  it('keys every entry consistently with its own key field', () => {
    Object.entries(QUESTION_FORMATS).forEach(([key, format]) => {
      expect(format.key).toBe(key);
    });
  });

  it('never allows every option of a format to be correct', () => {
    // A question whose options are all correct is unanswerable; maxCorrect must leave
    // at least one wrong option behind.
    Object.values(QUESTION_FORMATS).forEach((format) => {
      expect(format.maxCorrect).toBeLessThan(format.labels.length);
      expect(format.maxCorrect).toBeGreaterThanOrEqual(1);
    });
  });

  it('declares unique, non-empty labels for every format', () => {
    Object.values(QUESTION_FORMATS).forEach((format) => {
      expect(format.labels.length).toBeGreaterThanOrEqual(2);
      expect(new Set(format.labels).size).toBe(format.labels.length);
    });
  });

  it('marks Certo/Errado as semantic and the multiple-choice formats as shuffleable', () => {
    // The persistence layer keys the shuffle guard off this flag — reassigning texts
    // across C/E would turn "Certo" into the wrong answer.
    expect(QUESTION_FORMATS.true_false.labelsAreSemantic).toBe(true);
    expect(QUESTION_FORMATS.mc_4.labelsAreSemantic).toBe(false);
    expect(QUESTION_FORMATS.mc_5.labelsAreSemantic).toBe(false);
  });

  it('builds a draft template listing exactly the labels of the format', () => {
    expect(QUESTION_FORMATS.mc_4.draftTemplate).toBe(
      'A: <option text>\nB: <option text>\nC: <option text>\nD: <option text>'
    );
    expect(QUESTION_FORMATS.true_false.draftTemplate).toBe('C: Certo\nE: Errado');
  });
});

describe('isQuestionFormatKey', () => {
  it('accepts registered keys and rejects everything else', () => {
    expect(isQuestionFormatKey('mc_4')).toBe(true);
    expect(isQuestionFormatKey('mc_9')).toBe(false);
    expect(isQuestionFormatKey(undefined)).toBe(false);
    expect(isQuestionFormatKey(null)).toBe(false);
    expect(isQuestionFormatKey(5)).toBe(false);
  });
});

describe('resolveQuestionFormat', () => {
  it('returns the requested format', () => {
    expect(resolveQuestionFormat('true_false').key).toBe('true_false');
  });

  it('falls back to the default instead of throwing on an unknown key', () => {
    // Questions persisted before this registry existed carry no key, and a retired key
    // must still render rather than break the page.
    expect(resolveQuestionFormat('retired_format').key).toBe(DEFAULT_QUESTION_FORMAT);
    expect(resolveQuestionFormat(undefined).key).toBe(DEFAULT_QUESTION_FORMAT);
  });
});

describe('defaultFormatForSource', () => {
  it('maps Cebraspe and CESPE to Certo/Errado regardless of casing or surrounding text', () => {
    expect(defaultFormatForSource('CESPE')).toBe('true_false');
    expect(defaultFormatForSource('  Cebraspe / CESPE  ')).toBe('true_false');
  });

  it('falls back to the default for unmapped or missing sources', () => {
    expect(defaultFormatForSource('FGV')).toBe(DEFAULT_QUESTION_FORMAT);
    expect(defaultFormatForSource(null)).toBe(DEFAULT_QUESTION_FORMAT);
    expect(defaultFormatForSource(undefined)).toBe(DEFAULT_QUESTION_FORMAT);
    expect(defaultFormatForSource('')).toBe(DEFAULT_QUESTION_FORMAT);
  });
});
