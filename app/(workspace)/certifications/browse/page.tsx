import { redirect } from 'next/navigation';

export default function BrowseRedirect() {
  redirect('/certifications/questions?tab=browse');
}
