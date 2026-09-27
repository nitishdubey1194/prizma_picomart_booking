'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppointments, useCancelAppointment } from '@/lib/queries';
import { getAccessToken } from '@/lib/auth';
import { Nav } from '@/components/Nav';

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  confirmed: {
    label: 'Confirmed',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    dotClass: 'bg-emerald-500 animate-pulse',
  },
  pending: {
    label: 'Awaiting Confirmation',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/60',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-ink/[0.04] text-ink/60 border-ink/10',
    dotClass: 'bg-ink/30',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dotClass: 'bg-rose-500',
  },
};

type FilterTab = 'upcoming' | 'past' | 'all';

export default function MyBookingsPage() {
  const router = useRouter();
  const { subdomain } = useParams<{ subdomain: string }>();
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const base = `${isDev ? 'http' : 'https'}://${subdomain}.${rootDomain}`;

  const { data: appointments = [], isLoading, error } = useAppointments(subdomain);
  const cancelAppointment = useCancelAppointment(subdomain);

  const [activeTab, setActiveTab] = useState<FilterTab>('upcoming');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => {
      if (!token) {
        router.push(`${base}/login?returnTo=${encodeURIComponent(`${base}/bookings`)}`);
      }
    });
  }, [base, router]);

  const businessName = titleCase(subdomain);

  // Split appointments by timeline
  const now = new Date();
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const isPast = new Date(a.startTime) < now || a.status === 'completed' || a.status === 'cancelled';
      if (activeTab === 'upcoming') return !isPast;
      if (activeTab === 'past') return isPast;
      return true;
    });
  }, [appointments, activeTab, now]);

  const upcomingCount = useMemo(() => {
    return appointments.filter(
      (a) => new Date(a.startTime) >= now && a.status !== 'cancelled' && a.status !== 'completed'
    ).length;
  }, [appointments, now]);

  async function handleConfirmCancel(appointmentId: number) {
    setActionError(null);
    cancelAppointment.mutate(
      { id: appointmentId },
      {
        onSuccess: () => setCancellingId(null),
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : 'Could not process cancellation.');
          setCancellingId(null);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink antialiased selection:bg-brass/20 selection:text-ink">
      <Nav businessName={businessName} base={base} />

      {/* Breadcrumb Header */}
      <header className="border-b border-ink/10 bg-white/40 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink/50 sm:text-sm">
            <Link 
              href={base} 
              className="transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
            >
              {businessName}
            </Link>
            <span className="text-ink/30" aria-hidden="true">/</span>
            <span className="font-medium text-ink" aria-current="page">
              My Appointments
            </span>
          </nav>

          <Link
            href={`${base}/book`}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:bg-brass active:scale-[0.98]"
          >
            <span>+ Book New</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
              <span className="font-mono text-brass">Dashboard</span>
              <span className="text-ink/30">•</span>
              <span>Client Portal</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
              Appointment Schedule
            </h1>
            <p className="mt-1 text-sm text-ink/65">
              Review session manifests, status confirmations, and booking history.
            </p>
          </div>

          {/* Filter Segmented Control */}
          <div className="flex rounded-full border border-ink/10 bg-white/80 p-1 text-xs shadow-xs backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-ink text-paper shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              <span>Upcoming</span>
              {upcomingCount > 0 && (
                <span
                  className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    activeTab === 'upcoming' ? 'bg-brass text-white' : 'bg-ink/10 text-ink'
                  }`}
                >
                  {upcomingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('past')}
              className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
                activeTab === 'past'
                  ? 'bg-ink text-paper shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              Past
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-ink text-paper shadow-xs'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              All ({appointments.length})
            </button>
          </div>
        </div>

        {/* Global Action Error Banner */}
        {actionError && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800">
            <div className="flex items-center gap-2.5">
              <span>⚠️</span>
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="font-semibold text-rose-800 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-ink/10 bg-white/40"
              />
            ))}
          </div>
        )}

        {/* Query Error State */}
        {error && !isLoading && (
          <div className="mt-10 rounded-2xl border border-dashed border-rose-300 bg-rose-50/40 p-10 text-center">
            <p className="text-sm font-medium text-rose-800">Unable to load appointment records.</p>
            <p className="mt-1 text-xs text-rose-600">Please verify your session credentials or refresh the page.</p>
          </div>
        )}

        {/* Empty Records State */}
        {!isLoading && !error && filteredAppointments.length === 0 && (
          <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white/40 px-6 py-16 text-center backdrop-blur-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5 text-ink/40 ring-1 ring-ink/10">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-lg font-medium text-ink">
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Records Found'}
            </h2>
            <p className="mt-1 max-w-sm text-xs text-ink/60">
              {activeTab === 'upcoming'
                ? 'You have no reservations scheduled. Choose an open calendar opening to secure your next visit.'
                : 'There are no prior appointments matching this criteria.'}
            </p>
            <Link
              href={`${base}/book`}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper shadow-sm transition-all hover:bg-brass active:scale-[0.98]"
            >
              Book an Appointment
            </Link>
          </div>
        )}

        {/* Appointments List Matrix */}
        {!isLoading && !error && filteredAppointments.length > 0 && (
          <ul className="mt-8 space-y-4">
            {filteredAppointments.map((a) => {
              const startDate = new Date(a.startTime);
              const statusCfg = STATUS_MAP[a.status] ?? {
                label: a.status,
                badgeClass: 'bg-ink/5 text-ink/60 border-ink/10',
                dotClass: 'bg-ink/30',
              };

              const canCancel = (a.status === 'pending' || a.status === 'confirmed') && startDate > now;
              const isConfirmingCancel = cancellingId === a.id;

              return (
                <li
                  key={a.id}
                  className="group relative flex flex-col justify-between gap-6 rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-md sm:flex-row sm:items-center sm:p-6"
                >
                  {/* Left: Date pill & Details */}
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Date Block */}
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-ink/10 bg-paper/80 font-display shadow-2xs sm:h-16 sm:w-16">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brass">
                        {startDate.toLocaleDateString('en-IN', { month: 'short' })}
                      </span>
                      <span className="text-lg font-light leading-none text-ink sm:text-xl">
                        {startDate.getDate()}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-ink/40">
                        {startDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Service & Specialist details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-lg font-medium text-ink sm:text-xl">
                          {a.serviceName}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusCfg.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/65">
                        <span className="flex items-center gap-1.5 font-medium text-ink">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/5 text-[10px] uppercase font-mono">
                            {a.providerName.charAt(0)}
                          </span>
                          {a.providerName}
                        </span>

                        <span className="text-ink/25">•</span>

                        <span>
                          {startDate.toLocaleTimeString('en-IN', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions / Inline Cancel Confirmation */}
                  <div className="flex shrink-0 items-center justify-end border-t border-ink/5 pt-3 sm:border-t-0 sm:pt-0">
                    {canCancel && (
                      <div>
                        {isConfirmingCancel ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-rose-700">Cancel booking?</span>
                            <button
                              type="button"
                              onClick={() => handleConfirmCancel(a.id)}
                              disabled={cancelAppointment.isPending}
                              className="rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
                            >
                              {cancelAppointment.isPending ? 'Cancelling…' : 'Yes, Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingId(null)}
                              className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-ink/5"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCancellingId(a.id)}
                            className="rounded-full border border-ink/15 bg-white/60 px-4 py-2 text-xs font-medium tracking-wide text-ink/70 transition-all hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700 active:scale-[0.98]"
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    )}

                    {!canCancel && a.status === 'completed' && (
                      <Link
                        href={`${base}/book`}
                        className="rounded-full border border-ink/15 bg-white/60 px-4 py-2 text-xs font-medium tracking-wide text-ink/70 transition-all hover:border-ink hover:text-ink active:scale-[0.98]"
                      >
                        Rebook Session
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="border-t border-ink/10 bg-paper py-8 text-xs text-ink/60 sm:py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href={`${base}/book`} className="transition-colors hover:text-ink">
              Schedule Another Session
            </Link>
            <span className="h-1 w-1 rounded-full bg-ink/20" />
            <p className="text-ink/40">Powered by Picomart Engine</p>
          </div>
        </div>
      </footer>
    </div>
  );
}