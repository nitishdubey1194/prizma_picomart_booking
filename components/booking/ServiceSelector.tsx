"use client";

import { useState, useMemo } from "react";
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Filter items dynamically based on search and category
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [services, search]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input for Quick Filtering */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search treatments or packages..."
          className="w-full rounded-xl border border-ink/10 bg-white/70 px-4 py-2.5 pl-10 text-xs sm:text-sm text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
        <svg
          className="absolute left-3.5 top-3 h-4 w-4 text-ink/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Responsive Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredServices.map((s) => {
          const isSelected = selectedServiceId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectService(s)}
              className={`group flex items-start justify-between rounded-xl border p-4 text-left transition-all ${
                isSelected
                  ? "border-ink bg-white shadow-sm ring-1 ring-ink"
                  : "border-ink/10 bg-white/60 hover:border-ink/30 hover:bg-white"
              }`}
            >
              <div className="pr-3">
                <p className="font-medium text-sm text-ink">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-ink/50 line-clamp-1 mt-0.5">{s.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/70">
                        {s.durationMinutes} mins
                    </span>
                    
                </div>
              </div>
              <div
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                  isSelected
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/20 group-hover:border-ink/40"
                }`}
              >
                {isSelected && <span className="h-1 w-1 rounded-full bg-paper" />}
              </div>
            </button>
          );
        })}

        {filteredServices.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-ink/40">
            No services match {search}.
          </div>
        )}
      </div>
    </div>
  );
}