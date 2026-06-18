import { redirect } from 'next/navigation';

export default function GenerateRedirect() {
  redirect('/certifications/questions?tab=generate');
}
