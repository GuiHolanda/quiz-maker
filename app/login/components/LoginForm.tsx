'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import NextLink from 'next/link';

const clayInput = {
  inputWrapper: [
    'bg-white/5 border border-white/10 rounded-2xl',
    'shadow-[inset_0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)]',
    'data-[hover=true]:bg-white/[0.08] data-[hover=true]:border-violet-500/40',
    'data-[focus=true]:border-violet-500/60 data-[focus=true]:bg-white/[0.08]',
    'transition-all duration-200',
  ].join(' '),
  input: 'text-white/90 placeholder:text-white/30 text-sm',
  label: 'text-white/50 text-xs font-medium',
};

export function LoginForm() {
  const router = useRouter();
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
      setError('Invalid email or password');
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/' });
  }

  return (
    <div className="clay-card w-full max-w-md px-8 py-10 relative z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-[0_4px_14px_rgba(139,92,246,0.6)]">
          <span className="text-white text-xs font-bold tracking-tight">AI</span>
        </div>
        <span className="text-white/70 font-semibold text-sm tracking-wide">AIQuiz</span>
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-300 via-violet-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
          Welcome back
        </h1>
        <p className="text-white/35 text-sm mt-1.5">Sign in to continue your prep journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Email address"
          type="email"
          value={email}
          onValueChange={setEmail}
          isRequired
          autoComplete="email"
          classNames={clayInput}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onValueChange={setPassword}
          isRequired
          autoComplete="current-password"
          classNames={clayInput}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
            <p className="text-rose-400 text-xs">{error}</p>
          </div>
        )}

        <div className="flex justify-end -mt-0.5">
          <Link
            as={NextLink}
            href="/forgot-password"
            size="sm"
            className="text-violet-400/70 hover:text-violet-400 text-xs transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-[0_6px_20px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_28px_rgba(139,92,246,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 h-12 mt-1"
        >
          Sign In
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <Divider className="clay-divider flex-1" />
        <span className="text-white/25 text-[11px] font-semibold tracking-[0.15em]">OR</span>
        <Divider className="clay-divider flex-1" />
      </div>

      {/* Google */}
      <Button
        variant="bordered"
        fullWidth
        onPress={handleGoogle}
        className="border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:border-white/20 hover:text-white/80 rounded-2xl h-12 transition-all duration-200 font-medium gap-3"
        startContent={
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        }
      >
        Continue with Google
      </Button>

      <p className="text-center text-sm text-white/25 mt-6">
        Don&apos;t have an account?{' '}
        <Link as={NextLink} href="/register" size="sm" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
