import {
  parseRequestedScope,
  resolveGenerationScope,
} from '@/app/(workspace)/questions/components/generationScope';

describe('parseRequestedScope', () => {
  it.each(['certification', 'public_exam'] as const)('accepts %s', (value) => {
    expect(parseRequestedScope(value)).toBe(value);
  });

  it.each([[null], [''], ['foo'], ['Certification'], ['public-exam']])('rejects %s', (value) => {
    expect(parseRequestedScope(value)).toBeNull();
  });
});

describe('resolveGenerationScope', () => {
  it('opens on public exams when the user only has public exams', () => {
    expect(resolveGenerationScope(null, { certifications: 0, publicExams: 3 })).toBe('public_exam');
  });

  it('opens on certifications when the user has certifications', () => {
    expect(resolveGenerationScope(null, { certifications: 2, publicExams: 0 })).toBe('certification');
  });

  it('prefers certifications when the user has both', () => {
    expect(resolveGenerationScope(null, { certifications: 1, publicExams: 4 })).toBe('certification');
  });

  it('falls back to certifications while nothing is loaded or when the user has no exams at all', () => {
    expect(resolveGenerationScope(null, { certifications: 0, publicExams: 0 })).toBe('certification');
  });

  it('keeps an explicit choice even when that scope has no exams', () => {
    expect(resolveGenerationScope('certification', { certifications: 0, publicExams: 3 })).toBe('certification');
    expect(resolveGenerationScope('public_exam', { certifications: 2, publicExams: 0 })).toBe('public_exam');
  });
});
