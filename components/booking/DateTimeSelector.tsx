"use client";

import { useMemo } from "react";
import type { AvailabilitySlot } from "@/lib/api";

interface CalendarDay {
  iso: string;
  dayName: string;
  dayNum: number;
  month: string;
  isToday: boolean;
}

interface Props {
  calendarDays: CalendarDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  slots: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | null;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  isLoadingSlots: boolean;
  isDisabled: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function DateTimeSelector({
  calendarDays,
  selectedDate,
  onSelectDate,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoadingSlots,
  isDisabled,
}: Props) {
  // Segment slots into Morning (<12:00) and Afternoon/Evening (>=12:00)
  const { morningSlots, afternoonSlots } = useMemo(() => {
    const morning: AvailabilitySlot[] = [];
    const afternoon: AvailabilitySlot[] = [];

    slots.forEach((s) => {
      const hour = new Date(s.startTime).getHours();
      if (hour < 12) {
        morning.push(s);
      } else {
        afternoon.push(s);
      }
    });

    return { morningSlots: morning, afternoonSlots: afternoon };
  }, [slots]);

  return (
    <div className={isDisabled ? "opacity-40 pointer-events-none transition-opacity" : "transition-opacity space-y-6"}>
      {/* 14-Day Horizontal Scroll Calendar */}
      <div>
        <div className="no-scrollbar -mx-2 flex gap-2 overflow-x-auto px-2 pb-2">
          {calendarDays.map((d) => {
            const isSelected = selectedDate === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => onSelectDate(d.iso)}
                className={`flex min-w-[64px] shrink-0 flex-col items-center rounded-xl border py-2.5 px-2 text-center transition-all ${
                  isSelected
                    ? "border-ink bg-ink text-paper shadow-sm"
                    : "border-ink/10 bg-white/60 text-ink hover:border-ink/30 hover:bg-white"
                }`}
              >
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isSelected ? "text-paper/60" : "text-ink/40"}`}>
                  {d.dayName}
                </span>
                <span className="mt-1 font-display text-base font-medium leading-none">
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

      {/* Time Slots Divided by Periods */}
      <div>
        {isLoadingSlots ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-ink/5" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 bg-white/30 py-6 text-center">
            <p className="text-xs text-ink/50">No available openings on this day.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {morningSlots.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                  Morning
                </span>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {morningSlots.map((s) => (
                    <button
                      key={s.startTime}
                      type="button"
                      onClick={() => onSelectSlot(s)}
                      className={`h-10 rounded-lg border text-xs font-medium transition-all ${
                        selectedSlot?.startTime === s.startTime
                          ? "border-ink bg-ink text-paper shadow-sm"
                          : "border-ink/10 bg-white/70 text-ink/80 hover:border-ink/30 hover:bg-white"
                      }`}
                    >
                      {formatTime(s.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {afternoonSlots.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                  Afternoon & Evening
                </span>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {afternoonSlots.map((s) => (
                    <button
                      key={s.startTime}
                      type="button"
                      onClick={() => onSelectSlot(s)}
                      className={`h-10 rounded-lg border text-xs font-medium transition-all ${
                        selectedSlot?.startTime === s.startTime
                          ? "border-ink bg-ink text-paper shadow-sm"
                          : "border-ink/10 bg-white/70 text-ink/80 hover:border-ink/30 hover:bg-white"
                      }`}
                    >
                      {formatTime(s.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}