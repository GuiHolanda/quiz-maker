import { redirect } from 'next/navigation';
import type { ExamType } from '@/shared/types';
import { NewExamPage } from './components/NewExamPage';

interface NewExamRouteProps {
  readonly searchParams: Promise<{ type?: string }>;
}

export default async function NewExamRoute({ searchParams }: NewExamRouteProps) {
  const { type } = await searchParams;

  if (type !== 'certification' && type !== 'public_exam') {
    redirect('/exams?type=certification');
  }

  return <NewExamPage type={type as ExamType} />;
}
