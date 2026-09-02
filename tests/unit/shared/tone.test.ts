import { describe, it, expect } from 'vitest';

import {
  statusPillToneClasses,
  statusPillSizeClasses,
  iconBadgeToneClasses,
  iconBadgeSizeClasses,
} from '@/shared/components/ui/tone';

describe('statusPillToneClasses', () => {
  it('maps ok to success tokens', () => {
    expect(statusPillToneClasses('ok')).toBe('border-success/30 bg-success/10 text-success');
  });

  it('maps busy to primary tokens', () => {
    expect(statusPillToneClasses('busy')).toBe('border-primary/30 bg-primary/10 text-primary');
  });

  it('maps error to danger tokens', () => {
    expect(statusPillToneClasses('error')).toBe('border-danger/30 bg-danger/10 text-danger');
  });
});

describe('statusPillSizeClasses', () => {
  it('sm is the compact mono pill used in config summaries', () => {
    expect(statusPillSizeClasses('sm')).toBe('px-3 py-1.5 font-mono text-xs');
  });

  it('md is the roomier semibold pill used for job status', () => {
    expect(statusPillSizeClasses('md')).toBe('px-3.5 py-[7px] text-[13px] font-semibold');
  });
});

describe('iconBadgeToneClasses', () => {
  it('maps primary to the soft primary fill used across section headers', () => {
    expect(iconBadgeToneClasses('primary')).toBe('bg-primary/10 text-primary');
  });

  it('maps neutral to the content-2 fill used for inactive badges', () => {
    expect(iconBadgeToneClasses('neutral')).toBe('bg-content2 text-default-400');
  });

  it('maps success and danger to their soft tint', () => {
    expect(iconBadgeToneClasses('success')).toBe('bg-success/15 text-success');
    expect(iconBadgeToneClasses('danger')).toBe('bg-danger/15 text-danger');
  });
});

describe('iconBadgeSizeClasses', () => {
  it('sm is a 32px square with a 14px glyph', () => {
    expect(iconBadgeSizeClasses('sm')).toEqual({ box: 'h-8 w-8 rounded-lg', icon: 'h-3.5 w-3.5' });
  });

  it('md is a 38px square with an 18px glyph', () => {
    expect(iconBadgeSizeClasses('md')).toEqual({ box: 'h-[38px] w-[38px] rounded-lg', icon: 'h-[18px] w-[18px]' });
  });
});
