'use client';

import { useParams } from 'next/navigation';
import { useCurrentUser } from '@/lib/queries';
import { ProviderAvailability } from '../availability/ProviderAvailability';

export default function MyAvailabilityPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: user, isLoading, isError } = useCurrentUser(subdomain);

  /* -------------------------------------------------------------------------- */
  /* Loading Skeleton State                                                     */
  /* -------------------------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-3 border-b border-ink/10 pb-8">
          <div className="h-6 w-36 rounded-full bg-ink/5" />
          <div className="h-10 w-72 rounded-2xl bg-ink/5" />
          <div className="h-4 w-96 rounded-lg bg-ink/5" />
        </div>

        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="h-28 rounded-3xl border border-ink/10 bg-white/40 p-6 backdrop-blur-xs"
            />
          ))}
        </div>

        {/* Content Body Skeleton */}
        <div className="h-96 rounded-3xl border border-ink/10 bg-white/40 backdrop-blur-xs" />
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Error Recovery State                                                       */
  /* -------------------------------------------------------------------------- */
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200/80 bg-rose-50/50 p-8 text-center backdrop-blur-xs sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-1 ring-rose-200">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="mt-5 font-display text-2xl font-light text-ink">
          Operational Synchronization Error
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70">
          We encountered an issue verifying your provider credentials against the directory ledger.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:bg-brass active:scale-[0.98]"
        >
          <span>Retry Connection</span>
          <span>↺</span>
        </button>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Unauthorized / Unlinked Provider State                                     */
  /* -------------------------------------------------------------------------- */
  if (!user || user.providerId === null) {
    return (
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-ink/10 bg-white/60 p-8 shadow-xs ring-1 ring-ink/5 backdrop-blur-sm sm:p-14">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/20">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          <span className="mt-6 inline-block font-mono text-xs font-semibold uppercase tracking-widest text-amber-800">
            Unassigned Workspace
          </span>

          <h2 className="mt-2 font-display text-3xl font-light tracking-tight text-ink">
            No Associated Seat
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Your authenticated account is not currently configured as a practitioner chair for{' '}
            <span className="font-semibold text-ink">{subdomain}</span>. Contact the platform
            administrator to link your profile to an active schedule.
          </p>

          <div className="mt-8 rounded-2xl border border-ink/10 bg-paper/60 p-5 text-left text-xs">
            <div className="flex items-center justify-between text-ink/60">
              <span>Account Identity</span>
              <span className="font-mono text-ink">{user?.email ?? 'Unknown User'}</span>
            </div>
            <div className="mt-3 border-t border-ink/5 pt-3 flex items-center justify-between text-ink/60">
              <span>Chair Linkage</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                Unassigned Provider Record
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Main Management Console                                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="mx-auto max-w-5xl space-y-10 selection:bg-brass/20 selection:text-ink">
      {/* Editorial Page Masthead */}
      <header className="relative border-b border-ink/10 pb-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white/70 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70 backdrop-blur-xs">
              <span className="font-mono text-brass">Console</span>
              <span className="text-ink/30">•</span>
              <span>Capacity Ledger</span>
            </div>

            <h1 className="font-display text-3xl font-light tracking-tight text-ink sm:text-5xl">
              Working Availability
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
              Define standard recurring hours, slot break intervals, and active appointment windows
              for your assigned chair. Modifications synchronize instantly with the public reservation engine.
            </p>
          </div>

          {/* Real-time Indicator Chip */}
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 p-3.5 shadow-xs backdrop-blur-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
            </span>
            <div className="text-left">
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/40">
                Booking Engine
              </span>
              <span className="block text-xs font-semibold text-ink">
                Live & Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* Ambient Metrics & Configuration Overview */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center justify-between text-ink/40">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
                Seat Parameter
              </span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="mt-3 font-display text-xl font-normal text-ink">
              Provider #{user.providerId}
            </p>
            <p className="mt-1 text-xs text-ink/60">
              Primary operational chair
            </p>
          </div>

          <div className="group rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center justify-between text-ink/40">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
                Tenant Space
              </span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
              </svg>
            </div>
            <p className="mt-3 font-display text-xl font-normal text-ink capitalize">
              {subdomain}
            </p>
            <p className="mt-1 text-xs text-ink/60">
              Active domain roster
            </p>
          </div>

          <div className="group rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:bg-white hover:shadow-sm">
            <div className="flex items-center justify-between text-ink/40">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
                Policy Window
              </span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-3 font-display text-xl font-normal text-ink">
              24-Hour Notice
            </p>
            <p className="mt-1 text-xs text-ink/60">
              Default booking cutoff buffer
            </p>
          </div>
        </div>
      </header>

      {/* Embedded Availability Table & Timeslot Matrix */}
      <section className="relative rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs sm:p-10">
        <div className="mb-8 flex flex-col justify-between gap-2 border-b border-ink/10 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-light text-ink">
              Weekly Routine & Intervals
            </h2>
            <p className="text-xs text-ink/60 sm:text-sm">
              Toggle availability status and set start and end operating hours for each day.
            </p>
          </div>

          <span className="self-start rounded-full bg-ink/5 px-3 py-1 font-mono text-[11px] font-medium text-ink/60 sm:self-center">
            Timezone: Asia/Kolkata (IST)
          </span>
        </div>

        <ProviderAvailability tenantSlug={subdomain} providerId={user.providerId} />
      </section>

      {/* Operational Protocol Callout */}
      <aside className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-6 text-xs text-ink/70">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink ring-1 ring-ink/10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-ink">Scheduling Conflict Safeguard</h3>
            <p className="leading-relaxed">
              Modifying an active recurring timeslot does not revoke previously confirmed customer
              reservations. If an existing appointment coincides with hours you are closing, cancel or
              reschedule that session from the appointments queue to release the slot cleanly.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}