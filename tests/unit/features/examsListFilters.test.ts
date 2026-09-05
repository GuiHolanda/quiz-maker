import { countByTab, filterAndSortExams } from '@/app/(workspace)/exams/components/list/examsListFilters';
import type { Exam } from '@/shared/types';

function exam(overrides: Partial<Exam>): Exam {
  return {
    type: 'certification',
    name: 'AWS SAA',
    totalQuestions: 65,
    sections: [],
    status: 'active',
    readinessPercent: 0,
    lastActivityAt: null,
    ...overrides,
  } as Exam;
}

describe('countByTab', () => {
  const exams = [
    exam({ type: 'certification', status: 'active' }),
    exam({ type: 'public_exam', status: 'active' }),
    exam({ type: 'certification', status: 'draft', sections: [] }),
  ];

  it('counts all exams for "all"', () => {
    expect(countByTab(exams, 'all')).toBe(3);
  });

  it('counts only certifications for "certification"', () => {
    expect(countByTab(exams, 'certification')).toBe(2);
  });

  it('counts only public exams for "public_exam"', () => {
    expect(countByTab(exams, 'public_exam')).toBe(1);
  });

  it('counts only draft-status exams for "draft", regardless of type', () => {
    expect(countByTab(exams, 'draft')).toBe(1);
  });
});

describe('filterAndSortExams', () => {
  const anbima = exam({ name: 'CPA-20', type: 'certification', provider: { name: 'ANBIMA' } });
  const inss = exam({ name: 'INSS Técnico', type: 'public_exam', examBoard: { name: 'Cebraspe' } });
  const draft = exam({ name: 'TRT 4ª Região', type: 'public_exam', status: 'draft' });

  it('filters by tab', () => {
    const result = filterAndSortExams([anbima, inss, draft], { tab: 'certification', search: '', sort: 'activity' });
    expect(result).toEqual([anbima]);
  });

  it('filters by search across name and provider/examBoard name', () => {
    const result = filterAndSortExams([anbima, inss, draft], { tab: 'all', search: 'cebraspe', sort: 'activity' });
    expect(result).toEqual([inss]);
  });

  it('search is case-insensitive and matches partial exam name', () => {
    const result = filterAndSortExams([anbima, inss, draft], { tab: 'all', search: 'cpa', sort: 'activity' });
    expect(result).toEqual([anbima]);
  });

  it('sorts by name A-Z', () => {
    const result = filterAndSortExams([inss, anbima], { tab: 'all', search: '', sort: 'name' });
    expect(result.map((e) => e.name)).toEqual(['CPA-20', 'INSS Técnico']);
  });

  it('sorts by readiness descending', () => {
    const low = exam({ name: 'Low', readinessPercent: 10 });
    const high = exam({ name: 'High', readinessPercent: 90 });
    const result = filterAndSortExams([low, high], { tab: 'all', search: '', sort: 'readiness' });
    expect(result.map((e) => e.name)).toEqual(['High', 'Low']);
  });

  it('sorts by activity descending, treating a null lastActivityAt as oldest', () => {
    const recent = exam({ name: 'Recent', lastActivityAt: '2026-05-01T00:00:00Z' });
    const stale = exam({ name: 'Stale', lastActivityAt: '2026-01-01T00:00:00Z' });
    const never = exam({ name: 'Never', lastActivityAt: null });
    const result = filterAndSortExams([stale, never, recent], { tab: 'all', search: '', sort: 'activity' });
    expect(result.map((e) => e.name)).toEqual(['Recent', 'Stale', 'Never']);
  });
});
