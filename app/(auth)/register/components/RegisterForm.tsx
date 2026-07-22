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
import { GoogleIcon } from '@/app/(auth)/components/GoogleIcon';
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

      setError(e.response?.data?.message || t('register.failed'));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <AuthSplitLayout page="register">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight text-wrap-balance">
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
        {t('register.continueWithGoogle')}
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
          label={t('register.emailLabel')}
          placeholder={t('register.emailPlaceholder')}
          type="email"
          value={email}
          onValueChange={setEmail}
          {...inputProperties.input}
        />
        <PasswordInput
          isRequired
          autoComplete="new-password"
          description={t('register.passwordHint')}
          label={t('register.passwordLabel')}
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
