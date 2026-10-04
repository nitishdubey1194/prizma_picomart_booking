'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  useProviders,
  useCreateProvider,
  useDeleteProvider,
  useEnableProvider,
  useServices,
  useProviderAssignedServices,
  useCurrentUser,
} from '@/lib/queries';
import { Provider, Service } from '@/lib/api';
import ProviderServicesModal from '@/components/ProviderServicesModal';
import LinkAccountModal from '@/components/LinkAccountModal';
import { PermissionDenied } from '@/components/PermissionDenied';

// ---------------------------------------------------------------------------
// Constants & Configuration
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 5;

export const PROVIDER_CATEGORIES = [
  { value: 'barber-shop', label: 'Barber Shop' },
  { value: 'car-wash', label: 'Car Wash' },
  { value: 'salon-spa', label: 'Salon & Spa' },
  { value: 'auto-detailing', label: 'Auto Detailing' },
  { value: 'health-wellness', label: 'Health & Wellness' },
] as const;

// ---------------------------------------------------------------------------
// SVG Icon Components
// ---------------------------------------------------------------------------

const Icons = {
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
  ),
  Users: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  UserPlus: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
  ),
  Link: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  ),
  Briefcase: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  ),
  Power: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
  ),
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  CheckCircle2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
  )
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProvidersPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
    
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

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedProviderForServices, setSelectedProviderForServices] = useState<Provider | null>(null);
  const [selectedProviderForAccount, setSelectedProviderForAccount] = useState<Provider | null>(null);

  // Filter providers across name, slug, and category label/value
  const filteredProviders = useMemo(() => {
    if (!searchTerm.trim()) return providers;
    const term = searchTerm.toLowerCase();

    return providers.filter((p) => {
      const categoryLabel =
        PROVIDER_CATEGORIES.find((c) => c.value === p.category)?.label.toLowerCase() || '';
      return (
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        categoryLabel.includes(term) ||
        (p.userLinkEmail && p.userLinkEmail.toLowerCase().includes(term))
      );
    });
  }, [providers, searchTerm]);

  const totalPages = Math.ceil(filteredProviders.length / ITEMS_PER_PAGE) || 1;
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  const isLoading = isLoadingProviders || isLoadingServices || loadingUser;
  const isVendor = user?.role ? Array.isArray(user.role) ? user.role.includes('vendor') : user.role === 'vendor' : false;
  if(!isVendor) {
    if (!isLoading && !isVendor) {
    return (
      <PermissionDenied
        type="role_mismatch"
        currentIdentity={user?.email}
        currentRole={user?.role ?? 'Specialist / Practitioner'}
        requiredRole="Studio Vendor / Store Owner"
        fallbackHref={`/dashboard/my-bookings`}
        fallbackLabel="Return to Homepage"
      />
    );
  }
  }
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-display">Staff & Providers</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Manage practitioner profiles, assign bookable services, and connect login accounts.
            </p>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
              <Icons.Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {providers.length} {providers.length === 1 ? 'Provider' : 'Providers'}
              </span>
            </div>
          )}
        </div>

        {/* Global Loading State */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-white border border-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-100 border border-gray-200 rounded-2xl"></div>
            <div className="h-32 bg-gray-100 border border-gray-200 rounded-2xl"></div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Create New Provider Form Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.UserPlus className="w-5 h-5 text-gray-400" />
                  Add New Provider
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row md:items-end gap-5">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Full Name
                    </label>
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
                      className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      URL Slug
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm pointer-events-none">
                        /
                      </span>
                      <input
                        required
                        placeholder="downtown-barber"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="block w-full rounded-xl border border-gray-300 bg-white pl-7 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Specialty
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                      >
                        {PROVIDER_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createProvider.isPending}
                    className="w-full md:w-auto mt-4 md:mt-0 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center min-w-[140px]"
                  >
                    {createProvider.isPending ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Adding...
                      </span>
                    ) : (
                      'Add Provider'
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3 border border-red-100 flex items-center gap-2">
                    <Icons.AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Icons.Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, slug, specialty, or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                />
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-500">
                  Found {filteredProviders.length} matching {filteredProviders.length === 1 ? 'provider' : 'providers'}
                </div>
              )}
            </div>

            {/* Providers Listing or Empty States */}
            {providers.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-2xl border-dashed">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Icons.Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">No providers found</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                  Get started by adding your first staff member or service provider above.
                </p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Icons.Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium">No matches found</p>
                <p className="text-sm text-gray-500 mt-1">We could not find any provider matching {searchTerm}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedProviders.map((p) => (
                  <ProviderRowItem
                    key={p.id}
                    provider={p}
                    tenantSlug={subdomain}
                    isDeleting={deleteProvider.isPending}
                    onManageAccount={() => setSelectedProviderForAccount(p)}
                    onManageServices={() => setSelectedProviderForServices(p)}
                    onDelete={() => deleteProvider.mutate(p.id)}
                    onEnable={() =>
                      enableProvider.mutate({
                        providerId: p.id,
                        isActive: !(p.isActive ?? true),
                      })
                    }
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredProviders.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

          </div>
        )}

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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider Card Component
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
  onEnable,
}: ProviderRowItemProps) {
  const { data: assigned = [], isLoading } = useProviderAssignedServices(tenantSlug, provider.id);
  const displayEmail = provider.userLinkEmail || (provider.userId?.includes('@') ? provider.userId : null);

  const categoryLabel = PROVIDER_CATEGORIES.find((c) => c.value === provider.category)?.label || provider.category;
  const isActive = provider.isActive ?? true;

  const initials = provider.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`group flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-white rounded-2xl border ${
        isActive ? 'border-gray-200' : 'border-gray-200/50 bg-gray-50/50'
      } shadow-sm transition-all hover:shadow-md relative overflow-hidden`}
    >
      {!isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gray-300"></div>
      )}

      {/* Left Area: Profile & Details */}
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
            isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {initials}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className={`text-lg font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
              {provider.name}
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isActive ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-50 text-gray-400 border-gray-100'
              }`}
            >
              {categoryLabel}
            </span>
            {!isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500">
                Disabled
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
            <div className="flex items-center">
              <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100">
                /{provider.slug}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.Briefcase className="w-4 h-4 text-gray-400" />
              {isLoading ? (
                <span className="animate-pulse">Loading services...</span>
              ) : (
                <span>
                  {assigned.length} {assigned.length === 1 ? 'service' : 'services'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Action Buttons */}
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 pt-4 border-t border-gray-100 lg:border-t-0 lg:pt-0">
        <button
          type="button"
          onClick={onManageServices}
          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
        >
          <Icons.Briefcase className="w-4 h-4 text-gray-500" />
          Assign Services
        </button>

        <button
          type="button"
          onClick={onManageAccount}
          className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 transition-all ${
            displayEmail || provider.userId
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 focus:ring-blue-500/20'
              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200'
          }`}
        >
          {displayEmail || provider.userId ? (
            <>
              <Icons.CheckCircle2 className="w-4 h-4 text-blue-600" />
              {displayEmail ? <span className="truncate max-w-[120px]">{displayEmail}</span> : 'Account Linked'}
            </>
          ) : (
            <>
              <Icons.Link className="w-4 h-4 text-gray-500" />
              Link Account
            </>
          )}
        </button>

        <button
          type="button"
          onClick={isActive ? onDelete : onEnable}
          disabled={isDeleting}
          className={`flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
              ? 'border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 focus:ring-red-500/20'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 focus:ring-emerald-500/20'
          }`}
          title={isActive ? 'Disable Provider' : 'Enable Provider'}
        >
          <Icons.Power className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-emerald-600'}`} />
          {isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
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