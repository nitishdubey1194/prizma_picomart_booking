// components/booking/ProviderSelector.tsx
"use client";

import type { Provider } from "@/lib/api";

interface Props {
  providers: Provider[];
  selectedProviderId: number | null;
  onSelectProvider: (provider: Provider) => void;
  isLoading: boolean;
  hasSelectedService: boolean;
}

export function ProviderSelector({
  providers,
  selectedProviderId,
  onSelectProvider,
  isLoading,
  hasSelectedService,
}: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink/5" />
        ))}
      </div>
    );
  }

  if (!hasSelectedService) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-white/30 p-6 text-center">
        <p className="text-xs text-ink/50">Choose a service above to view specialists and rates.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
      {providers.map((p) => {
        const isSelected = selectedProviderId === p.id;
        const displayPrice = p.effectivePrice ? `₹${Number(p.effectivePrice).toFixed(2)}` : null;

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectProvider(p)}
            className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
              isSelected
                ? "border-ink bg-white shadow-sm ring-1 ring-ink"
                : "border-ink/10 bg-white/60 hover:border-ink/25 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isSelected ? "bg-ink text-paper" : "bg-ink/5 text-ink/70"
                }`}
              >
                {p.name.charAt(0)}
              </div>
              <div className="min-w-0 truncate">
                <p className="truncate text-xs sm:text-sm font-medium text-ink">{p.name}</p>
                <p className="truncate text-[11px] text-ink/50">{p.title || "Specialist"}</p>
              </div>
            </div>

            {/* Specialist-Specific Price Tag */}
            {/* {displayPrice && (
              <div className="shrink-0 text-right pl-2">
                <span className="text-xs font-bold text-ink">
                  {displayPrice}
                </span>
                {p.effectiveDuration && (
                  <p className="text-[10px] text-ink/40">
                    {p.effectiveDuration}m
                  </p>
                )}
              </div>
            )} */}
          </button>
        );
      })}
    </div>
  );
}