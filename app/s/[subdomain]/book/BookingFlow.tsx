"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, CheckCircle2, IndianRupee } from "lucide-react";
import type { AvailabilitySlot, Provider, Service } from "@/lib/api";
import {
  useProviders,
  useServices,
  useAvailability,
  useBookAppointment,
  useProviderAssignedServices,
} from "@/lib/queries";
import { getAccessToken } from "@/lib/auth";

import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { ProviderSelector } from "@/components/booking/ProviderSelector";
import { DateTimeSelector } from "@/components/booking/DateTimeSelector";
import { BookingManifest } from "@/components/booking/BookingManifest";

interface BookingFlowProps {
  tenantSlug: string;
  initialServiceSlug?: string | null;
  initialServiceId?: number | null;
  initialProviderSlug?: string | null;
  initialProviderId?: number | null;
}

interface AssignedServiceMapping {
  id?: number;
  serviceId?: number;
  priceOverride?: string | null;
  durationOverrideMinutes?: number | null;
  isActive?: boolean | null;
}

function normalizeSlug(slug: string | null | undefined): string {
  if (!slug) return "";
  return slug.toLowerCase().replace(/[_]/g, "-").trim();
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingFlow({
  tenantSlug,
  initialServiceSlug,
  initialServiceId,
  initialProviderSlug,
  initialProviderId,
}: BookingFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeSectionRef = useRef<HTMLElement>(null);
  const scrolledRef = useRef(false);

  // 1. Read URL query parameters
  const queryServiceSlug = searchParams.get("service") ?? initialServiceSlug ?? null;
  const queryServiceId = searchParams.get("serviceId") ? Number(searchParams.get("serviceId")) : (initialServiceId ?? null);

  const queryProviderSlug = searchParams.get("provider") ?? initialProviderSlug ?? null;
  const queryProviderId = searchParams.get("providerId") ? Number(searchParams.get("providerId")) : (initialProviderId ?? null);

  // Locked parameters flags
  const isServiceLocked = Boolean(queryServiceSlug || queryServiceId);
  const isProviderLocked = Boolean(queryProviderSlug || queryProviderId);

  // 2. Fetch full directory of providers (needed to resolve provider slug immediately)
  const {
    data: rawProviderDirectory,
    isLoading: loadingProviderDirectory,
  } = useProviders(tenantSlug, "all", true);

  const providerDirectory: Provider[] = useMemo(() => {
    if (Array.isArray(rawProviderDirectory)) return rawProviderDirectory;
    if (
      rawProviderDirectory &&
      typeof rawProviderDirectory === "object" &&
      "providers" in rawProviderDirectory
    ) {
      return (rawProviderDirectory as { providers: Provider[] }).providers;
    }
    return [];
  }, [rawProviderDirectory]);

  // 3. Resolve Active Provider
  const [manualProvider, setManualProvider] = useState<Provider | null>(null);

  const activeProvider: Provider | null = useMemo(() => {
    if (manualProvider && !isProviderLocked) return manualProvider;
    if (queryProviderSlug) {
      const targetSlug = normalizeSlug(queryProviderSlug);
      const match = providerDirectory.find((p) => normalizeSlug(p.slug) === targetSlug);
      if (match) return match;
    }
    if (queryProviderId) {
      const match = providerDirectory.find((p) => p.id === queryProviderId);
      if (match) return match;
    }
    return manualProvider;
  }, [manualProvider, isProviderLocked, queryProviderSlug, queryProviderId, providerDirectory]);

  const activeProviderId = activeProvider?.id ?? queryProviderId ?? null;
  
  // 4. Fetch assigned services mapping for the active provider
  const {
    data: rawAssignedServices,
    isLoading: loadingAssignedServices,
  } = useProviderAssignedServices(tenantSlug, activeProviderId ?? 0);

  const assignedMappings: AssignedServiceMapping[] = useMemo(() => {
    if (!rawAssignedServices) return [];
    if (Array.isArray(rawAssignedServices)) return rawAssignedServices;
    if (typeof rawAssignedServices === "object" && "data" in rawAssignedServices) {
      return (rawAssignedServices as { data: AssignedServiceMapping[] }).data;
    }
    return [];
  }, [rawAssignedServices]);

  // 5. Fetch Store Catalog Services
  const { data: rawServices, isLoading: loadingServices } = useServices(tenantSlug);

  const allCatalogServices: Service[] = useMemo(() => {
    if (Array.isArray(rawServices)) return rawServices;
    if (rawServices && typeof rawServices === "object" && "services" in rawServices) {
      return (rawServices as { services: Service[] }).services;
    }
    return [];
  }, [rawServices]);

  // Filter and decorate services according to provider availability and overrides
  const services: Service[] = useMemo(() => {
    // If no provider is selected, display all catalog services
    if (!activeProviderId) {
      return allCatalogServices;
    }

    // Filter to only mapped services that are active
    const activeAssignedSet = new Map<number, AssignedServiceMapping>();
    for (const mapping of assignedMappings) {
      if (mapping.isActive !== false) {
        const key = mapping.serviceId ?? mapping.id;
        if (key) activeAssignedSet.set(Number(key), mapping);
      }
    }

    return allCatalogServices
      .filter((s) => activeAssignedSet.has(s.id))
      .map((s) => {
        const override = activeAssignedSet.get(s.id);
        if (!override) return s;

        return {
          ...s,
          price: override.priceOverride ?? s.price,
          durationMinutes: override.durationOverrideMinutes ?? s.durationMinutes,
        };
      });
  }, [allCatalogServices, activeProviderId, assignedMappings]);

  // 6. Resolve Active Service
  const [manualService, setManualService] = useState<Service | null>(null);

  const activeService: Service | null = useMemo(() => {
    if (manualService && !isServiceLocked) return manualService;
    if (queryServiceSlug && services.length > 0) {
      const targetSlug = normalizeSlug(queryServiceSlug);
      const match = services.find((s) => normalizeSlug(s.slug) === targetSlug);
      if (match) return match;
    }
    if (queryServiceId && services.length > 0) {
      const match = services.find((s) => s.id === queryServiceId);
      if (match) return match;
    }
    return manualService;
  }, [manualService, isServiceLocked, queryServiceSlug, queryServiceId, services]);

  const activeServiceId = activeService?.id ?? queryServiceId ?? null;

  // 7. Fetch Providers filtered by active service if provider is not locked
  const { data: rawFilteredProviders, isLoading: loadingFilteredProviders } = useProviders(
    tenantSlug,
    activeServiceId
  );

  const providers: Provider[] = useMemo(() => {
    if (Array.isArray(rawFilteredProviders)) return rawFilteredProviders;
    if (
      rawFilteredProviders &&
      typeof rawFilteredProviders === "object" &&
      "providers" in rawFilteredProviders
    ) {
      return (rawFilteredProviders as { providers: Provider[] }).providers;
    }
    return [];
  }, [rawFilteredProviders]);

  // 8. Booking and Calendar States
  const [step, setStep] = useState<"configure" | "done">("configure");
  const [date, setDate] = useState<string>(() => formatLocalDate(new Date()));
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll when both service & provider are locked/resolved
  useEffect(() => {
    if (!scrolledRef.current && activeService && activeProvider) {
      scrolledRef.current = true;
      timeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeService, activeProvider]);

  // 14-day booking window
  const calendarDays = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      list.push({
        iso: formatLocalDate(d),
        dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // 9. Fetch Availability Slots
  const { data: rawSlots, isLoading: loadingSlots } = useAvailability(
    tenantSlug,
    activeProviderId,
    date,
    activeServiceId
  );

  const slots: AvailabilitySlot[] = useMemo(() => {
    if (Array.isArray(rawSlots)) return rawSlots;
    if (rawSlots && typeof rawSlots === "object" && "slots" in rawSlots) {
      return (rawSlots as { slots: AvailabilitySlot[] }).slots;
    }
    return [];
  }, [rawSlots]);

  const bookMutation = useBookAppointment(tenantSlug);

  const handleSelectService = (newService: Service) => {
    if (isServiceLocked) return;
    if (activeService?.id !== newService.id) {
      setManualService(newService);
      if (!isProviderLocked) setManualProvider(null);
      setSlot(null);
    }
  };

  const handleSelectProvider = (newProvider: Provider) => {
    if (isProviderLocked) return;
    setManualProvider(newProvider);
    setSlot(null);
  };

  async function handleConfirm(): Promise<void> {
    if (!activeProviderId || !activeServiceId || !slot) return;

    const token = await getAccessToken();
    if (!token) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setError(null);
    bookMutation.mutate(
      {
        accessToken: token,
        providerId: activeProviderId,
        serviceId: activeServiceId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        localDate: date,
        customerNotes: notes.trim() || undefined,
      },
      {
        onSuccess: () => setStep("done"),
        onError: (err: unknown) =>
          setError(
            err instanceof Error
              ? err.message
              : "This slot is no longer available. Please select another time."
          ),
      }
    );
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="rounded-3xl border border-ink/10 bg-white/90 p-8 shadow-sm backdrop-blur-md sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-light text-ink">
            Appointment Confirmed
          </h2>
          <p className="mt-2 text-xs text-ink/60">
            A confirmation receipt has been saved to your account.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/bookings"
              className="rounded-full bg-ink px-6 py-3 text-xs font-medium text-paper hover:bg-brass transition"
            >
              My Bookings
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep("configure");
                setManualService(null);
                setManualProvider(null);
                setSlot(null);
                router.replace(window.location.pathname);
              }}
              className="rounded-full border border-ink/15 px-6 py-3 text-xs font-medium text-ink hover:bg-ink/5"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isServicesLoading = loadingServices || (Boolean(activeProviderId) && loadingAssignedServices);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      <div className="space-y-8 lg:col-span-7">
        
        {/* Step 1: Services */}
        <section className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xs backdrop-blur-sm transition-all hover:bg-white/90">
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass/10 font-mono text-xs font-semibold text-brass">
                01
              </span>
              <h2 className="font-display text-lg font-medium text-ink">Service Package</h2>
            </div>
            {isServiceLocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/70">
                <Lock className="h-3 w-3 text-brass" /> Direct Link Fixed
              </span>
            ) : (
              <span className="text-xs text-ink/40">Step 1 of 3</span>
            )}
          </div>

          {/* Locked View Card */}
          {isServiceLocked && activeService ? (
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-sm sm:text-base">{activeService.name}</span>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Selected
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink/50">
                  <span>{activeService.durationMinutes} mins</span>
                  <span>·</span>
                  <span className="font-mono text-ink/40">/{activeService.slug}</span>
                </div>
              </div>
              <div className="flex items-center text-sm font-semibold text-ink">
                <IndianRupee className="h-4 w-4" />
                <span>{Number(activeService.price).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <ServiceSelector
              services={services}
              selectedServiceId={activeServiceId}
              onSelectService={handleSelectService}
              isLoading={isServicesLoading}
            />
          )}
        </section>

        {/* Step 2: Specialists */}
        <section className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xs backdrop-blur-sm transition-all hover:bg-white/90">
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass/10 font-mono text-xs font-semibold text-brass">
                02
              </span>
              <h2 className="font-display text-lg font-medium text-ink">Specialist</h2>
            </div>
            {isProviderLocked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/70">
                <Lock className="h-3 w-3 text-brass" /> Direct Link Fixed
              </span>
            ) : (
              <span className="text-xs text-ink/40">Step 2 of 3</span>
            )}
          </div>

          {/* Locked View Card */}
          {isProviderLocked && activeProvider ? (
            <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-paper/60 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper shadow-xs">
                  {activeProvider.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-sm sm:text-base">{activeProvider.name}</span>
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Assigned
                    </span>
                  </div>
                  <p className="text-xs text-ink/50">{activeProvider.title || "Specialist Practitioner"}</p>
                </div>
              </div>
              <span className="font-mono text-xs text-ink/40">@{activeProvider.slug}</span>
            </div>
          ) : (
            <ProviderSelector
              providers={providers}
              selectedProviderId={activeProviderId}
              onSelectProvider={handleSelectProvider}
              isLoading={loadingFilteredProviders || loadingProviderDirectory}
              hasSelectedService={!!activeServiceId}
            />
          )}
        </section>

        {/* Step 3: Date & Slots */}
        <section
          ref={timeSectionRef}
          className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xs backdrop-blur-sm transition-all hover:bg-white/90"
        >
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brass/10 font-mono text-xs font-semibold text-brass">
                03
              </span>
              <h2 className="font-display text-lg font-medium text-ink">Date & Time</h2>
            </div>
            <span className="text-xs text-ink/40">Step 3 of 3</span>
          </div>

          <DateTimeSelector
            selectedDate={date}
            onSelectDate={(newDate) => {
              setDate(newDate);
              setSlot(null);
            }}
            slots={slots}
            selectedSlot={slot}
            onSelectSlot={setSlot}
            isLoadingSlots={loadingSlots}
            isDisabled={!activeServiceId || !activeProviderId}
          />
        </section>
      </div>

      {/* Sticky Right Manifest Summary */}
      <div className="lg:sticky lg:top-8 lg:col-span-5">
        <BookingManifest
          service={activeService}
          provider={activeProvider}
          slot={slot}
          date={date}
          notes={notes}
          onChangeNotes={setNotes}
          onConfirm={handleConfirm}
          isPending={bookMutation.isPending}
          error={error}
        />
      </div>
    </div>
  );
}