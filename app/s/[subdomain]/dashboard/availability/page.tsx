'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  useProviders, WEEKDAY_NAMES,
  useAvailabilityBlocks, useCreateAvailabilityBlock, useDeleteAvailabilityBlock,
  useExceptions, useCreateException, useDeleteException,
} from '@/lib/queries';
import { ProviderAvailability } from './ProviderAvailability';

export default function AvailabilityPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: providers = [] } = useProviders(subdomain);
  const [providerId, setProviderId] = useState<number | null>(null);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Availability</h1>

      <label className="text-sm">
        Provider
        <select
          value={providerId ?? ''}
          onChange={(e) => setProviderId(e.target.value ? Number(e.target.value) : null)}
          className="mt-1 block border border-ink/20 px-3 py-2"
        >
          <option value="">Select a provider…</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {providerId !== null && <ProviderAvailability tenantSlug={subdomain} providerId={providerId} />}
    </div>
  );
}

