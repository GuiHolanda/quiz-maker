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
import { inputProperties } from '@/config/constants/inputStyles';

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
        <h1 className="text-3xl font-bold text-foreground leading-tight">Create account</h1>
        <p className="text-default-400 text-sm mt-1.5">Start your certification prep journey</p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <Input
          autoComplete="name"
          label="Full name"
          type="text"
          value={name}
          onValueChange={setName}
          {...inputProperties.input}
        />
        <Input
          isRequired
          autoComplete="email"
          label="Email address"
          type="email"
          value={email}
          onValueChange={setEmail}
          {...inputProperties.input}
        />
        <Input
          isRequired
          autoComplete="new-password"
          description="At least 8 characters"
          label="Password"
          type="password"
          value={password}
          onValueChange={setPassword}
          {...inputProperties.input}
        />

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
            <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
            <p className="text-danger text-xs">{error}</p>
          </div>
        )}

        <Button
          fullWidth
          className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 h-12 mt-1"
          isLoading={loading}
          type="submit"
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-default-400 mt-6">
        Already have an account?{' '}
        <Link
          as={NextLink}
          className="text-primary font-semibold transition-opacity hover:opacity-80"
          href="/login"
          size="sm"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
