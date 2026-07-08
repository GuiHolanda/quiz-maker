'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import NextLink from 'next/link';

import { AuthSplitLayout } from '@/app/(auth)/components/AuthSplitLayout';
import api from '@/lib/bff.api';
import { REGISTER_URL } from '@/config/constants';
import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';

export function RegisterForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post(REGISTER_URL, { name, email, password });
      router.push('/verify-email?email=' + encodeURIComponent(email));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };

      if (e.response?.data?.message === 'EMAIL_PENDING_VERIFICATION') {
        router.push('/verify-email?email=' + encodeURIComponent(email));

        return;
      }
      setError(e.response?.data?.message || t('register.failed'));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
          {t('register.title')}
        </h1>
        <p className="text-default-500 text-sm mt-2">
          {t('register.haveAccount')}{' '}
          <Link
            as={NextLink}
            className="text-primary font-semibold transition-opacity hover:opacity-80"
            href="/login"
            size="sm"
          >
            {t('common.signIn')}
          </Link>
        </p>
      </div>

      <Button
        fullWidth
        className="border-default-200 bg-default-100 text-foreground hover:bg-default-200 rounded-lg h-12 transition-colors duration-200 font-medium gap-3"
        startContent={<GoogleIcon />}
        variant="bordered"
        onPress={handleGoogle}
      >
        {t('login.continueWithGoogle')}
      </Button>

      <div className="flex items-center gap-3 my-6">
        <Divider className="flex-1" />
        <span className="text-default-400 text-xs">{t('common.or')}</span>
        <Divider className="flex-1" />
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          autoComplete="name"
          label={t('register.nameLabel')}
          placeholder={t('register.namePlaceholder')}
          type="text"
          value={name}
          onValueChange={setName}
          {...inputProperties.input}
        />
        <Input
          isRequired
          autoComplete="email"
          label={t('login.emailLabel')}
          placeholder={t('login.emailPlaceholder')}
          type="email"
          value={email}
          onValueChange={setEmail}
          {...inputProperties.input}
        />
        <PasswordInput
          isRequired
          autoComplete="new-password"
          description={t('register.passwordHint')}
          label={t('login.passwordLabel')}
          placeholder={t('register.newPasswordPlaceholder')}
          value={password}
          onValueChange={setPassword}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            <p className="text-danger text-xs">{error}</p>
          </div>
        )}

        <Button
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12 mt-1"
          isLoading={loading}
          type="submit"
        >
          {t('register.createAccount')}
        </Button>
      </form>
    </AuthSplitLayout>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

