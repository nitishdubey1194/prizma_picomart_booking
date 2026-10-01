'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  useProviders,
  useCreateProvider,
  useDeleteProvider,
  useEnableProvider,
  useServices,
  useProviderAssignedServices,
} from '@/lib/queries';
import { Provider, Service } from '@/lib/api';
import ProviderServicesModal from '@/components/ProviderServicesModal';
import LinkAccountModal from '@/components/LinkAccountModal';

export const PROVIDER_CATEGORIES = [
  { value: 'barber-shop', label: 'Barber Shop' },
  { value: 'car-wash', label: 'Car Wash' },
  { value: 'salon-spa', label: 'Salon & Spa' },
  { value: 'auto-detailing', label: 'Auto Detailing' },
  { value: 'health-wellness', label: 'Health & Wellness' },
] as const;

export default function ProvidersPage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  // Queries
  const { data: providers = [], isLoading: isLoadingProviders, refetch: refetchProviders } = useProviders(subdomain);
  const { data: allServices = [], isLoading: isLoadingServices } = useServices(subdomain);
  const createProvider = useCreateProvider(subdomain);
  const deleteProvider = useDeleteProvider(subdomain);
  
  const enableProvider = useEnableProvider(subdomain);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<string>(PROVIDER_CATEGORIES[0].value);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedProviderForServices, setSelectedProviderForServices] = useState<Provider | null>(null);
  const [selectedProviderForAccount, setSelectedProviderForAccount] = useState<Provider | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    createProvider.mutate(
      { name, slug, category },
      {
        onSuccess: () => {
          setName('');
          setSlug('');
          setCategory(PROVIDER_CATEGORIES[0].value);
        },
        onError: (err: unknown) => {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Failed to create provider.');
          }
        },
      }
    );
  }

  const isLoading = isLoadingProviders || isLoadingServices;

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm tracking-wide text-ink/60 animate-pulse">Loading providers and catalog…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-col gap-1 border-b border-ink/10 pb-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Staff & Providers</h1>
        <p className="text-sm text-ink/60">
          Manage practitioner profiles, assign bookable services, and connect login accounts.
        </p>
      </div>

      {providers.length === 0 ? (
        <div className="mb-8 rounded-lg border border-dashed border-ink/20 p-8 text-center">
          <p className="text-sm text-ink/60">No providers have been registered for this location yet.</p>
        </div>
      ) : (
        <ul className="mb-8 divide-y divide-ink/10">
          {providers.map((p) => (
            <ProviderRowItem
              key={p.id}
              provider={p}
              tenantSlug={subdomain}
              isDeleting={deleteProvider.isPending}
              onManageAccount={() => setSelectedProviderForAccount(p)}
              onManageServices={() => setSelectedProviderForServices(p)}
              onDelete={() => deleteProvider.mutate(p.id)}
              onEnable={() => enableProvider.mutate({
                providerId: p.id,
                isActive: !(p.isActive ?? true),
              })}
            />
          ))}
        </ul>
      )}

      {/* Provider Creation Form */}
      <div className="rounded-lg border border-ink/10 bg-white/50 p-6 shadow-sm dark:bg-zinc-900/50">
        <h2 className="mb-4 text-base font-semibold text-ink">Add New Provider</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <label className="flex-1 min-w-[200px] text-xs font-medium uppercase tracking-wider text-ink/70">
            Full Name
            <input
              required
              placeholder="e.g. Downtown Barber Co."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                }
              }}
              className="mt-1.5 block w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800"
            />
          </label>

          <label className="flex-1 min-w-[180px] text-xs font-medium uppercase tracking-wider text-ink/70">
            URL Slug
            <input
              required
              placeholder="downtown-barber"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1.5 block w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800"
            />
          </label>

          {/* Category Dropdown */}
          <label className="flex-1 min-w-[180px] text-xs font-medium uppercase tracking-wider text-ink/70">
            Specialty / Category
            <div className="relative mt-1.5">
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full appearance-none rounded border border-ink/20 bg-white px-3 py-2 text-sm font-normal text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800 cursor-pointer"
              >
                {PROVIDER_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-white text-ink dark:bg-zinc-800 dark:text-zinc-100">
                    {cat.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-ink/40">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </label>

          <button
            type="submit"
            disabled={createProvider.isPending}
            className="h-[38px] rounded bg-brass px-5 text-sm font-medium text-white transition-colors hover:bg-ink disabled:opacity-50"
          >
            {createProvider.isPending ? 'Adding…' : 'Add Provider'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Service Assignment Modal */}
      {selectedProviderForServices && (
        <ProviderServicesModalWrapper
          tenantSlug={subdomain}
          provider={selectedProviderForServices}
          allServices={allServices}
          onClose={() => setSelectedProviderForServices(null)}
          onDataChanged={() => {
            void refetchProviders();
          }}
        />
      )}

      {/* Link Account Modal */}
      {selectedProviderForAccount && (
        <LinkAccountModal
          isOpen={true}
          tenantSlug={subdomain}
          provider={selectedProviderForAccount}
          onClose={() => setSelectedProviderForAccount(null)}
          onRefresh={async () => {
            const { data } = await refetchProviders();
            if (data) {
              const updated = data.find((p) => p.id === selectedProviderForAccount.id);
              if (updated) setSelectedProviderForAccount(updated);
            }
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row Item Component
// ---------------------------------------------------------------------------

interface ProviderRowItemProps {
  provider: Provider;
  tenantSlug: string;
  isDeleting: boolean;
  onManageAccount: () => void;
  onManageServices: () => void;
  onDelete: () => void;
  onEnable: () => void;
}

function ProviderRowItem({
  provider,
  tenantSlug,
  isDeleting,
  onManageAccount,
  onManageServices,
  onDelete,
  onEnable
}: ProviderRowItemProps) {
  const { data: assigned = [], isLoading } = useProviderAssignedServices(tenantSlug, provider.id);
  const displayEmail = provider.userLinkEmail || (provider.userId?.includes('@') ? provider.userId : null);

  const categoryLabel =
    PROVIDER_CATEGORIES.find((c) => c.value === provider.category)?.label || provider.category;

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{provider.name}</span>
            <span className="rounded bg-ink/5 px-2 py-0.5 text-xs text-ink/60">
              {categoryLabel}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-ink/50">
            <span>Slug: /{provider.slug}</span>
            <span>·</span>
            <span>
              {isLoading
                ? 'Loading services…'
                : `${assigned.length} ${assigned.length === 1 ? 'service' : 'services'} mapped`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onManageServices}
            className="rounded border border-ink/20 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brass hover:text-brass"
          >
            Assign Services ({assigned.length})
          </button>

          <button
            type="button"
            onClick={onManageAccount}
            className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
              displayEmail || provider.userId
                ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:border-emerald-400 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-ink/20 text-ink hover:border-brass hover:text-brass'
            }`}
          >
            {displayEmail ? `Account: ${displayEmail}` : provider.userId ? 'Account Linked' : '+ Link Account'}
          </button>

          <button
            type="button"
            onClick={provider.isActive ? onDelete : onEnable}
            disabled={isDeleting}
            className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
              provider.isActive
                ? 'border-red-300 bg-red-50/60 text-red-800 hover:border-red-400 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300'
                : 'border-green-300 bg-green-50/60 text-green-800 hover:border-green-400 dark:border-green-800/40 dark:bg-green-950/40 dark:text-green-300'
            }`}
          >
            {provider.isActive ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Service Modal Connector
// ---------------------------------------------------------------------------

interface ProviderServicesModalWrapperProps {
  tenantSlug: string;
  provider: Provider;
  allServices: Service[];
  onClose: () => void;
  onDataChanged: () => void;
}

function ProviderServicesModalWrapper({
  tenantSlug,
  provider,
  allServices,
  onClose,
  onDataChanged,
}: ProviderServicesModalWrapperProps) {
  const { data: assigned = [], refetch } = useProviderAssignedServices(tenantSlug, provider.id);

  const handleRefresh = async (): Promise<void> => {
    await refetch();
    onDataChanged();
  };

  return (
    <ProviderServicesModal
      isOpen={true}
      onClose={onClose}
      tenantSlug={tenantSlug}
      provider={provider}
      allServices={allServices}
      assignedServices={assigned}
      onRefresh={handleRefresh}
    />
  );
}