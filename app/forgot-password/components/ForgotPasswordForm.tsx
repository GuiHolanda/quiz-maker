'use client';

import { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { FORGOT_PASSWORD_URL } from '@/config/constants';

const flatInput = {
  inputWrapper: [
    'bg-default-100 border border-default-200 rounded-lg',
    'data-[hover=true]:border-default-300',
    'data-[focus=true]:border-primary',
    'transition-colors duration-200',
  ].join(' '),
  input: 'text-foreground placeholder:text-default-400 text-sm',
  label: 'text-default-500 text-xs font-medium',
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
      <div className="bg-content1 border border-default-200 rounded-2xl w-full max-w-md px-8 py-12 relative z-10 flex flex-col items-center text-center gap-5">
        {/* Check icon */}
        <div className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-success">
            Check your inbox
          </h2>
          <p className="text-default-400 text-sm mt-2 leading-relaxed">
            If an account exists for{' '}
            <span className="text-foreground font-medium">{email}</span>
            , we&apos;ve sent a password reset link.
          </p>
        </div>

        <Link
          as={NextLink}
          href="/login"
          size="sm"
          className="text-primary font-medium transition-opacity hover:opacity-80"
        >
          &larr; Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-content1 border border-default-200 rounded-2xl w-full max-w-md px-8 py-10 relative z-10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-white text-xs font-bold tracking-tight">AI</span>
        </div>
        <span className="text-default-600 font-semibold text-sm tracking-wide">AIQuiz</span>
      </div>

      {/* Heading */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          Reset password
        </h1>
        <p className="text-default-400 text-sm mt-1.5">Enter your email to receive a reset link</p>
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
          classNames={flatInput}
        />
        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12"
        >
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-default-400 mt-6">
        Remembered it?{' '}
        <Link as={NextLink} href="/login" size="sm" className="text-primary font-semibold transition-opacity hover:opacity-80">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
