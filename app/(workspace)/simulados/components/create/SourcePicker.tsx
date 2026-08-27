import type { MockExamQuestionSource } from '@/shared/types';

interface SourcePickerProps {
  readonly value?: MockExamQuestionSource;
  readonly examId?: string | null;
  readonly onChange?: (value: MockExamQuestionSource) => void;
}

export function SourcePicker(_props: SourcePickerProps) {
  return null;
}
