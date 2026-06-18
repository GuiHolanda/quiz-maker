import { redirect } from 'next/navigation';

export default function GeneratePublicExamRedirect() {
  redirect('/public-exams/questions?tab=generate');
}
