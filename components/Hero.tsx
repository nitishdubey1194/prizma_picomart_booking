'use client';

import Link from 'next/link';

function formatSlot(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  return isToday 
    ? `Today at ${time}` 
    : `${date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
}

export function Hero({
  businessName,
  tagline,
  nextSlotIso,
  base,
}: {
  businessName: string;
  tagline: string;
  nextSlotIso: string | null;
  base: string;
}) {
  const nextSlot = formatSlot(nextSlotIso);

  return (
    <section className="relative border-b border-ink/10 bg-gradient-to-b from-paper via-paper to-ink/[0.015] px-6 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.02] px-3.5 py-1 text-xs font-medium tracking-widest uppercase text-ink/70">
            Professional Consultations
          </div>

          <h1 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-6xl sm:leading-[1.08]">
            {businessName}
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-ink/70 sm:text-xl sm:leading-relaxed font-light">
            {tagline}
          </p>
        </div>

        {/* Action Panel */}
        <div className="mt-12 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-full border border-ink/10 bg-white/70 px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-sm sm:px-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-ink/50">Next Open Slot</span>
            <span className="text-xs text-ink/30">•</span>
            <span className="text-sm font-medium text-ink">
              {nextSlot ?? 'Check calendar for availability'}
            </span>
          </div>

          <Link
            href={`${base}/book`}
            className="inline-flex items-center justify-center rounded-full bg-brass px-7 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass active:scale-[0.98]"
          >
            Reserve Session
          </Link>
        </div>
      </div>
    </section>
  );
}