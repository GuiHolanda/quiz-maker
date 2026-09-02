export type Size = 'sm' | 'md';
export type StatusTone = 'ok' | 'busy' | 'error';
export type IconBadgeTone = 'primary' | 'neutral' | 'success' | 'danger';

const STATUS_PILL_TONE: Record<StatusTone, string> = {
  ok: 'border-success/30 bg-success/10 text-success',
  busy: 'border-primary/30 bg-primary/10 text-primary',
  error: 'border-danger/30 bg-danger/10 text-danger',
};

const STATUS_PILL_SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 font-mono text-xs',
  md: 'px-3.5 py-[7px] text-[13px] font-semibold',
};

const ICON_BADGE_TONE: Record<IconBadgeTone, string> = {
  primary: 'bg-primary/10 text-primary',
  neutral: 'bg-content2 text-default-400',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
};

const ICON_BADGE_SIZE: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-[38px] w-[38px] rounded-lg', icon: 'h-[18px] w-[18px]' },
};

export function statusPillToneClasses(tone: StatusTone): string {
  return STATUS_PILL_TONE[tone];
}

export function statusPillSizeClasses(size: Size): string {
  return STATUS_PILL_SIZE[size];
}

export function iconBadgeToneClasses(tone: IconBadgeTone): string {
  return ICON_BADGE_TONE[tone];
}

export function iconBadgeSizeClasses(size: Size): { box: string; icon: string } {
  return ICON_BADGE_SIZE[size];
}

export function fauxCheckboxClasses(checked: boolean): string {
  return checked ? 'border-primary bg-primary text-primary-foreground' : 'border-default-400';
}
