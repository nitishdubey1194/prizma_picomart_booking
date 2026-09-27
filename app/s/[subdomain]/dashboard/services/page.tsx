'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useServices, useCreateService, useDeleteService } from '@/lib/queries';

export default function ServicesPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: services = [], isLoading } = useServices(subdomain);
  const createService = useCreateService(subdomain);
  const deleteService = useDeleteService(subdomain);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    createService.mutate(
      { name, slug, durationMinutes, price },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          setDurationMinutes(30);
          setPrice(0);
        },
        onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create service.'),
      }
    );
  }

  if (isLoading) return <p className="text-ink/60">Loading…</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Services</h1>

      <ul className="mb-8">
        {services.map((s) => (
          <li key={s.id} className="ledger-row flex items-center justify-between py-3">
            <span>
              {s.name} <span className="text-ink/50">· {s.durationMinutes} min · ₹{s.price}</span>
            </span>
            <button
              onClick={() => deleteService.mutate(s.id)}
              disabled={deleteService.isPending}
              className="text-sm text-red-700 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
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
          Duration (min)
          <input
            type="number"
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="mt-1 block w-24 border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Price (₹)
          <input
            type="number"
            required
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 block w-24 border border-ink/20 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={createService.isPending}
          className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-white hover:bg-ink disabled:opacity-60"
        >
          Add service
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}