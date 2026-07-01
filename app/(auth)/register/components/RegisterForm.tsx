'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
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
      const result = await signIn('credentials', { email, password, redirect: false });

      if (result?.error) {
        setError(t('register.signInAfterCreateFailed'));
        setLoading(false);

        return;
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || t('register.failed'));
      setLoading(false);
    }
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
