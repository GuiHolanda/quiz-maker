'use client';

import { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { FORGOT_PASSWORD_URL } from '@/config/constants';

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

export function ForgotPasswordForm() {
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
      <div className="clay-card w-full max-w-md px-8 py-12 relative z-10 flex flex-col items-center text-center gap-5">
        {/* Check icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.2)]">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
            Check your inbox
          </h2>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            If an account exists for{' '}
            <span className="text-white/70 font-medium">{email}</span>
            , we&apos;ve sent a password reset link.
          </p>
        </div>

        <Link
          as={NextLink}
          href="/login"
          size="sm"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    );
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
          Reset password
        </h1>
        <p className="text-white/35 text-sm mt-1.5">Enter your email to receive a reset link</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onValueChange={setEmail}
          isRequired
          autoComplete="email"
          classNames={clayInput}
        />
        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-[0_6px_20px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_28px_rgba(139,92,246,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 h-12"
        >
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-white/25 mt-6">
        Remembered it?{' '}
        <Link as={NextLink} href="/login" size="sm" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
