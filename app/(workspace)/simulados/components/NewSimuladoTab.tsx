'use client';

import { NewMockExamForm } from './NewMockExamForm';

interface NewSimuladoTabProps {
  readonly onCreated: () => void;
}

export function NewSimuladoTab({ onCreated }: NewSimuladoTabProps) {
  return <NewMockExamForm onCreated={onCreated} />;
}
