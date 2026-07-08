'use client';

import { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';

import { AuthSplitLayout } from '@/app/(auth)/components/AuthSplitLayout';
import api from '@/lib/bff.api';
import { FORGOT_PASSWORD_URL } from '@/config/constants';
import { inputProperties } from '@/config/constants/inputStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(FORGOT_PASSWORD_URL, { email });
    } catch {
      // intentionally silent — always show success to prevent user enumeration
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <AuthSplitLayout>
        <div className="flex flex-col items-center text-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('forgotPassword.checkInboxTitle')}</h2>
            <p className="text-default-400 text-sm mt-2 leading-relaxed">
              {t('forgotPassword.checkInboxBody', { email })}
            </p>
          </div>
          <Link
            as={NextLink}
            className="text-primary font-medium transition-opacity hover:opacity-80"
            href="/login"
            size="sm"
          >
            &larr; {t('forgotPassword.backToSignIn')}
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
          {t('forgotPassword.title')}
        </h1>
        <p className="text-default-500 text-sm mt-2">{t('forgotPassword.subtitle')}</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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
        <Button
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-11"
          isLoading={loading}
          type="submit"
        >
          {t('forgotPassword.send')}
        </Button>
      </form>

      <p className="text-center text-sm text-default-400 mt-6">
        {t('forgotPassword.remembered')}{' '}
        <Link
          as={NextLink}
          className="text-primary font-semibold transition-opacity hover:opacity-80"
          href="/login"
          size="sm"
        >
          {t('forgotPassword.backToSignIn')}
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
