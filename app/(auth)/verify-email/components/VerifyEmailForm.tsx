'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputOtp } from '@heroui/input-otp';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import { addToast } from '@heroui/toast';

import { AuthSplitLayout } from '@/app/(auth)/components/AuthSplitLayout';
import api from '@/lib/bff.api';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

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

  async function submitCode(value: string) {
    if (value.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify-email', { email, code: value });
      router.push('/login?verified=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };

      setError(e.response?.data?.message ?? t('toast.somethingWrong'));
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitCode(code);
  }

  async function handleResend() {
    setResending(true);
    setCode('');
    setError(null);
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
        <p className="text-default-500 text-sm mt-2 leading-relaxed">
          {t('verify.subtitle', { email })}
        </p>
      </div>

      <form className="flex flex-col items-center gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col items-center gap-3 w-full">
          <p className="text-xs font-medium text-default-500 self-start">{t('verify.codeLabel')}</p>
          <InputOtp
            isDisabled={loading}
            length={6}
            value={code}
            classNames={{
              segmentWrapper: 'gap-2',
              segment: [
                'w-11 h-12 rounded-lg border border-default-200 bg-background',
                'text-base font-semibold text-foreground',
                'data-[active=true]:border-primary data-[active=true]:shadow-[0_0_0_3px_rgb(224_120_32_/_0.12)]',
                'transition-all duration-200',
              ].join(' '),
            }}
            onComplete={(v) => submitCode(v ?? '')}
            onValueChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20 w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            <p className="text-danger text-xs">{error}</p>
          </div>
        )}

        <Button
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-11"
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
