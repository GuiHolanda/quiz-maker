'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import NextLink from 'next/link';

const flatInput = {
  inputWrapper: [
    'bg-default-100 border border-default-200 rounded-lg',
    'data-[hover=true]:border-default-300',
    'data-[focus=true]:border-primary',
    'transition-colors duration-200',
  ].join(' '),
  input: 'text-foreground placeholder:text-default-400 text-sm',
  label: 'text-default-500 text-xs font-medium',
};

export function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(t('login.invalidCredentials'));
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <div className="bg-content1 border border-default-200 rounded-2xl w-full max-w-md px-8 py-10 relative z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold tracking-tight">AI</span>
        </div>
        <span className="text-default-600 font-semibold text-sm tracking-wide">AIQuiz</span>
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          {t('login.welcomeBack')}
        </h1>
        <p className="text-default-400 text-sm mt-1.5">{t('login.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label={t('login.emailLabel')}
          type="email"
          value={email}
          onValueChange={setEmail}
          isRequired
          autoComplete="email"
          classNames={flatInput}
        />
        <Input
          label={t('login.passwordLabel')}
          type="password"
          value={password}
          onValueChange={setPassword}
          isRequired
          autoComplete="current-password"
          classNames={flatInput}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            <p className="text-danger text-xs">{error}</p>
          </div>
        )}

        <div className="flex justify-end -mt-0.5">
          <Link
            as={NextLink}
            href="/forgot-password"
            size="sm"
            className="text-primary hover:opacity-80 text-xs transition-opacity"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12 mt-1"
        >
          {t('common.signIn')}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <Divider className="flex-1" />
        <span className="text-default-400 text-[11px] font-semibold tracking-[0.15em]">{t('common.or')}</span>
        <Divider className="flex-1" />
      </div>

      {/* Google */}
      <Button
        variant="bordered"
        fullWidth
        onPress={handleGoogle}
        className="border-default-200 bg-default-100 text-foreground hover:bg-default-200 rounded-lg h-12 transition-colors duration-200 font-medium gap-3"
        startContent={
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
      >
        {t('login.continueWithGoogle')}
      </Button>

      <p className="text-center text-sm text-default-400 mt-6">
        {t('login.noAccount')}{' '}
        <Link as={NextLink} href="/register" size="sm" className="text-primary font-semibold transition-opacity hover:opacity-80">
          {t('login.signUp')}
        </Link>
      </p>
    </div>
  );
}
