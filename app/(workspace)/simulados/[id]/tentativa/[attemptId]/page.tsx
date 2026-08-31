'use client';

import { useParams } from 'next/navigation';

import { AttemptShell } from './components/AttemptShell';

export default function SimuladoTentativaPage() {
  const params = useParams<{ id: string; attemptId: string }>();

  return <AttemptShell attemptId={Number(params.attemptId)} mockExamId={Number(params.id)} />;
}
