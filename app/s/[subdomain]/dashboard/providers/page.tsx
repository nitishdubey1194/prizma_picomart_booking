'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useProviders, useCreateProvider, useDeleteProvider, useUserSearch, useLinkProvider } from '@/lib/queries';

export default function ProvidersPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: providers = [], isLoading } = useProviders(subdomain);
  const createProvider = useCreateProvider(subdomain);
  const deleteProvider = useDeleteProvider(subdomain);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [linkingProviderId, setLinkingProviderId] = useState<number | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    createProvider.mutate(
      { name, slug, category },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          setCategory('');
        },
        onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create provider.'),
      }
    );
  }

  if (isLoading) return <p className="text-ink/60">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Providers</h1>

      <ul className="mb-8">
        {providers.map((p) => (
          <li key={p.id} className="ledger-row py-3">
            <div className="flex items-center justify-between">
              <span>
                {p.name} <span className="text-ink/50">· {p.category}</span>
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setLinkingProviderId(linkingProviderId === p.id ? null : p.id)}
                  className="text-sm text-brass hover:underline"
                >
                  {linkingProviderId === p.id ? 'Cancel' : 'Link account'}
                </button>
                <button
                  onClick={() => deleteProvider.mutate(p.id)}
                  disabled={deleteProvider.isPending}
                  className="text-sm text-red-700 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
            {linkingProviderId === p.id && (
              <LinkProviderPicker
                tenantSlug={subdomain}
                providerId={p.id}
                onDone={() => setLinkingProviderId(null)}
              />
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 border-t border-ink/10 pt-6">
        <label className="text-sm">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
        </label>
        <label className="text-sm">
          Slug
          <input required value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
        </label>
        <label className="text-sm">
          Category
          <input required value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
        </label>
        <button
          type="submit"
          disabled={createProvider.isPending}
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-white hover:bg-ink disabled:opacity-60"
        >
          Add provider
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function LinkProviderPicker({
  tenantSlug,
  providerId,
  onDone,
}: {
  tenantSlug: string;
  providerId: number;
  onDone: () => void;
}) {
  const [email, setEmail] = useState('');
  const { data: results = [], isFetching } = useUserSearch(tenantSlug, email);
  const linkProvider = useLinkProvider(tenantSlug);
  const [linkError, setLinkError] = useState<string | null>(null);

  return (
    <div className="mt-3 border border-ink/10 bg-white/40 p-4">
      <label className="text-sm">
        Search by email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          className="mt-1 block w-full border border-ink/20 px-3 py-2"
        />
      </label>

      {isFetching && <p className="mt-2 text-sm text-ink/50">Searching…</p>}

      {!isFetching && email.length >= 3 && results.length === 0 && (
        <p className="mt-2 text-sm text-ink/50">No matching accounts.</p>
      )}

      <ul className="mt-2">
        {results.map((u) => (
          <li key={u.id} className="flex items-center justify-between py-1.5 text-sm">
            <span>{u.email}</span>
            <button
              onClick={() => {
                setLinkError(null);
                linkProvider.mutate(
                  { providerId, userId: u.id },
                  {
                    onSuccess: onDone,
                    onError: (err) => setLinkError(err instanceof Error ? err.message : 'Failed to link.'),
                  }
                );
              }}
              disabled={linkProvider.isPending}
              className="text-brass hover:underline disabled:opacity-50"
            >
              Link
            </button>
          </li>
        ))}
      </ul>
      {linkError && <p className="mt-2 text-sm text-red-700">{linkError}</p>}
    </div>
  );
}