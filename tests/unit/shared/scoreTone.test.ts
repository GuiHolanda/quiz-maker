import { describe, it, expect } from 'vitest';

import { scoreToneName, scoreToneText, scoreToneBg } from '@/shared/lib/scoreTone';

describe('scoreToneName', () => {
  it('70 and up is success', () => {
    expect(scoreToneName(70)).toBe('success');
    expect(scoreToneName(100)).toBe('success');
  });

  it('50 to 69 is warning', () => {
    expect(scoreToneName(50)).toBe('warning');
    expect(scoreToneName(69)).toBe('warning');
  });

  it('below 50 is danger', () => {
    expect(scoreToneName(49)).toBe('danger');
    expect(scoreToneName(0)).toBe('danger');
  });
});

describe('scoreToneText / scoreToneBg', () => {
  it('map the tone to its tailwind text token', () => {
    expect(scoreToneText(85)).toBe('text-success');
    expect(scoreToneText(60)).toBe('text-warning');
    expect(scoreToneText(30)).toBe('text-danger');
  });

  it('map the tone to its tailwind fill token', () => {
    expect(scoreToneBg(85)).toBe('bg-success');
    expect(scoreToneBg(60)).toBe('bg-warning');
    expect(scoreToneBg(30)).toBe('bg-danger');
  });
});
