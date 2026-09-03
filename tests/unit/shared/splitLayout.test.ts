import { describe, it, expect } from 'vitest';

import { splitLayoutClasses, splitRailClasses } from '@/shared/components/ui/splitLayout';

describe('splitLayoutClasses', () => {
  it('summary variant keeps the main column overflow-safe and the rail at 360px', () => {
    const { outer, main } = splitLayoutClasses('summary');

    expect(outer).toContain('lg:grid-cols-[minmax(0,1fr)_360px]');
    expect(outer).toContain('lg:items-start');
    expect(main).toContain('min-w-0');
  });

  it('editor variant uses the wide 560px rail and the stepper top margin', () => {
    const { outer, main } = splitLayoutClasses('editor');

    expect(outer).toContain('lg:grid-cols-[1fr_560px]');
    expect(outer).toContain('mt-7');
    expect(main).toContain('min-w-0');
  });
});

describe('splitRailClasses', () => {
  it('is a plain vertical stack when not sticky', () => {
    expect(splitRailClasses(false)).toBe('flex flex-col gap-4');
  });

  it('pins to the top on lg when sticky', () => {
    expect(splitRailClasses(true)).toBe('flex flex-col gap-4 lg:sticky lg:top-20');
  });
});
