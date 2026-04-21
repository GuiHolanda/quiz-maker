'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { REGISTER_URL } from '@/config/constants';

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
  description: 'text-white/25 text-xs',
};

export function RegisterForm() {
  const router = useRouter();
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
        setError('Account created but sign-in failed. Please go to the login page.');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
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
          Create account
        </h1>
        <p className="text-white/35 text-sm mt-1.5">Start your certification prep journey</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="Full name"
          type="text"
          value={name}
          onValueChange={setName}
          autoComplete="name"
          classNames={clayInput}
        />
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
          autoComplete="new-password"
          description="At least 8 characters"
          classNames={clayInput}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
            <p className="text-rose-400 text-xs">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-[0_6px_20px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_28px_rgba(139,92,246,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 h-12 mt-1"
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-white/25 mt-6">
        Already have an account?{' '}
        <Link as={NextLink} href="/login" size="sm" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
