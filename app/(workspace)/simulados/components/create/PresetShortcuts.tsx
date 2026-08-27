import type { Exam } from '@/shared/types';
import type { SimuladoFormState } from './simuladoFormState';

interface PresetShortcutsProps {
  readonly exam?: Exam | null;
  readonly onApply?: (patch: Partial<SimuladoFormState>) => void;
}

export function PresetShortcuts(_props: PresetShortcutsProps) {
  return null;
}
