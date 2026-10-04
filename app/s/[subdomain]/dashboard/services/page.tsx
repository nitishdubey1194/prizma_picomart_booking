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
import {
  IndianRupee,
  Plus,
  X,
  Trash2,
  Clock,
  Check,
  UserCheck,
  ShieldCheck,
  Scissors,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  Layers,
} from 'lucide-react';

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

  // 1. Role Context
  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
  const isVendor = user?.role
    ? Array.isArray(user.role)
      ? user.role.includes('vendor')
      : user.role === 'vendor'
    : false;
  const activeProviderId: number | null = user?.providerId ? Number(user.providerId) : null;
  const isProvider = Boolean(activeProviderId) && !isVendor;

  // 2. Data Queries
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

  // 3. Normalize Data
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

  // 4. Form State Overrides
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
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-28 w-full animate-pulse rounded-3xl bg-stone-200/50" />
        <div className="h-32 w-full animate-pulse rounded-3xl bg-stone-200/50" />
        <div className="h-32 w-full animate-pulse rounded-3xl bg-stone-200/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* 1. Header Card with Role Capsule & Actions */}
      <header className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                {isVendor ? 'Studio Master' : `Chair #${activeProviderId}`}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                {isVendor ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 text-stone-700" />
                    Storefront Catalog
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Specialist Schedule
                  </>
                )}
              </span>
            </div>

            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {isVendor ? 'Services & Offerings' : 'My Offered Services'}
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              {isVendor
                ? 'Manage service menu, pricing rates, and booking durations across all stations.'
                : 'Configure treatments and services available for client bookings on your chair.'}
            </p>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsAddingNew((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all"
            >
              {isAddingNew ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Close Editor</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isVendor ? 'New Service' : 'Add to My Chair'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="mt-5 flex items-center justify-between border-t border-stone-200/70 pt-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">{displayedServices.length}</span>
            <span>services available for reservation</span>
          </div>
          {isProvider && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
              Auto-Link Enabled
            </span>
          )}
        </div>
      </header>

      {/* 2. Expandable In-Place Configurator */}
      {isAddingNew && (
        <section className="rounded-3xl border border-stone-200/90 bg-[#FAF8F5] p-5 shadow-xs animate-in fade-in-50 duration-200 sm:p-6">
          <div className="flex flex-col gap-2 pb-4 border-b border-stone-200/70 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                {isVendor ? 'Configure Service Offering' : 'Assign Service to Your Chair'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {isVendor
                  ? 'Select an existing package or adjust pricing before publishing.'
                  : 'Pick a service from the database or customize pricing for your chair.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-stone-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs hover:bg-white transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#9A7B56]" />
              <span>Create Brand New Package</span>
            </button>
          </div>

          <form onSubmit={handleCreateMain} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Select dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Select Existing Service
                </label>
                <select
                  value={selectedSlug}
                  onChange={handleSelectPackageChange}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden cursor-pointer"
                >
                  {allCatalogServices.length === 0 ? (
                    <option value="">No services in database (Create one using button above)</option>
                  ) : (
                    allCatalogServices.map((s) => (
                      <option key={`opt-${s.slug}`} value={s.slug}>
                        {s.name} · ₹{Number(s.price).toFixed(0)} ({s.durationMinutes}m)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Direct Booking Path Preview */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Direct Booking Endpoint
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-stone-200 bg-white/70 px-3 py-2 text-xs font-mono text-stone-600 shadow-2xs overflow-hidden truncate">
                  <span className="text-stone-400">/book?service=</span>
                  <span className="font-bold text-stone-900 ml-0.5">{selectedSlug || 'none'}</span>
                  {isProvider && currentProvider?.slug && (
                    <span className="text-emerald-700 ml-0.5">&provider={currentProvider.slug}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Duration Overrides */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Base Price (₹)
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={activePrice}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPriceOverride(Number(e.target.value))}
                    className="block w-full rounded-xl border border-stone-200 bg-white pl-6 pr-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                  />
                  <IndianRupee className="absolute left-2 top-2.5 h-3.5 w-3.5 text-stone-400" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Session Duration (Mins)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={activeDuration}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDurationOverride(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Buffer Window (Mins)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={activeBuffer}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBufferOverride(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Service Overview / Notes
              </label>
              <textarea
                rows={2}
                value={activeDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescriptionOverride(e.target.value)}
                placeholder="Included treatments, steps, or products..."
                className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 shadow-2xs placeholder:text-stone-400 focus:border-stone-400 focus:outline-hidden"
              />
            </div>

            {formError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/70">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-[0.98] transition"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={createService.isPending || !selectedSlug}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition disabled:opacity-50"
              >
                {createService.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isVendor ? 'Enable in Catalog' : 'Assign to My Chair'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 3. Modal: Create Brand New Service Package */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-2xs p-4 animate-in fade-in-50 duration-150">
          <div className="relative w-full max-w-md rounded-3xl border border-stone-200/90 bg-[#FAF8F5] p-5 shadow-xl sm:p-6">
            <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  {isVendor ? 'New Catalog Package' : 'New Service Package'}
                </h3>
                {isProvider && (
                  <p className="text-[10px] font-semibold text-emerald-700">
                    Will auto-link to Chair #{activeProviderId} upon save
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPackage} className="mt-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Service Name
                </label>
                <input
                  required
                  placeholder="e.g. VIP Beard Sculpt & Facial"
                  value={customName}
                  onChange={handleCustomNameChange}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  URL Slug (Auto-generated)
                </label>
                <input
                  required
                  placeholder="vip-beard-sculpt"
                  value={customSlug}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomSlug(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-100/60 px-3 py-2 font-mono text-xs text-stone-600 focus:border-stone-400 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Price (₹)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={customPrice}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-stone-200 bg-white pl-6 pr-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                    />
                    <IndianRupee className="absolute left-2 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={customDuration}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomDuration(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={customDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCustomDescription(e.target.value)}
                  placeholder="Included treatments, steps, or products..."
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 shadow-2xs placeholder:text-stone-400 focus:border-stone-400 focus:outline-hidden"
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/70">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createService.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {createService.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isVendor ? 'Save Service' : 'Save & Assign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Active Services Listing (Modern Micro-Card Deck) */}
      {displayedServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-[#FAF8F5]/60 py-14 px-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200/60 text-stone-500">
            <Scissors className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-stone-800">
            {isVendor ? 'No services in store catalog' : 'No services assigned to your chair'}
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            {isVendor
              ? 'Click "New Service" to add offerings to your salon storefront.'
              : 'Add services above to make your chair available for customer bookings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedServices.map((s: Service) => (
            <div
              key={s.id}
              className="group relative rounded-2xl border border-stone-200/80 bg-[#FAF8F5] p-4 shadow-2xs transition hover:border-stone-300 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Service Details */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-stone-900">{s.name}</h2>
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-stone-200/70 px-2 py-0.5 font-mono text-xs font-bold text-stone-900">
                      ₹{Number(s.price).toFixed(0)}
                    </span>
                    {isProvider && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-600/20">
                        <Check className="h-3 w-3" />
                        <span>Active on Chair</span>
                      </span>
                    )}
                  </div>

                  {/* Service Meta Chips */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-stone-400" />
                      <span className="font-semibold text-stone-700">{s.durationMinutes} mins</span>
                      {s.bufferMinutes > 0 && <span>(+{s.bufferMinutes}m buffer)</span>}
                    </div>

                    <span>•</span>

                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-400">
                      <LinkIcon className="h-3 w-3" />
                      <span>{s.slug}</span>
                    </span>
                  </div>

                  {s.description && (
                    <p className="text-xs italic text-stone-600 line-clamp-1">&ldquo;{s.description}&rdquo;</p>
                  )}
                </div>

                {/* Right: Vendor Administrative Controls */}
                {isVendor && (
                  <div className="flex shrink-0 items-center justify-end border-t border-stone-200/60 pt-2 sm:border-0 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => deleteService.mutate(s.id)}
                      disabled={deleteService.isPending}
                      className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] transition disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-stone-400 group-hover:text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}