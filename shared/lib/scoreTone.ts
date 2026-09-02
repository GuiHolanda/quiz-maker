export type ScoreToneName = 'success' | 'warning' | 'danger';

const TEXT: Record<ScoreToneName, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

const BG: Record<ScoreToneName, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function scoreToneName(percent: number): ScoreToneName {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

export function scoreToneText(percent: number): string {
  return TEXT[scoreToneName(percent)];
}

export function scoreToneBg(percent: number): string {
  return BG[scoreToneName(percent)];
}
