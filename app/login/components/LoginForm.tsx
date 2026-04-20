'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import NextLink from 'next/link';

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

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

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
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 px-6 pt-6">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-default-500 text-sm">Welcome back to MyQuiz</p>
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
          <Input
            label="Password"
            type="password"
            value={password}
            onValueChange={setPassword}
            isRequired
            autoComplete="current-password"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex justify-end">
            <Link as={NextLink} href="/forgot-password" size="sm">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" color="primary" isLoading={loading} fullWidth>
            Sign In
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Divider className="flex-1" />
          <span className="text-default-400 text-xs">OR</span>
          <Divider className="flex-1" />
        </div>

        <Button variant="bordered" fullWidth onPress={handleGoogle}>
          Continue with Google
        </Button>

        <p className="text-center text-sm text-default-500">
          Don&apos;t have an account?{' '}
          <Link as={NextLink} href="/register" size="sm">
            Sign up
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
