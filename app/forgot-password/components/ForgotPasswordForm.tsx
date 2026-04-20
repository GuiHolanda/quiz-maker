'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { FORGOT_PASSWORD_URL } from '@/config/constants';

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
      <Card className="w-full max-w-md">
        <CardBody className="px-6 py-8 flex flex-col gap-4 items-center text-center">
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-default-500 text-sm">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
          <Link as={NextLink} href="/login" size="sm">
            Back to sign in
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 px-6 pt-6">
        <h1 className="text-2xl font-bold">Forgot Password</h1>
        <p className="text-default-500 text-sm">Enter your email to receive a reset link</p>
      </CardHeader>
      <CardBody className="px-6 pb-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onValueChange={setEmail}
            isRequired
            autoComplete="email"
          />
          <Button type="submit" color="primary" isLoading={loading} fullWidth>
            Send Reset Link
          </Button>
        </form>
        <p className="text-center text-sm text-default-500">
          Remembered it?{' '}
          <Link as={NextLink} href="/login" size="sm">
            Back to sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
