import { describe, it, expect } from 'vitest';
import { computeExamReadiness } from '@/lib/exam';

describe('computeExamReadiness', () => {
  it('returns 0 when the exam has no sections', () => {
    expect(computeExamReadiness([], [])).toBe(0);
  });

  it('uses topic coverage when sections have topics', () => {
    const sections = [
      { id: 's1', topics: [{ id: 't1' }, { id: 't2' }] },
      { id: 's2', topics: [{ id: 't3' }, { id: 't4' }] },
    ];
    const questions = [
      { sectionId: 's1', topicId: 't1' },
      { sectionId: 's2', topicId: 't3' },
    ];
    expect(computeExamReadiness(sections, questions)).toBe(50);
  });

  it('rounds topic coverage to the nearest percent', () => {
    const sections = [{ id: 's1', topics: [{ id: 't1' }, { id: 't2' }, { id: 't3' }] }];
    const questions = [{ sectionId: 's1', topicId: 't1' }];
    expect(computeExamReadiness(sections, questions)).toBe(33);
  });

  it('falls back to section coverage when no section has topics', () => {
    const sections = [
      { id: 's1', topics: [] },
      { id: 's2', topics: [] },
      { id: 's3', topics: [] },
      { id: 's4', topics: [] },
    ];
    const questions = [{ sectionId: 's1', topicId: null }];
    expect(computeExamReadiness(sections, questions)).toBe(25);
  });

  it('counts a topic once regardless of how many questions cover it', () => {
    const sections = [{ id: 's1', topics: [{ id: 't1' }, { id: 't2' }] }];
    const questions = [
      { sectionId: 's1', topicId: 't1' },
      { sectionId: 's1', topicId: 't1' },
      { sectionId: 's1', topicId: 't1' },
    ];
    expect(computeExamReadiness(sections, questions)).toBe(50);
  });
});
