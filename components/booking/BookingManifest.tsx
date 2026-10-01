"use client";

import type { Provider, Service, AvailabilitySlot } from "@/lib/api";

interface Props {
  service: Service | null;
  provider: Provider | null;
  slot: AvailabilitySlot | null;
  date: string;
  notes: string;
  onChangeNotes: (val: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookingManifest({
  service,
  provider,
  slot,
  date,
  notes,
  onChangeNotes,
  onConfirm,
  isPending,
  error,
}: Props) {
  const activePrice = provider?.effectivePrice ?? service?.price ?? null;
  const activeDuration = provider?.effectiveDuration ?? service?.durationMinutes ?? null;
  return (
    <aside className="lg:sticky lg:top-28">
      <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-7">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <span className="font-mono text-xs uppercase tracking-widest text-ink/50">
            Summary
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Live Sync
          </span>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-ink/40">
              Treatment
            </span>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {service ? (
                service.name
              ) : (
                <span className="text-ink/30 italic">Select a service</span>
              )}
            </p>
            {service && (
              <p className="text-[11px] text-ink/50">
                {service.durationMinutes} minutes dedicated
              </p>
            )}
          </div>

          <div className="border-t border-ink/5 pt-3">
            <span className="text-[10px] uppercase tracking-wider text-ink/40">
              Specialist / Shop
            </span>
            <p className="mt-0.5 text-sm font-medium text-ink">
              {provider ? (
                provider.name
              ) : (
                <span className="text-ink/30 italic">Select specialist</span>
              )}
            </p>
          </div>

          <div className="border-t border-ink/5 pt-3">
            <span className="text-[10px] uppercase tracking-wider text-ink/40">
              Date & Time
            </span>
            {slot ? (
              <p className="mt-0.5 text-sm font-medium text-ink">
                {formatDateLabel(date)} at {formatTime(slot.startTime)}
              </p>
            ) : (
              <p className="mt-0.5 text-ink/30 italic">
                Select date & time slot
              </p>
            )}
          </div>

          <div className="border-t border-ink/5 pt-3">
            <label
              htmlFor="notes"
              className="block text-[10px] uppercase tracking-wider text-ink/40"
            >
              Special Requests (Optional)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => onChangeNotes(e.target.value)}
              placeholder="Allergies, car model, or focus areas..."
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper/40 p-2.5 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
            />
          </div>

          <div className="border-t border-ink/5 pt-3">
            <div className="flex justify-between items-baseline">
                <span className="text-[10px] uppercase tracking-wider text-ink/40">Total Rate</span>
                {activePrice && (
                <span className="font-display text-lg font-bold text-ink">
                    ₹{Number(activePrice).toFixed(2)}
                </span>
                )}
            </div>
            {activeDuration && (
                <p className="text-[11px] text-ink/50 text-right">{activeDuration} mins dedicated</p>
            )}
            </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 border-t border-ink/10 pt-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!service || !provider || !slot || isPending}
            className="w-full rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-widest text-paper shadow-sm transition-all hover:bg-brass active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {isPending
              ? "Locking Session…"
              : !service
                ? "Choose Service First"
                : !provider
                  ? "Select Specialist"
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
  );
}
