"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilitySlot } from "@/lib/api";

interface Props {
  selectedDate: string; // "YYYY-MM-DD"
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

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateTimeSelector({
  selectedDate,
  onSelectDate,
  slots,
  selectedSlot,
  onSelectSlot,
  isLoadingSlots,
  isDisabled,
}: Props) {
  // Today's midnight timestamp
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 40 days from today maximum
  const maxAllowedDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 40);
    return d;
  }, [today]);

  // Current calendar view month/year
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const canGoPrev = useMemo(() => {
    const firstOfCurrentView = new Date(viewYear, viewMonth, 1);
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstOfCurrentView > firstOfThisMonth;
  }, [viewYear, viewMonth, today]);

  const canGoNext = useMemo(() => {
    const lastOfNextView = new Date(viewYear, viewMonth + 1, 1);
    return lastOfNextView <= maxAllowedDate;
  }, [viewYear, viewMonth, maxAllowedDate]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Calendar matrix calculation
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon...

    const cells: {
      date: Date | null;
      dateStr: string;
      dayNum: number;
      isDisabled: boolean;
      isToday: boolean;
    }[] = [];

    // Empty cells before month start
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({
        date: null,
        dateStr: "",
        dayNum: 0,
        isDisabled: true,
        isToday: false,
      });
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(viewYear, viewMonth, day);
      cellDate.setHours(0, 0, 0, 0);

      const isPast = cellDate < today;
      const isBeyond40 = cellDate > maxAllowedDate;
      const isToday = cellDate.getTime() === today.getTime();
      const dateStr = toLocalDateString(cellDate);

      cells.push({
        date: cellDate,
        dateStr,
        dayNum: day,
        isDisabled: isPast || isBeyond40,
        isToday,
      });
    }

    return cells;
  }, [viewYear, viewMonth, today, maxAllowedDate]);

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

  const monthLabel = viewDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className={
        isDisabled
          ? "opacity-40 pointer-events-none transition-opacity duration-200"
          : "transition-opacity duration-200 space-y-6"
      }
    >
      {/* Calendar Header: Month + Navigation */}
      <div className="rounded-2xl bg-zinc-50/70 p-4">
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-semibold text-zinc-900 tracking-tight">
            {monthLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrev}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-200/70 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canGoNext}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-200/70 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
            <span
              key={dayName}
              className="text-[11px] font-medium text-zinc-400 py-1"
            >
              {dayName}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            if (!cell.date) {
              return <div key={`empty-${idx}`} className="h-9 w-full" />;
            }

            const isSelected = selectedDate === cell.dateStr;

            return (
              <button
                key={cell.dateStr}
                type="button"
                disabled={cell.isDisabled}
                onClick={() => onSelectDate(cell.dateStr)}
                className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs select-none transition-colors duration-150 ${
                  isSelected
                    ? "bg-zinc-900 font-semibold text-white shadow-xs"
                    : cell.isDisabled
                    ? "text-zinc-300 cursor-not-allowed"
                    : "text-zinc-800 font-normal hover:bg-zinc-200/60"
                }`}
              >
                <span>{cell.dayNum}</span>
                {cell.isToday && !isSelected && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-zinc-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Area */}
      <div>
        {isLoadingSlots ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-xl bg-zinc-100/70"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl bg-zinc-50 py-8 px-4 text-center">
            <p className="text-xs text-zinc-500">
              No available openings on this date. Please select another day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {morningSlots.length > 0 && (
              <div>
                <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                  Morning
                </span>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {morningSlots.map((s) => {
                    const isSelected = selectedSlot?.startTime === s.startTime;
                    return (
                      <button
                        key={s.startTime}
                        type="button"
                        onClick={() => onSelectSlot(s)}
                        className={`h-10 rounded-xl text-xs cursor-pointer select-none transition-colors duration-150 ${
                          isSelected
                            ? "bg-zinc-900 text-white font-medium"
                            : "bg-zinc-100/70 text-zinc-800 hover:bg-zinc-100 font-normal"
                        }`}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {afternoonSlots.length > 0 && (
              <div>
                <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
                  Afternoon & Evening
                </span>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {afternoonSlots.map((s) => {
                    const isSelected = selectedSlot?.startTime === s.startTime;
                    return (
                      <button
                        key={s.startTime}
                        type="button"
                        onClick={() => onSelectSlot(s)}
                        className={`h-10 rounded-xl text-xs cursor-pointer select-none transition-colors duration-150 ${
                          isSelected
                            ? "bg-zinc-900 text-white font-medium"
                            : "bg-zinc-100/70 text-zinc-800 hover:bg-zinc-100 font-normal"
                        }`}
                      >
                        {formatTime(s.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}