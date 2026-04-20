'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { RESET_PASSWORD_URL } from '@/config/constants';

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
      <Card className="w-full max-w-md">
        <CardBody className="px-6 py-8 flex flex-col gap-4 items-center text-center">
          <p className="text-danger">Invalid or missing reset token.</p>
          <Link as={NextLink} href="/forgot-password" size="sm">
            Request a new reset link
          </Link>
        </CardBody>
      </Card>
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
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 px-6 pt-6">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-default-500 text-sm">Enter your new password below</p>
      </CardHeader>
      <CardBody className="px-6 pb-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onValueChange={setPassword}
            isRequired
            autoComplete="new-password"
            description="At least 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirm}
            onValueChange={setConfirm}
            isRequired
            autoComplete="new-password"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" color="primary" isLoading={loading} fullWidth>
            Reset Password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
