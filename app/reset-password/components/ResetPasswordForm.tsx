'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { RESET_PASSWORD_URL } from '@/config/constants';
import { inputProperties } from '@/config/constants/inputStyles';

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
      <div className="bg-content1 border border-default-200 rounded-2xl w-full max-w-md px-8 py-12 relative z-10 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Invalid reset link</h2>
          <p className="text-default-400 text-sm mt-2">This link is invalid or has expired.</p>
        </div>
        <Link
          as={NextLink}
          href="/forgot-password"
          size="sm"
          className="text-primary font-medium transition-opacity hover:opacity-80"
        >
          Request a new reset link &rarr;
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
          New password
        </h1>
        <p className="text-default-400 text-sm mt-1.5">Enter your new password below</p>
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
          {...inputProperties.input}
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onValueChange={setConfirm}
          isRequired
          autoComplete="new-password"
          {...inputProperties.input}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            <p className="text-danger text-xs">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12 mt-1"
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
}
