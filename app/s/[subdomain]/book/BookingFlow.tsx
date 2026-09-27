"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AvailabilitySlot, Provider, Service } from "@/lib/api";
import {
  useProviders,
  useServices,
  useAvailability,
  useBookAppointment,
} from "@/lib/queries";
import { getAccessToken } from "@/lib/auth";

type Step = "configure" | "confirm" | "done";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookingFlow({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const { data: providers = [], isLoading: loadingProviders } = useProviders(tenantSlug);
  const { data: services = [], isLoading: loadingServices } = useServices(tenantSlug);

  const [step, setStep] = useState<Step>("configure");
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Generate the next 14 selectable calendar days
  const calendarDays = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      list.push({
        iso,
        dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  const { data: slots = [], isLoading: loadingSlots } = useAvailability(
    tenantSlug,
    provider?.id ?? null,
    date,
    service?.id ?? null
  );

  const bookMutation = useBookAppointment(tenantSlug);

  // Auto-select first provider if only one exists
  useMemo(() => {
    if (providers.length === 1 && !provider) {
      setProvider(providers[0]);
    }
  }, [providers, provider]);

  async function handleConfirm() {
    if (!provider || !service || !slot) return;

    const token = await getAccessToken();
    if (!token) {
      router.push(`/login?returnTo=${encodeURIComponent("/book")}`);
      return;
    }

    setError(null);
    bookMutation.mutate(
      {
        accessToken: token,
        providerId: provider.id,
        serviceId: service.id,
        startTime: slot.startTime,
        customerNotes: notes.trim() || undefined,
      },
      {
        onSuccess: () => setStep("done"),
        onError: (err) =>
          setError(
            err instanceof Error
              ? err.message
              : "This slot is no longer available. Please select another time."
          ),
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /* SUCCESS / CONFIRMED VIEW                                                   */
  /* -------------------------------------------------------------------------- */
  if (step === "done") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-8 shadow-sm backdrop-blur-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brass/10 text-brass">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-brass">
            Confirmed Booking
          </p>
          <h2 className="mt-2 font-display text-3xl font-light text-ink">
            We look forward to seeing you.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            A confirmation receipt and calendar details have been issued to your account.
          </p>

          <div className="mt-8 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-paper/50 text-left text-xs sm:text-sm">
            <div className="flex items-center justify-between p-4">
              <span className="text-ink/50">Treatment</span>
              <span className="font-medium text-ink">{service?.name}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-ink/50">Specialist</span>
              <span className="font-medium text-ink">{provider?.name}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="text-ink/50">Time & Date</span>
              <span className="font-medium text-ink">
                {slot && `${formatDateLabel(date)}, ${formatTime(slot.startTime)}`}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/bookings"
              className="inline-flex items-center justify-center rounded-full bg-ink px-7 py-3.5 text-xs font-medium uppercase tracking-wider text-paper transition-all hover:bg-brass active:scale-[0.98]"
            >
              Manage My Appointments
            </Link>
            <button
              type="button"
              onClick={() => {
                setStep("configure");
                setService(null);
                setSlot(null);
                setNotes("");
              }}
              className="inline-flex items-center justify-center rounded-full border border-ink/15 px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-ink transition-colors hover:bg-ink/5"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* MAIN BOOKING CONSOLE                                                       */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
      {/* LEFT COLUMN: Progressive Selection Flow (7 cols) */}
      <div className="space-y-12 lg:col-span-7">
        {/* SECTION 1: Service Selection */}
        <section>
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold text-brass">01</span>
              <h2 className="font-display text-xl font-normal text-ink">Choose Service</h2>
            </div>
            <span className="text-xs text-ink/40">Step 1 of 3</span>
          </div>

          {loadingServices ? (
            <div className="mt-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink/5" />
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {services.map((s) => {
                const isSelected = service?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setService(s);
                      setSlot(null);
                    }}
                    className={`group relative flex w-full items-start justify-between rounded-2xl border p-5 text-left transition-all duration-150 ${
                      isSelected
                        ? "border-ink bg-white shadow-sm ring-1 ring-ink"
                        : "border-ink/10 bg-white/50 hover:border-ink/25 hover:bg-white"
                    }`}
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base font-medium text-ink">{s.name}</span>
                        <span className="text-ink/30">•</span>
                        <span className="text-xs text-ink/50">{s.durationMinutes} mins</span>
                      </div>
                      {s.description && (
                        <p className="mt-1 text-xs leading-relaxed text-ink/60 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? "border-ink bg-ink text-paper"
                          : "border-ink/20 group-hover:border-ink/40"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-paper" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: Specialist (Providers) */}
        <section className={!service ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity"}>
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold text-brass">02</span>
              <h2 className="font-display text-xl font-normal text-ink">Select Specialist</h2>
            </div>
            {providers.length > 1 && (
              <span className="text-xs text-ink/40">Select practitioner</span>
            )}
          </div>

          {loadingProviders ? (
            <div className="mt-4 flex gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 w-36 animate-pulse rounded-2xl bg-ink/5" />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {providers.map((p) => {
                const isSelected = provider?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p);
                      setSlot(null);
                    }}
                    className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-ink bg-white shadow-sm ring-1 ring-ink"
                        : "border-ink/10 bg-white/50 hover:border-ink/25 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isSelected ? "bg-ink text-paper" : "bg-ink/5 text-ink/70"
                      }`}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                      <p className="text-[11px] text-ink/50">Practitioner</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 3: Date & Slot Calendar */}
        <section className={!service ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity"}>
          <div className="flex items-baseline justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs font-semibold text-brass">03</span>
              <h2 className="font-display text-xl font-normal text-ink">Date & Time</h2>
            </div>
            <span className="text-xs text-ink/50">{formatDateLabel(date)}</span>
          </div>

          {/* Horizontal Calendar Date Ribbon */}
          <div className="mt-5">
            <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
              {calendarDays.map((d) => {
                const isSelected = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => {
                      setDate(d.iso);
                      setSlot(null);
                    }}
                    className={`flex min-w-[70px] shrink-0 flex-col items-center rounded-2xl border py-3 px-2 text-center transition-all ${
                      isSelected
                        ? "border-ink bg-ink text-paper shadow-sm"
                        : "border-ink/10 bg-white/60 text-ink hover:border-ink/30 hover:bg-white"
                    }`}
                  >
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${isSelected ? "text-paper/60" : "text-ink/40"}`}>
                      {d.dayName}
                    </span>
                    <span className="mt-1 font-display text-lg font-medium leading-none">
                      {d.dayNum}
                    </span>
                    <span className={`mt-1 text-[9px] uppercase tracking-wider ${isSelected ? "text-paper/40" : "text-ink/30"}`}>
                      {d.month}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Slot Pills */}
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">
              Available Timeslots
            </p>

            {loadingSlots ? (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-ink/5" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-ink/15 bg-white/30 py-8 text-center">
                <p className="text-xs text-ink/50">No open times on this date. Select another day above.</p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => {
                  const isSelected = slot?.startTime === s.startTime;
                  return (
                    <button
                      key={s.startTime}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`flex h-11 items-center justify-center rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-ink bg-ink text-paper shadow-sm"
                          : "border-ink/10 bg-white/70 text-ink/80 hover:border-ink/30 hover:bg-white"
                      }`}
                    >
                      {formatTime(s.startTime)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Sticky Session Ledger Card (5 cols) */}
      <aside className="lg:sticky lg:top-28 lg:col-span-5">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-7">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-ink/50">Manifest</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Live Sync
            </span>
          </div>

          {/* Details breakdown */}
          <div className="mt-5 space-y-4 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-ink/40">Treatment</span>
              <p className="mt-0.5 text-sm font-medium text-ink">
                {service ? service.name : <span className="text-ink/30 italic">Select a service</span>}
              </p>
              {service && (
                <p className="text-[11px] text-ink/50">{service.durationMinutes} minutes dedicated</p>
              )}
            </div>

            <div className="border-t border-ink/5 pt-3">
              <span className="text-[10px] uppercase tracking-wider text-ink/40">Practitioner</span>
              <p className="mt-0.5 text-sm font-medium text-ink">
                {provider ? provider.name : <span className="text-ink/30 italic">Any available specialist</span>}
              </p>
            </div>

            <div className="border-t border-ink/5 pt-3">
              <span className="text-[10px] uppercase tracking-wider text-ink/40">Time & Date</span>
              {slot ? (
                <p className="mt-0.5 text-sm font-medium text-ink">
                  {formatDateLabel(date)} at {formatTime(slot.startTime)}
                </p>
              ) : (
                <p className="mt-0.5 text-ink/30 italic">Select date & time slot</p>
              )}
            </div>

            {/* Special Instructions Input */}
            <div className="border-t border-ink/5 pt-3">
              <label htmlFor="notes" className="block text-[10px] uppercase tracking-wider text-ink/40">
                Special Requests (Optional)
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, preferences, or focus areas..."
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper/40 p-2.5 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 border-t border-ink/10 pt-4">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!service || !provider || !slot || bookMutation.isPending}
              className="w-full rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-widest text-paper shadow-sm transition-all hover:bg-brass active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {bookMutation.isPending
                ? "Locking Session…"
                : !service
                ? "Choose Service First"
                : !slot
                ? "Select Time Slot"
                : "Reserve Appointment"}
            </button>

            <p className="mt-3 text-center text-[10px] text-ink/40">
              Free cancellation up to 24 hours before your session.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}