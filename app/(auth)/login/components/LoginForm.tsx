'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthSplitLayout } from '@/app/(auth)/components/AuthSplitLayout';
import { GoogleIcon } from '@/app/(auth)/components/GoogleIcon';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { PasswordInput } from '@/shared/components/ui/PasswordInput';

const formEntrance = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

const bannerEntrance = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: { opacity: 1, height: 'auto', marginBottom: 16, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isJustVerified = searchParams.get('verified') === '1';
  const isPasswordReset = searchParams.get('reset') === 'success';

  const oauthErrorParam = searchParams.get('error');
  const oauthError =
    oauthErrorParam === 'OAuthAccountNotLinked'
      ? t('login.oauthAccountNotLinked')
      : oauthErrorParam
        ? t('login.oauthError')
        : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn('credentials', { email, password, redirect: false });

    setLoading(false);
    if (result?.error === 'EMAIL_NOT_VERIFIED') {
      setError(t('login.emailNotVerified'));

      return;
    }
    if (result?.error) {
      setError(t('login.invalidCredentials'));

      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  return (
    <AuthSplitLayout page="login">
      <motion.div animate="visible" initial="hidden" variants={formEntrance}>
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight text-wrap-balance">
            {t('login.welcomeBack')}
          </h1>
          <p className="text-default-500 text-sm mt-2">
            {t('login.noAccount')}{' '}
            <Link
              as={NextLink}
              className="text-primary font-semibold transition-opacity hover:opacity-80"
              href="/register"
              size="sm"
            >
              {t('login.signUp')}
            </Link>
          </p>
        </div>

        <AnimatePresence initial={false} mode="wait">
          {isJustVerified && (
            <motion.div
              key="verified"
              animate="visible"
              exit="exit"
              initial="hidden"
              variants={bannerEntrance}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/10 border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                <p className="text-success text-xs">{t('login.emailVerifiedSuccess')}</p>
              </div>
            </motion.div>
          )}
          {isPasswordReset && !isJustVerified && (
            <motion.div
              key="reset"
              animate="visible"
              exit="exit"
              initial="hidden"
              variants={bannerEntrance}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/10 border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                <p className="text-success text-xs">{t('login.passwordResetSuccess')}</p>
              </div>
            </motion.div>
          )}
          {oauthError && (
            <motion.div
              key="oauth-error"
              animate="visible"
              exit="exit"
              initial="hidden"
              variants={bannerEntrance}
            >
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
                <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                <p className="text-danger text-xs">{oauthError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            fullWidth
            className="border-default-200 bg-default-100 text-foreground hover:bg-default-200 rounded-lg h-12 transition-colors duration-200 font-medium gap-3"
            startContent={<GoogleIcon />}
            variant="bordered"
            onPress={handleGoogle}
          >
            {t('login.continueWithGoogle')}
          </Button>
        </motion.div>

        <div className="flex items-center gap-3 my-6">
          <Divider className="flex-1" />
          <span className="text-default-400 text-xs">{t('common.or')}</span>
          <Divider className="flex-1" />
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
          <PasswordInput
            isRequired
            autoComplete="current-password"
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onValueChange={setPassword}
          />

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                key="form-error"
                animate="visible"
                exit="exit"
                initial="hidden"
                variants={bannerEntrance}
              >
                <div className="flex flex-col gap-1 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
                    <p className="text-danger text-xs">{error}</p>
                  </div>
                  {error === t('login.emailNotVerified') && (
                    <Link
                      as={NextLink}
                      className="text-primary text-xs font-semibold hover:opacity-80 transition-opacity ml-3.5"
                      href={`/verify-email?email=${encodeURIComponent(email)}`}
                      size="sm"
                    >
                      {t('login.verifyNow')}
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end">
            <Link
              as={NextLink}
              className="text-primary hover:opacity-80 text-xs transition-opacity"
              href="/forgot-password"
              size="sm"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              fullWidth
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12"
              isLoading={loading}
              type="submit"
            >
              {t('common.signIn')}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </AuthSplitLayout>
  );
}
