// components/booking/ProviderSelector.tsx
"use client";

import { Check } from "lucide-react";
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
      <div className="space-y-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-16 animate-pulse items-center justify-between rounded-xl bg-zinc-100/60 px-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-zinc-200" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 rounded bg-zinc-200" />
                <div className="h-3 w-20 rounded bg-zinc-200/50" />
              </div>
            </div>
            <div className="h-4 w-4 rounded-full bg-zinc-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!hasSelectedService) {
    return (
      <div className="rounded-xl bg-zinc-50 py-8 px-4 text-center">
        <p className="text-xs text-zinc-500">
          Choose a service above to view specialists and rates.
        </p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-50 py-8 px-4 text-center">
        <p className="text-xs text-zinc-500">
          No specialists available for the selected service.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
      {providers.map((p) => {
        const isSelected = selectedProviderId === p.id;

        return (
          <div
            key={p.id}
            onClick={() => onSelectProvider(p)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProvider(p);
              }
            }}
            className={`group flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer select-none transition-colors duration-150 ${
              isSelected
                ? "bg-zinc-100 text-zinc-900 font-medium"
                : "bg-transparent hover:bg-zinc-50 text-zinc-800"
            }`}
          >
            {/* Left Column: Avatar + Specialist Info */}
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isSelected
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-200/80 text-zinc-700 group-hover:bg-zinc-200"
                }`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 truncate">
                <p className="truncate text-sm leading-snug font-medium text-zinc-900">
                  {p.name}
                </p>
                <p className="truncate text-xs text-zinc-500 font-normal">
                  {p.title || "Specialist"}
                </p>
              </div>
            </div>

            {/* Right Column: Check Indicator */}
            <div className="shrink-0 pl-2">
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
    </div>
  );
}