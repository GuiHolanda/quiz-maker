import { redirect } from 'next/navigation';

export default function BrowsePublicExamRedirect() {
  redirect('/public-exams/questions?tab=browse');
}
