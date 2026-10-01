"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AvailabilitySlot, Provider, Service } from "@/lib/api";
import {
  useProviders,
  useServices,
  useAvailability,
  useBookAppointment,
} from "@/lib/queries";
import { getAccessToken } from "@/lib/auth";

import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { ProviderSelector } from "@/components/booking/ProviderSelector";
import { DateTimeSelector } from "@/components/booking/DateTimeSelector";
import { BookingManifest } from "@/components/booking/BookingManifest";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingFlow({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeSectionRef = useRef<HTMLElement>(null);
  const scrolledRef = useRef(false);

  // URL Query Parameters derived during render
  const paramProviderId = useMemo(() => {
    const val = searchParams.get("providerId");
    return val ? Number(val) : null;
  }, [searchParams]);

  const paramServiceId = useMemo(() => {
    const val = searchParams.get("serviceId");
    return val ? Number(val) : null;
  }, [searchParams]);

  // Manual User Overrides
  const [manualServiceId, setManualServiceId] = useState<number | null>(null);
  const [manualProviderId, setManualProviderId] = useState<number | null>(null);

  const selectedServiceId = manualServiceId ?? paramServiceId;
  const selectedProviderId = manualProviderId ?? paramProviderId;

  // Booking details
  const [step, setStep] = useState<"configure" | "done">("configure");
  const [date, setDate] = useState<string>(() => formatLocalDate(new Date()));
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Data Queries
  const { data: rawServices, isLoading: loadingServices } = useServices(tenantSlug);
  const { data: rawProviders, isLoading: loadingProviders } = useProviders(
    tenantSlug,
    selectedServiceId
  );

  const services: Service[] = useMemo(() => {
    if (Array.isArray(rawServices)) return rawServices;
    if (rawServices && typeof rawServices === "object" && "services" in rawServices) {
      return (rawServices as { services: Service[] }).services;
    }
    return [];
  }, [rawServices]);

  const providers: Provider[] = useMemo(() => {
    if (Array.isArray(rawProviders)) return rawProviders;
    if (rawProviders && typeof rawProviders === "object" && "providers" in rawProviders) {
      return (rawProviders as { providers: Provider[] }).providers;
    }
    return [];
  }, [rawProviders]);

  const service = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) ?? null;
  }, [services, selectedServiceId]);

  const provider = useMemo(() => {
    return providers.find((p) => p.id === selectedProviderId) ?? null;
  }, [providers, selectedProviderId]);

  // Auto-scroll when coming in with pre-selected query params
  useEffect(() => {
    if (!scrolledRef.current && service && provider) {
      scrolledRef.current = true;
      timeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [service, provider]);

  // 14-day calendar array
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

  const { data: rawSlots, isLoading: loadingSlots } = useAvailability(
    tenantSlug,
    selectedProviderId,
    date,
    selectedServiceId
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
    if (selectedServiceId !== newService.id) {
      setManualServiceId(newService.id);
      setManualProviderId(null);
      setSlot(null);
    }
  };

  const handleSelectProvider = (p: Provider) => {
    setManualProviderId(p.id);
    setSlot(null);
  };

  async function handleConfirm(): Promise<void> {
    if (!selectedProviderId || !selectedServiceId || !slot) return;

    const token = await getAccessToken();
    if (!token) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setError(null);
    bookMutation.mutate(
      {
        accessToken: token,
        providerId: selectedProviderId,
        serviceId: selectedServiceId,
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
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-8 shadow-sm backdrop-blur-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brass/10 text-brass">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
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
                setManualServiceId(null);
                setManualProviderId(null);
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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Interactive Selection Flow */}
      <div className="space-y-10 lg:col-span-7">
        {/* Step 1: Services */}
        <section>
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brass">01</span>
              <h2 className="font-display text-lg font-normal text-ink">Choose Service</h2>
            </div>
            <span className="text-xs text-ink/40">Step 1 of 3</span>
          </div>
          <ServiceSelector
            services={services}
            selectedServiceId={selectedServiceId}
            onSelectService={handleSelectService}
            isLoading={loadingServices}
          />
        </section>

        {/* Step 2: Specialists */}
        <section>
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brass">02</span>
              <h2 className="font-display text-lg font-normal text-ink">Select Specialist</h2>
            </div>
            <span className="text-xs text-ink/40">Step 2 of 3</span>
          </div>
          <ProviderSelector
            providers={providers}
            selectedProviderId={selectedProviderId}
            onSelectProvider={handleSelectProvider}
            isLoading={loadingProviders}
            hasSelectedService={!!selectedServiceId}
          />
        </section>

        {/* Step 3: Date & Slots */}
        <section ref={timeSectionRef}>
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brass">03</span>
              <h2 className="font-display text-lg font-normal text-ink">Date & Time</h2>
            </div>
            <span className="text-xs text-ink/40">Step 3 of 3</span>
          </div>
          <DateTimeSelector
            calendarDays={calendarDays}
            selectedDate={date}
            onSelectDate={(newDate) => {
              setDate(newDate);
              setSlot(null);
            }}
            slots={slots}
            selectedSlot={slot}
            onSelectSlot={setSlot}
            isLoadingSlots={loadingSlots}
            isDisabled={!selectedServiceId || !selectedProviderId}
          />
        </section>
      </div>

      {/* Sticky Order Summary */}
      <div className="lg:col-span-5">
        <BookingManifest
          service={service}
          provider={provider}
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