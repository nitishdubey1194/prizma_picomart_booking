"use client";

import { useState, useMemo } from "react";
import { Search, X, Clock, IndianRupee, Check, Info } from "lucide-react";
import type { Service } from "@/lib/api";

interface Props {
  services: Service[];
  selectedServiceId: number | null;
  onSelectService: (service: Service) => void;
  isLoading: boolean;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelectService,
  isLoading,
}: Props) {
  const [search, setSearch] = useState<string>("");
  const [activeInfoService, setActiveInfoService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;

    return services.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(query);
      const descMatch = s.description?.toLowerCase().includes(query) ?? false;
      return nameMatch || descMatch;
    });
  }, [services, search]);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-16 animate-pulse items-center justify-between rounded-xl bg-zinc-100/60 px-4"
          >
            <div className="space-y-2">
              <div className="h-4 w-44 rounded bg-zinc-200" />
              <div className="h-3 w-20 rounded bg-zinc-200/50" />
            </div>
            <div className="h-5 w-14 rounded bg-zinc-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input - Clean minimal background without heavy borders */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search treatments or packages..."
          className="w-full rounded-xl bg-zinc-100/80 py-2.5 pl-10 pr-8 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:bg-zinc-100 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Borderless Service Rows with Dedicated Active Background */}
      <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-0.5">
        {filteredServices.map((s) => {
          const isSelected = selectedServiceId === s.id;
          const numericPrice = Number(s.price);

          return (
            <div
              key={s.id}
              onClick={() => onSelectService(s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectService(s);
                }
              }}
              className={`group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer select-none transition-colors duration-150 ${
                isSelected
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "bg-transparent hover:bg-zinc-50 text-zinc-800"
              }`}
            >
              {/* Left Column: Title + Time + Info Icon */}
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm leading-snug font-medium text-zinc-900 truncate">
                    {s.name}
                  </h3>

                  {s.description && (
                    <button
                      type="button"
                      aria-label={`View details for ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveInfoService(s);
                      }}
                      className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {s.description && (
                  <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1 leading-relaxed">
                    {s.description}
                  </p>
                )}

                <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400 font-normal">
                  <Clock className="h-3 w-3 text-zinc-400/80" />
                  <span>{s.durationMinutes} mins</span>
                  {s.bufferMinutes > 0 && (
                    <span>(+{s.bufferMinutes}m)</span>
                  )}
                </div>
              </div>

              {/* Right Column: Price + Selection Indicator */}
              <div className="flex items-center gap-3 shrink-0 pl-2">
                <div className="flex items-center text-sm font-semibold text-zinc-900">
                  <IndianRupee className="h-3.5 w-3.5 -mr-0.5 stroke-[2.2]" />
                  <span>
                    {numericPrice.toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>

                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-200/80 text-transparent group-hover:bg-zinc-300"
                  }`}
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredServices.length === 0 && (
          <div className="rounded-xl bg-zinc-50 py-8 px-4 text-center">
            <p className="text-xs text-zinc-500">
              No services found matching &ldquo;{search}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-2 text-xs font-medium text-zinc-900 underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Description Popup / Dialog */}
      {activeInfoService && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150"
          onClick={() => setActiveInfoService(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-zinc-900/5 sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title and Close Button */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <h4 className="text-base font-semibold text-zinc-900">
                  {activeInfoService.name}
                </h4>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1 font-medium text-zinc-700">
                    <IndianRupee className="h-3 w-3 -mr-0.5" />
                    {Number(activeInfoService.price).toLocaleString("en-IN", {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    {activeInfoService.durationMinutes} mins
                    {activeInfoService.bufferMinutes > 0 &&
                      ` (+${activeInfoService.bufferMinutes}m buffer)`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close details"
                onClick={() => setActiveInfoService(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Description Body */}
            <div className="py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Service Details
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 whitespace-pre-line">
                {activeInfoService.description}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setActiveInfoService(null)}
                className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectService(activeInfoService);
                  setActiveInfoService(null);
                }}
                className="rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition"
              >
                Select this service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}