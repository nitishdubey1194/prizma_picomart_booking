'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { authClient } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subdomain } = useParams<{ subdomain: string }>();
  const base = "";
  const returnTo = searchParams.get('returnTo') ?? base;
  const [fullname, setFullname] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authClient.register(email, password, mobile, fullname);
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong creating your account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-3xl">Create an account</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          Full Name
          <input
            type="fullname"
            required
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="mt-1 w-full border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Mobile
          <input
            type="mobile"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mt-1 w-full border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border border-ink/20 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-sm bg-brass px-6 py-3 font-medium text-white transition-colors hover:bg-ink disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        Already have an account?{' '}
        <Link href={`${base}/login?returnTo=${encodeURIComponent(returnTo)}`} className="text-brass hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}