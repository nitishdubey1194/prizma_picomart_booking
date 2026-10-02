'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo, type FormEvent, type ChangeEvent } from 'react';
import {
  useServices,
  useCreateService,
  useDeleteService,
  useProviderAssignedServices,
  useProviders,
  useCurrentUser,
} from '@/lib/queries';
import type { Service, ServicesResponse, Provider } from '@/lib/api';
import { IndianRupee, Plus, X, Trash2, Clock, Check, UserCheck, ShieldAlert } from 'lucide-react';

interface AssignedServiceRawItem {
  id?: number | string;
  serviceId?: number | string;
  service_id?: number | string;
  priceOverride?: string | number | null;
  price_override?: string | number | null;
  durationOverrideMinutes?: number | null;
  duration_override_minutes?: number | null;
  isActive?: boolean | null;
  is_active?: boolean | null;
}

export default function ServicesDashboardPage() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params?.subdomain ?? '';

  // 1. Actor Role & Provider Identity
  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
  const isVendor = user?.role
    ? Array.isArray(user.role)
      ? user.role.includes('vendor')
      : user.role === 'vendor'
    : false;
  const activeProviderId: number | null = user?.providerId ? Number(user.providerId) : null;
  const isProvider = Boolean(activeProviderId) && !isVendor;

  // 2. Queries
  const { data: rawServices, isLoading: loadingServices } = useServices(subdomain);
  const { data: rawProviders } = useProviders(subdomain, 'all', true);
  const {
    data: rawAssignedServices,
    isLoading: loadingAssigned,
    refetch: refetchAssigned,
  } = useProviderAssignedServices(subdomain, activeProviderId ?? 0);

  const createService = useCreateService(subdomain);
  const deleteService = useDeleteService(subdomain);

  // Modals & UI Toggles
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 3. Normalize Catalog Services
  const allCatalogServices: Service[] = useMemo(() => {
    if (!rawServices) return [];
    if (Array.isArray(rawServices)) return rawServices;
    if (
      typeof rawServices === 'object' &&
      'services' in rawServices &&
      Array.isArray((rawServices as ServicesResponse).services)
    ) {
      return (rawServices as ServicesResponse).services;
    }
    return [];
  }, [rawServices]);

  const providers: Provider[] = useMemo(() => {
    if (Array.isArray(rawProviders)) return rawProviders;
    if (rawProviders && typeof rawProviders === 'object' && 'providers' in rawProviders) {
      return (rawProviders as { providers: Provider[] }).providers;
    }
    return [];
  }, [rawProviders]);

  const currentProvider = useMemo(() => {
    if (!activeProviderId) return null;
    return providers.find((p) => p.id === activeProviderId) ?? null;
  }, [providers, activeProviderId]);

  // 4. Form State (Derived directly without useEffect)
  const [selectedSlugOverride, setSelectedSlugOverride] = useState<string | null>(null);
  const [priceOverride, setPriceOverride] = useState<number | null>(null);
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  const [bufferOverride, setBufferOverride] = useState<number | null>(null);
  const [descriptionOverride, setDescriptionOverride] = useState<string | null>(null);

  const selectedSlug = selectedSlugOverride ?? allCatalogServices[0]?.slug ?? '';
  const selectedService = useMemo(
    () => allCatalogServices.find((s) => s.slug === selectedSlug) ?? null,
    [allCatalogServices, selectedSlug]
  );

  const activeName = selectedService?.name ?? '';
  const activePrice = priceOverride ?? (selectedService ? Number(selectedService.price) : 300);
  const activeDuration = durationOverride ?? (selectedService ? selectedService.durationMinutes : 30);
  const activeBuffer = bufferOverride ?? (selectedService ? (selectedService.bufferMinutes ?? 0) : 0);
  const activeDescription = descriptionOverride ?? (selectedService?.description ?? '');

  // Reset local edit overrides when dropdown switches
  function handleSelectPackageChange(e: ChangeEvent<HTMLSelectElement>): void {
    setSelectedSlugOverride(e.target.value);
    setPriceOverride(null);
    setDurationOverride(null);
    setBufferOverride(null);
    setDescriptionOverride(null);
  }

  // 5. Custom Modal States
  const [customName, setCustomName] = useState<string>('');
  const [customSlug, setCustomSlug] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(350);
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [customDescription, setCustomDescription] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // 6. Assigned Map
  const assignedMap = useMemo(() => {
    const map = new Map<number, { priceOverride?: string | null; durationOverride?: number | null }>();
    if (!rawAssignedServices) return map;

    let items: AssignedServiceRawItem[] = [];
    if (Array.isArray(rawAssignedServices)) {
      items = rawAssignedServices as AssignedServiceRawItem[];
    } else if (typeof rawAssignedServices === 'object') {
      const dataProp = rawAssignedServices as { data?: AssignedServiceRawItem[]; services?: AssignedServiceRawItem[] };
      items = dataProp.data ?? dataProp.services ?? [];
    }

    for (const item of items) {
      const isActive = item.isActive ?? item.is_active ?? true;
      if (isActive !== false) {
        const rawId = item.serviceId ?? item.service_id ?? item.id;
        if (rawId !== undefined && rawId !== null) {
          const numId = Number(rawId);
          const customRate = item.priceOverride ?? item.price_override;
          const customTime = item.durationOverrideMinutes ?? item.duration_override_minutes;

          map.set(numId, {
            priceOverride: customRate != null ? String(customRate) : null,
            durationOverride: customTime != null ? Number(customTime) : null,
          });
        }
      }
    }

    return map;
  }, [rawAssignedServices]);

  // Displayed Services Filter
  const displayedServices: Service[] = useMemo(() => {
    if (isVendor) {
      return allCatalogServices;
    }

    return allCatalogServices
      .filter((s) => assignedMap.has(Number(s.id)))
      .map((s) => {
        const override = assignedMap.get(Number(s.id));
        if (!override) return s;

        return {
          ...s,
          price: override.priceOverride ?? s.price,
          durationMinutes: override.durationOverride ?? s.durationMinutes,
        };
      });
  }, [isVendor, allCatalogServices, assignedMap]);

  function handleCustomNameChange(e: ChangeEvent<HTMLInputElement>): void {
    const val = e.target.value;
    setCustomName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setCustomSlug(generated);
  }

  function handleSaveCustomPackage(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setModalError(null);

    createService.mutate(
      {
        name: customName,
        slug: customSlug,
        durationMinutes: customDuration,
        price: customPrice,
        description: customDescription.trim() || undefined,
        providerId: activeProviderId ?? undefined,
      } as Parameters<typeof createService.mutate>[0],
      {
        onSuccess: async () => {
          setSelectedSlugOverride(customSlug);
          setPriceOverride(null);
          setDurationOverride(null);
          setBufferOverride(null);
          setDescriptionOverride(null);

          setCustomName('');
          setCustomSlug('');
          setCustomDescription('');
          setIsCreateModalOpen(false);
          setIsAddingNew(true);

          if (activeProviderId) {
            await refetchAssigned();
          }
        },
        onError: (err: unknown) => {
          setModalError(err instanceof Error ? err.message : 'Failed to save new service package.');
        },
      }
    );
  }

  function handleCreateMain(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setFormError(null);

    createService.mutate(
      {
        name: activeName,
        slug: selectedSlug,
        durationMinutes: activeDuration,
        price: activePrice,
        description: activeDescription.trim() || undefined,
        bufferMinutes: activeBuffer,
        providerId: activeProviderId ?? undefined,
      } as Parameters<typeof createService.mutate>[0],
      {
        onSuccess: async () => {
          setIsAddingNew(false);
          setPriceOverride(null);
          setDurationOverride(null);
          setBufferOverride(null);
          setDescriptionOverride(null);

          if (activeProviderId) {
            await refetchAssigned();
          }
        },
        onError: (err: unknown) => {
          setFormError(err instanceof Error ? err.message : 'Failed to save service.');
        },
      }
    );
  }

  const isLoading = loadingUser || loadingServices || (isProvider && loadingAssigned);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm tracking-wide text-zinc-500 animate-pulse">Loading service catalog…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Role Context Bar */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          {isVendor ? (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <ShieldAlert className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <UserCheck className="h-4 w-4" />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              {isVendor ? 'Store Owner (Vendor Mode)' : `Specialist Practitioner (${currentProvider?.name ?? 'Provider Mode'})`}
            </p>
            <p className="text-[11px] text-zinc-500">
              {isVendor
                ? 'Showing all catalog services across the store.'
                : 'Showing strictly services assigned to your schedule. New services created here are auto-assigned to you.'}
            </p>
          </div>
        </div>

        {isProvider && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Auto-Assign Active
          </span>
        )}
      </div>

      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {isVendor ? 'List of all services' : 'My Offered Services'}
          </h1>
          <p className="text-sm text-zinc-500">
            {isVendor
              ? 'Configure master service offerings, base parameters, and direct booking slugs.'
              : 'Services currently available for booking under your profile.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isAddingNew ? (
            <>
              <X className="h-4 w-4" />
              <span>Close Editor</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{isVendor ? 'Add New Service' : 'Create & Assign Service'}</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Service Configurator */}
      {isAddingNew && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs animate-in fade-in-50 duration-200 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {isVendor ? 'Configure Service from Catalog' : `Select or Update Service for ${currentProvider?.name ?? 'Your Schedule'}`}
              </h2>
              <span className="text-xs text-zinc-500">
                {isVendor
                  ? 'Pick an existing service from database or save a new one.'
                  : 'Select an existing service from the database or create a brand new one to assign to yourself.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-100 transition shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Service Package</span>
            </button>
          </div>

          <form onSubmit={handleCreateMain} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Select Existing Service from Database
                </label>
                <div className="relative mt-1.5">
                  <select
                    value={selectedSlug}
                    onChange={handleSelectPackageChange}
                    className="block w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 cursor-pointer"
                  >
                    {allCatalogServices.length === 0 ? (
                      <option value="">No services in database yet (Create one below)</option>
                    ) : (
                      allCatalogServices.map((s) => (
                        <option key={`db-${s.slug}`} value={s.slug}>
                          {s.name} (₹{Number(s.price).toFixed(0)} - {s.durationMinutes}m)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Direct Booking Link Preview */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Direct Booking Path
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                  <span className="text-zinc-400 font-mono">/book?service=</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 ml-1">{selectedSlug || 'none'}</span>
                  {isProvider && currentProvider?.slug && (
                    <span className="font-mono text-emerald-600 ml-1">&provider={currentProvider.slug}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center">
                  Base Price (<IndianRupee size={10} className="mx-0.5" />)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={activePrice}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPriceOverride(Number(e.target.value))}
                  className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={activeDuration}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDurationOverride(Number(e.target.value))}
                  className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Buffer After (Minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={activeBuffer}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBufferOverride(Number(e.target.value))}
                  className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Description
              </label>
              <textarea
                rows={2}
                value={activeDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescriptionOverride(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={createService.isPending || !selectedSlug}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {createService.isPending ? 'Saving…' : isVendor ? 'Confirm & Enable Service' : 'Save & Assign to Me'}
              </button>
            </div>
          </form>

          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
        </div>
      )}

      {/* Modal: Create Brand New Service in Database */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {isVendor ? 'New Catalog Service' : 'New Service for Your Profile'}
                </h3>
                {isProvider && (
                  <p className="text-[11px] text-emerald-600 font-medium">Will auto-assign to you upon save</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPackage} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Service Name
                </label>
                <input
                  required
                  placeholder="e.g. VIP Ceramic Coating or Hair Fade"
                  value={customName}
                  onChange={handleCustomNameChange}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Slug (Auto-generated)
                </label>
                <input
                  required
                  placeholder="vip-ceramic-coating"
                  value={customSlug}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomSlug(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-600 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center">
                    Price (<IndianRupee size={10} className="mx-0.5" />)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={customPrice}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={customDuration}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomDuration(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={customDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCustomDescription(e.target.value)}
                  placeholder="Included treatments, steps, or products..."
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {modalError && <p className="text-xs text-red-600">{modalError}</p>}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createService.isPending}
                  className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {createService.isPending ? 'Saving…' : isVendor ? 'Save Service' : 'Save & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Services Listing */}
      {displayedServices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-12 px-4 text-center dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {isVendor ? 'No services stored in database yet.' : 'You have no assigned services yet.'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {isVendor
              ? 'Click "Add New Service" above to add your first catalog offering.'
              : 'Click "Create & Assign Service" above to add services to your specialist schedule.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {displayedServices.map((s: Service) => (
            <li key={s.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900 text-base dark:text-zinc-100">{s.name}</span>
                  <span className="text-xs font-bold text-zinc-900 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 px-2 py-0.5 rounded flex items-center">
                    <IndianRupee size={11} className="-mr-0.5" /> {Number(s.price).toFixed(2)}
                  </span>
                  {isProvider && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Check className="h-2.5 w-2.5" /> Assigned
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-400">slug:</span> {s.slug}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-400" /> {s.durationMinutes} mins
                  </span>
                  {s.bufferMinutes > 0 && <span>(+{s.bufferMinutes}m buffer)</span>}
                </div>

                {s.description && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{s.description}</p>
                )}
              </div>

              {isVendor && (
                <button
                  type="button"
                  onClick={() => deleteService.mutate(s.id)}
                  disabled={deleteService.isPending}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}