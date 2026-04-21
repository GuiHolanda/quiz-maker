'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { RESET_PASSWORD_URL } from '@/config/constants';

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

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="clay-card w-full max-w-md px-8 py-12 relative z-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_8px_24px_rgba(239,68,68,0.15)]">
          <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white/80">Invalid reset link</h2>
          <p className="text-white/35 text-sm mt-2">This link is invalid or has expired.</p>
        </div>
        <Link
          as={NextLink}
          href="/forgot-password"
          size="sm"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Request a new reset link →
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post(RESET_PASSWORD_URL, { token, password });
      router.push('/login?reset=success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
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
          New password
        </h1>
        <p className="text-white/35 text-sm mt-1.5">Enter your new password below</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Input
          label="New password"
          type="password"
          value={password}
          onValueChange={setPassword}
          isRequired
          autoComplete="new-password"
          description="At least 8 characters"
          classNames={clayInput}
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onValueChange={setConfirm}
          isRequired
          autoComplete="new-password"
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
          Reset Password
        </Button>
      </form>
    </div>
  );
}
