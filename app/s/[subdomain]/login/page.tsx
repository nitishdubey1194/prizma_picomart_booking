'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { authClient, setAuthTokens } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';
import Link from 'next/link';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: number;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ subdomain?: string }>();
  const subdomain = params?.subdomain;

  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const base = subdomain
    ? `${isDev ? 'http' : 'https'}://${subdomain}.${rootDomain}`
    : '';

  // Default to relative root if base cannot be built
  const returnTo = searchParams.get('returnTo') ?? (base || '/');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Call login on authClient
      const res = (await authClient.login(email, password)) as unknown as LoginResponse;

      // 2. Explicitly commit tokens to webTokenStorage if returned
      if (res?.tokens) {
        await setAuthTokens(res.tokens);
      }

      // 3. Navigate: Use full browser reload for cross-subdomain/full URLs,
      // or router.push + router.refresh for relative paths.
      const isExternalOrSubdomain =
        returnTo.startsWith('http://') || returnTo.startsWith('https://');

      if (isExternalOrSubdomain) {
        window.location.href = returnTo;
      } else {
        router.push(returnTo);
        router.refresh();
      }
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Something went wrong signing in.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="font-display text-3xl">Sign in</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-ink/60">
        New here?{' '}
        <Link
          href={`${base}/register?returnTo=${encodeURIComponent(returnTo)}`}
          className="text-brass hover:underline"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}