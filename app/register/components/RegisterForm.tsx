'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';
import NextLink from 'next/link';
import api from '@/lib/bff.api';
import { REGISTER_URL } from '@/config/constants';

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

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

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
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 px-6 pt-6">
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-default-500 text-sm">Start your certification prep journey</p>
      </CardHeader>
      <CardBody className="px-6 pb-6 flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            type="text"
            value={name}
            onValueChange={setName}
            autoComplete="name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onValueChange={setEmail}
            isRequired
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onValueChange={setPassword}
            isRequired
            autoComplete="new-password"
            description="At least 8 characters"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <Button type="submit" color="primary" isLoading={loading} fullWidth>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-default-500">
          Already have an account?{' '}
          <Link as={NextLink} href="/login" size="sm">
            Sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
