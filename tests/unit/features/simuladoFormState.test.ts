import {
  buildCreatePayload,
  coveragePercent,
  distributeQuestions,
  resolveDurationMinutes,
  sectionWeights,
} from '@/app/(workspace)/simulados/components/create/simuladoFormState';

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

  it('distributeQuestions never emits a negative count when total is below the selected-section count', () => {
    const d = distributeQuestions(sections, ['A', 'B'], 1);

    expect(d.every((entry) => entry.questionCount >= 0)).toBe(true);
    expect(d.reduce((sum, entry) => sum + entry.questionCount, 0)).toBe(1);
  });

  it('distributeQuestions keeps the sum and stays non-negative with uneven weights', () => {
    const three = [
      { name: 'A', maxQuestions: 30, minQuestions: 0 },
      { name: 'B', maxQuestions: 30, minQuestions: 0 },
      { name: 'C', maxQuestions: 40, minQuestions: 0 },
    ] as any;
    const d = distributeQuestions(three, ['A', 'B', 'C'], 7);

    expect(d.every((entry) => entry.questionCount >= 0)).toBe(true);
    expect(d.reduce((sum, entry) => sum + entry.questionCount, 0)).toBe(7);
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

  it('resolveDurationMinutes: personalizado with 0 minutes resolves to null', () => {
    const exam = { examDurationMinutes: 130 } as any;
    expect(resolveDurationMinutes({ timeMode: 'personalizado', customMinutes: 0 } as any, exam)).toBeNull();
  });

  it('buildCreatePayload fixes the source to library, resolves the duration and only ships selected sections', () => {
    const exam = { id: 'exam-1', name: 'AWS', examDurationMinutes: 130, sections } as any;
    const base = {
      name: '  ',
      scope: 'certification',
      examId: 'exam-1',
      totalQuestions: 10,
      source: 'library',
      selectedSections: ['A'],
    };

    const oficial = buildCreatePayload({ ...base, timeMode: 'oficial', customMinutes: 0 } as any, exam);
    expect(oficial.questionSource).toBe('library');
    expect(oficial.durationMinutes).toBe(130);
    expect(oficial.name).toBeUndefined();
    expect(oficial.sections.map((entry) => entry.sectionName)).toEqual(['A']);

    const livre = buildCreatePayload({ ...base, timeMode: 'livre', customMinutes: 45 } as any, exam);
    expect(livre.durationMinutes).toBeNull();

    const custom = buildCreatePayload({ ...base, timeMode: 'personalizado', customMinutes: 45 } as any, exam);
    expect(custom.durationMinutes).toBe(45);

    const customZero = buildCreatePayload({ ...base, timeMode: 'personalizado', customMinutes: 0 } as any, exam);
    expect(customZero.durationMinutes).toBeNull();
  });
});
