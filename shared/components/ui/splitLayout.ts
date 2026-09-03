export type SplitVariant = 'summary' | 'editor';

const SPLIT_LAYOUT: Record<SplitVariant, { outer: string; main: string }> = {
  summary: {
    outer: 'flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start',
    main: 'flex min-w-0 flex-col gap-6',
  },
  editor: {
    outer: 'mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_560px] lg:items-start',
    main: 'flex min-w-0 flex-col gap-4',
  },
};

export function splitLayoutClasses(variant: SplitVariant): { outer: string; main: string } {
  return SPLIT_LAYOUT[variant];
}

export function splitRailClasses(sticky: boolean): string {
  return sticky ? 'flex flex-col gap-4 lg:sticky lg:top-20' : 'flex flex-col gap-4';
}
