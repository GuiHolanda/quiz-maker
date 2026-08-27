import { distributeQuestions, sectionWeights, coveragePercent, resolveDurationMinutes } from '@/app/(workspace)/simulados/components/create/simuladoFormState';

const sections = [
  { name: 'A', maxQuestions: 30, minQuestions: 0 },
  { name: 'B', maxQuestions: 10, minQuestions: 0 },
] as any;

describe('simuladoFormState', () => {
  it('sectionWeights normalizes over the sum of maxQuestions', () => {
    expect(sectionWeights(sections)).toEqual({ A: 75, B: 25 });
  });

  it('distributeQuestions splits by weight and the last selected absorbs the remainder', () => {
    const d = distributeQuestions(sections, ['A', 'B'], 10);
    expect(d).toEqual([{ sectionName: 'A', questionCount: 8 }, { sectionName: 'B', questionCount: 2 }]);
    expect(d.reduce((s, x) => s + x.questionCount, 0)).toBe(10);
  });

  it('distributeQuestions ignores unselected sections', () => {
    expect(distributeQuestions(sections, ['B'], 5)).toEqual([{ sectionName: 'B', questionCount: 5 }]);
  });

  it('coveragePercent = selected maxQuestions over total maxQuestions', () => {
    expect(coveragePercent(sections, ['A'])).toBe(75);
  });

  it('resolveDurationMinutes: oficial→exam, livre→null, personalizado→custom', () => {
    const exam = { examDurationMinutes: 130 } as any;
    expect(resolveDurationMinutes({ timeMode: 'oficial', customMinutes: 30 } as any, exam)).toBe(130);
    expect(resolveDurationMinutes({ timeMode: 'livre', customMinutes: 30 } as any, exam)).toBeNull();
    expect(resolveDurationMinutes({ timeMode: 'personalizado', customMinutes: 30 } as any, exam)).toBe(30);
  });
});
