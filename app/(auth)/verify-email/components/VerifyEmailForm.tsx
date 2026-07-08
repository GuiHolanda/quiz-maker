'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import { addToast } from '@heroui/toast';

import { AuthSplitLayout } from '@/app/(auth)/components/AuthSplitLayout';
import api from '@/lib/bff.api';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface VerifyEmailFormProps {
  readonly email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify-email', { email, code });
      router.push('/login?verified=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };

      setError(e.response?.data?.message ?? t('toast.somethingWrong'));
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      addToast({ title: t('toast.success'), description: t('verify.resendSuccess'), color: 'success' });
    } catch {
      addToast({ title: t('toast.error'), description: t('toast.somethingWrong'), color: 'danger' });
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight">
          {t('verify.title')}
        </h1>
        <p className="text-default-500 text-sm mt-2">
          {t('verify.subtitle', { email })}
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <Input
          isRequired
          inputMode="numeric"
          label={t('verify.codeLabel')}
          maxLength={6}
          placeholder={t('verify.codePlaceholder')}
          type="text"
          value={code}
          onValueChange={setCode}
          {...inputProperties.input}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            <p className="text-danger text-xs">{error}</p>
          </div>
        )}

        <Button
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12"
          isLoading={loading}
          type="submit"
        >
          {t('verify.submit')}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-3 items-center">
        <Button
          className="text-primary text-sm font-medium hover:opacity-80 transition-opacity"
          isLoading={resending}
          variant="light"
          onPress={handleResend}
        >
          {t('verify.resend')}
        </Button>

        <Link
          as={NextLink}
          className="text-default-400 text-xs hover:opacity-80 transition-opacity"
          href="/register"
          size="sm"
        >
          {t('verify.useOtherEmail')}
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
