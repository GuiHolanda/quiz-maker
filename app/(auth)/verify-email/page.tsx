import { VerifyEmailForm } from './components/VerifyEmailForm';

interface Props {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return <VerifyEmailForm email={email ?? ''} />;
}
