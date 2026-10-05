"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AvailabilitySlot, Provider, Service } from "@/lib/api";
import {
  useAvailability,
  useBookAppointment,
  useProviderAssignedServices,
  useProviders,
  useServices,
} from "@/lib/queries";
import { getAccessToken } from "@/lib/auth";
import { BookingManifest } from "@/components/booking/BookingManifest";
import { ProviderSelector } from "@/components/booking/ProviderSelector";
import { ServiceSelector } from "@/components/booking/ServiceSelector";

type BookingStep = "service" | "provider" | "date" | "time" | "review" | "done";

interface AssignedService {
  id?: number | string;
  serviceId?: number | string;
  isActive?: boolean | null;
  service?: { id?: number | string };
}

interface ChatBookingAssistantProps {
  tenantSlug: string;
  base: string;
  initialProviderId: number | null;
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(slot: AvailabilitySlot): string {
  return new Date(slot.startTime).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const steps: { id: Exclude<BookingStep, "done">; label: string; prompt: string }[] = [
  { id: "service", label: "Service", prompt: "What would you like to book?" },
  { id: "provider", label: "Specialist", prompt: "Who would you like to see?" },
  { id: "date", label: "Date", prompt: "Which day works for you?" },
  { id: "time", label: "Time", prompt: "Choose an available start time." },
  { id: "review", label: "Review", prompt: "Does everything look right?" },
];

export function ChatBookingAssistant({
  tenantSlug,
  base,
  initialProviderId,
}: ChatBookingAssistantProps) {
  const router = useRouter();
  const servicesQuery = useServices(tenantSlug);
  const allProvidersQuery = useProviders(tenantSlug, "all");
  const [step, setStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(initialProviderId);
  const [selectedDate, setSelectedDate] = useState(() => localDateString(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const booking = useBookAppointment(tenantSlug);

  const providersForServiceQuery = useProviders(
    tenantSlug,
    selectedService?.id ?? "all",
    true,
  );
  const assignedServicesQuery = useProviderAssignedServices(
    tenantSlug,
    selectedProviderId ?? 0,
  );

  const assignedServices = (assignedServicesQuery.data ?? []) as unknown as AssignedService[];
  const assignedServiceIds = useMemo(
    () => new Set(
      assignedServices
        .filter((mapping) => mapping.isActive !== false)
        .map((mapping) => Number(mapping.serviceId ?? mapping.service?.id ?? mapping.id))
        .filter(Number.isFinite),
    ),
    [assignedServices],
  );

  const serviceCatalog = servicesQuery.data ?? [];
  const services = initialProviderId === null
    ? serviceCatalog
    : serviceCatalog.filter((service) => assignedServiceIds.has(service.id));
  const availableProviders = providersForServiceQuery.data ?? [];
  const allProviders = allProvidersQuery.data ?? [];
  const selectedProvider = allProviders.find((provider) => provider.id === selectedProviderId) ?? null;
  const isProviderPinned = initialProviderId !== null;
  const pinnedProviderOffersService = availableProviders.some(
    (provider) => provider.id === initialProviderId,
  );

  const today = localDateString(new Date());
  const lastBookableDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 40);
    return localDateString(date);
  }, []);

  const availabilityQuery = useAvailability(
    tenantSlug,
    selectedProviderId,
    selectedDate,
    selectedService?.id ?? null,
  );
  const availableSlots = availabilityQuery.data ?? [];

  const completedAnswers = [
    selectedService ? { label: "Service", value: selectedService.name } : null,
    selectedProvider ? { label: "Specialist", value: selectedProvider.name } : null,
    selectedDate && step !== "service" && step !== "provider"
      ? { label: "Date", value: formatDate(selectedDate) }
      : null,
    selectedSlot && step !== "service" && step !== "provider" && step !== "date"
      ? { label: "Time", value: formatTime(selectedSlot) }
      : null,
  ].filter((answer): answer is { label: string; value: string } => answer !== null);

  const currentStep = steps.find((item) => item.id === step);

  function chooseService(service: Service) {
    setSelectedService(service);
    setSelectedProviderId(initialProviderId);
    setSelectedSlot(null);
    setError(null);
  }

  function chooseProvider(provider: Provider) {
    setSelectedProviderId(provider.id);
    setSelectedSlot(null);
    setError(null);
  }

  async function confirmBooking() {
    if (!selectedService || !selectedProviderId || !selectedSlot) return;

    const accessToken = await getAccessToken();
    if (!accessToken) {
      const assistantPath = initialProviderId
        ? `/assistant?providerId=${initialProviderId}`
        : "/assistant";
      router.push(`/login?returnTo=${encodeURIComponent(assistantPath)}`);
      return;
    }

    setError(null);
    booking.mutate(
      {
        accessToken,
        providerId: selectedProviderId,
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        localDate: selectedDate,
        customerNotes: notes.trim() || undefined,
      },
      {
        onSuccess: () => setConfirmed(true),
        onError: (bookingError) => {
          setError(bookingError instanceof Error ? bookingError.message : "This time is no longer available.");
        },
      },
    );
  }

  if (confirmed) {
    return (
      <section className="border border-emerald-900/15 bg-white p-7 sm:p-9" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-700">Appointment confirmed</p>
        <h2 className="mt-2 font-display text-2xl font-medium text-ink">Your visit is booked.</h2>
        <p className="mt-2 text-sm text-ink/65">
          {selectedService?.name} with {selectedProvider?.name} on {formatDate(selectedDate)} at {selectedSlot ? formatTime(selectedSlot) : ""}.
        </p>
        <Link href={`${base}/bookings`} className="mt-6 inline-flex min-h-11 items-center bg-ink px-5 text-sm font-medium text-white hover:bg-brass">
          View my bookings
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border border-ink/10 bg-white" aria-label="Guided appointment booking">
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-7">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-brass">Booking assistant</p>
          <p className="mt-1 text-xs text-ink/55">A guided, secure booking conversation</p>
        </div>
        <Link href={`${base}/providers`} className="text-xs font-medium text-ink/65 underline underline-offset-4 hover:text-ink">
          Browse providers
        </Link>
      </div>

      <ol className="grid grid-cols-5 border-b border-ink/10" aria-label="Booking steps">
        {steps.map((item, index) => {
          const currentIndex = steps.findIndex((candidate) => candidate.id === step);
          const isComplete = index < currentIndex;
          const isCurrent = item.id === step;
          return (
            <li key={item.id} className={`border-b-2 px-1 py-3 text-center text-[10px] sm:text-xs ${isCurrent ? "border-brass font-semibold text-ink" : isComplete ? "border-emerald-700 text-emerald-800" : "border-transparent text-ink/40"}`}>
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </li>
          );
        })}
      </ol>

      <div className="max-h-60 space-y-3 overflow-y-auto bg-paper/60 px-5 py-5 sm:px-7" role="log" aria-live="polite">
        <p className="max-w-[90%] border border-ink/10 bg-white px-4 py-3 text-sm text-ink">
          I’ll help you find a service and a time that works. {currentStep?.prompt}
        </p>
        {completedAnswers.map((answer) => (
          <p key={answer.label} className="ml-auto max-w-[90%] bg-ink px-4 py-3 text-sm text-white">
            <span className="mr-2 text-[10px] uppercase tracking-wide text-white/60">{answer.label}</span>
            {answer.value}
          </p>
        ))}
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-7">
        {step === "service" && (
          <>
            {servicesQuery.isError || assignedServicesQuery.isError ? (
              <p role="alert" className="text-sm text-red-700">Services could not be loaded. Please retry.</p>
            ) : services.length === 0 && !servicesQuery.isLoading && !assignedServicesQuery.isLoading ? (
              <div className="space-y-3 text-sm text-ink/65">
                <p>{isProviderPinned ? "This provider has no active services to book." : "No active services are available right now."}</p>
                {isProviderPinned && <Link href={`${base}/providers`} className="inline-block underline underline-offset-4">Choose another provider</Link>}
              </div>
            ) : (
              <ServiceSelector
                services={services}
                selectedServiceId={selectedService?.id ?? null}
                onSelectService={chooseService}
                isLoading={servicesQuery.isLoading || (isProviderPinned && assignedServicesQuery.isLoading)}
              />
            )}
            <button
              type="button"
              disabled={!selectedService || servicesQuery.isLoading || (isProviderPinned && assignedServicesQuery.isLoading)}
              onClick={() => setStep("provider")}
              className="min-h-11 bg-ink px-5 text-sm font-medium text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to specialist
            </button>
          </>
        )}

        {step === "provider" && (
          <>
            {providersForServiceQuery.isError ? (
              <p role="alert" className="text-sm text-red-700">Specialists could not be loaded. Please retry.</p>
            ) : isProviderPinned ? (
              <div className="space-y-3">
                {selectedProvider ? (
                  <p className="border border-ink/10 bg-paper/60 px-4 py-3 text-sm text-ink">
                    {selectedProvider.name} was selected from the provider directory.
                  </p>
                ) : (
                  <p role="alert" className="text-sm text-ink/65">This provider is not active. Choose another provider.</p>
                )}
                {!pinnedProviderOffersService && !providersForServiceQuery.isLoading && (
                  <p role="alert" className="text-sm text-ink/65">This provider is not currently assigned to the selected service.</p>
                )}
                <Link href={`${base}/providers`} className="inline-block text-sm underline underline-offset-4">Browse active providers</Link>
              </div>
            ) : (
              <ProviderSelector
                providers={availableProviders}
                selectedProviderId={selectedProviderId}
                onSelectProvider={chooseProvider}
                isLoading={providersForServiceQuery.isLoading}
                hasSelectedService={selectedService !== null}
              />
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("service")} className="min-h-11 border border-ink/15 px-5 text-sm text-ink hover:bg-paper">Back</button>
              <button
                type="button"
                disabled={!selectedProvider || (isProviderPinned && !pinnedProviderOffersService) || providersForServiceQuery.isLoading}
                onClick={() => setStep("date")}
                className="min-h-11 bg-ink px-5 text-sm font-medium text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to date
              </button>
            </div>
          </>
        )}

        {step === "date" && (
          <div className="space-y-4">
            <label htmlFor="assistant-booking-date" className="block text-sm font-medium text-ink">Choose a date</label>
            <input
              id="assistant-booking-date"
              type="date"
              min={today}
              max={lastBookableDate}
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-h-11 w-full max-w-xs border border-ink/15 bg-white px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brass"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("provider")} className="min-h-11 border border-ink/15 px-5 text-sm text-ink hover:bg-paper">Back</button>
              <button type="button" disabled={!selectedDate} onClick={() => { setSelectedSlot(null); setError(null); setStep("time"); }} className="min-h-11 bg-ink px-5 text-sm font-medium text-white hover:bg-brass disabled:opacity-40">Find available times</button>
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="space-y-4">
            {availabilityQuery.isLoading ? (
              <p className="text-sm text-ink/60" role="status">Checking available times…</p>
            ) : availabilityQuery.isError ? (
              <p role="alert" className="text-sm text-red-700">Availability could not be loaded. Go back and retry.</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-ink/65">No times are available on {formatDate(selectedDate)}. Choose another date.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => { setSelectedSlot(slot); setError(null); setStep("review"); }}
                    className="min-h-11 border border-ink/15 bg-white px-3 text-sm text-ink transition-colors hover:border-brass hover:bg-brass/5 focus-visible:outline-2 focus-visible:outline-brass"
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setStep("date")} className="min-h-11 border border-ink/15 px-5 text-sm text-ink hover:bg-paper">Choose another date</button>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <BookingManifest
              service={selectedService}
              provider={selectedProvider}
              slot={selectedSlot}
              date={selectedDate}
              notes={notes}
              onChangeNotes={setNotes}
              onConfirm={confirmBooking}
              isPending={booking.isPending}
              error={error}
            />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep("time")} className="min-h-11 border border-ink/15 px-5 text-sm text-ink hover:bg-paper">Choose another time</button>
              <button type="button" onClick={() => setStep("service")} className="min-h-11 border border-ink/15 px-5 text-sm text-ink hover:bg-paper">Start over</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}