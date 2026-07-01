'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';

import { AuthSplitLayout } from '@/app/(auth)/components/AuthSplitLayout';
import api from '@/lib/bff.api';
import { RESET_PASSWORD_URL } from '@/config/constants';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';

export function ResetPasswordForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AuthSplitLayout>
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('resetPassword.invalidTitle')}</h2>
            <p className="text-default-400 text-sm mt-2">{t('resetPassword.invalidBody')}</p>
          </div>
          <Link
            as={NextLink}
            className="text-primary font-medium transition-opacity hover:opacity-80"
            href="/forgot-password"
            size="sm"
          >
            {t('resetPassword.requestNewLink')} &rarr;
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t('resetPassword.passwordsDoNotMatch'));

      return;
    }
    if (password.length < 8) {
      setError(t('resetPassword.minLength'));

      return;
    }
    setLoading(true);
    try {
      await api.post(RESET_PASSWORD_URL, { token, password });
      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.response?.data?.message || t('resetPassword.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
          {t('resetPassword.title')}
        </h1>
        <p className="text-default-500 text-sm mt-2">{t('resetPassword.subtitle')}</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <PasswordInput
          isRequired
          autoComplete="new-password"
          description={t('register.passwordHint')}
          label={t('resetPassword.newPasswordLabel')}
          placeholder={t('register.newPasswordPlaceholder')}
          value={password}
          onValueChange={setPassword}
        />
        <PasswordInput
          isRequired
          autoComplete="new-password"
          label={t('resetPassword.confirmLabel')}
          placeholder={t('register.newPasswordPlaceholder')}
          value={confirm}
          onValueChange={setConfirm}
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
          {t('resetPassword.submit')}
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
