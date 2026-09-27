'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useAppointments,
  useProviders,
  useServices,
  useCurrentUser,
} from '@/lib/queries';

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const STATUS_PILL: Record<string, { label: string; badge: string; dot: string }> = {
  confirmed: {
    label: 'Confirmed',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    dot: 'bg-emerald-500 animate-pulse',
  },
  pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-800 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-ink/[0.04] text-ink/60 border-ink/10',
    dot: 'bg-ink/30',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    dot: 'bg-rose-500',
  },
};

export default function DashboardOverview() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const base = `${isDev ? 'http' : 'https'}://${subdomain}.${rootDomain}`;

  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
  const { data: appointments = [], isLoading: loadingAppointments } = useAppointments(subdomain);
  const { data: providers = [], isLoading: loadingProviders } = useProviders(subdomain);
  const { data: services = [], isLoading: loadingServices } = useServices(subdomain);

  const isVendor = user?.roles.includes('vendor') ?? false;
  const isProvider = user?.providerId !== null && user?.providerId !== undefined;

  // Filter relevant appointments based on role (Practitioners see their chair; Vendors see all)
  const scopedAppointments = useMemo(() => {
    if (!isVendor && isProvider && user?.providerId) {
      return appointments.filter((a) => a.providerId === user.providerId);
    }
    return appointments;
  }, [appointments, isVendor, isProvider, user]);

  const now = new Date();
  const todayStr = now.toDateString();

  // Metrics calculation
  const stats = useMemo(() => {
    let todaySessions = 0;
    let pendingActions = 0;
    let confirmedUpcoming = 0;

    scopedAppointments.forEach((a) => {
      const d = new Date(a.startTime);
      if (d.toDateString() === todayStr && a.status !== 'cancelled') {
        todaySessions += 1;
      }
      if (a.status === 'pending') {
        pendingActions += 1;
      }
      if (a.status === 'confirmed' && d >= now) {
        confirmedUpcoming += 1;
      }
    });

    return { todaySessions, pendingActions, confirmedUpcoming };
  }, [scopedAppointments, todayStr, now]);

  // Today's schedule queue
  const todaySchedule = useMemo(() => {
    return scopedAppointments
      .filter((a) => new Date(a.startTime).toDateString() === todayStr)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [scopedAppointments, todayStr]);

  // Upcoming upcoming next 5
  const upcomingQueue = useMemo(() => {
    return scopedAppointments
      .filter((a) => new Date(a.startTime) >= now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);
  }, [scopedAppointments, now]);

  const isLoading = loadingUser || loadingAppointments || loadingProviders || loadingServices;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-72 rounded-2xl bg-ink/5" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-ink/10 bg-white/40" />
          ))}
        </div>
        <div className="h-72 rounded-3xl border border-ink/10 bg-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-10 selection:bg-brass/20 selection:text-ink">
      {/* 1. Header Greeting & Date Anchor */}
      <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
            <span className="font-mono text-brass">Realtime Intelligence</span>
            <span className="text-ink/30">•</span>
            <span>{isVendor ? 'Studio Executive' : 'Specialist Desk'}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-ink/65">
            Here is your operational snapshot for <strong className="text-ink font-medium">{formatDisplayDate(now)}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`${base}/book`}
            target="_blank"
            className="inline-flex items-center justify-center rounded-full border border-ink/15 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:bg-ink hover:text-paper active:scale-[0.98]"
          >
            <span>Preview Booking Form</span>
            <span className="ml-1 text-[11px]">↗</span>
          </Link>
          <Link
            href={isVendor ? `${base}/dashboard/appointments` : `${base}/dashboard/my-bookings`}
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-wider text-paper shadow-sm transition-all hover:bg-brass active:scale-[0.98]"
          >
            <span>Manage Schedule</span>
          </Link>
        </div>
      </div>

      {/* 2. Operational Metrics Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Commitments */}
        <div className="group rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-sm">
          <div className="flex items-center justify-between text-ink/50">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
              Today&apos;s Bookings
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink/5 text-ink/70">
              ⚡
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-normal text-ink">
            {stats.todaySessions}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Scheduled across active chairs today
          </p>
        </div>

        {/* Card 2: Pending Confirmations */}
        <div className="group rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-sm">
          <div className="flex items-center justify-between text-amber-700/70">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
              Pending Actions
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-800">
              ⏳
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-normal text-amber-800">
            {stats.pendingActions}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Awaiting practitioner review
          </p>
        </div>

        {/* Card 3: Upcoming Confirmed */}
        <div className="group rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-sm">
          <div className="flex items-center justify-between text-emerald-700/70">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
              Confirmed Upcoming
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-800">
              ✓
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-normal text-emerald-800">
            {stats.confirmedUpcoming}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Guaranteed forward reservations
          </p>
        </div>

        {/* Card 4: Catalog Scope */}
        <div className="group rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-sm">
          <div className="flex items-center justify-between text-ink/50">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
              Catalog Scope
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink/5 text-ink/70">
              ❖
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-normal text-ink">
            {services.length}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            Active services across {providers.length} {providers.length === 1 ? 'specialist' : 'specialists'}
          </p>
        </div>
      </div>

      {/* 3. Main Dashboard Grid: Today's Run + Action Hub */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Left Column (8 cols): Today's Schedule Ledger */}
        <section className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <h2 className="font-display text-xl font-light text-ink sm:text-2xl">
                Today&apos;s Run List
              </h2>
              <p className="text-xs text-ink/60">Timeline of sessions designated for today.</p>
            </div>
            <Link
              href={isVendor ? `${base}/dashboard/appointments` : `${base}/dashboard/my-bookings`}
              className="text-xs font-medium text-brass hover:underline"
            >
              View Full Schedule →
            </Link>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 bg-white/40 p-8 text-center backdrop-blur-xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-ink/5 text-ink/40">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium text-ink">No Bookings Scheduled Today</p>
              <p className="mt-1 text-xs text-ink/50">Your calendar is currently clear for the remainder of the day.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/70 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs">
              <ul className="divide-y divide-ink/10">
                {todaySchedule.map((a) => {
                  const statusCfg = STATUS_PILL[a.status] ?? {
                    label: a.status,
                    badge: 'bg-ink/5 text-ink/60 border-ink/10',
                    dot: 'bg-ink/30',
                  };

                  return (
                    <li
                      key={a.id}
                      className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-white/80 sm:flex-row sm:items-center sm:p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-ink/10 bg-paper/80 font-mono text-xs">
                          <span className="font-semibold text-ink">
                            {formatSlotTime(a.startTime).split(' ')[0]}
                          </span>
                          <span className="text-[10px] uppercase text-ink/40">
                            {formatSlotTime(a.startTime).split(' ')[1]}
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-base font-medium text-ink">
                              {a.serviceName}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusCfg.badge}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-ink/60">
                            <span>Specialist: <strong className="font-medium text-ink">{a.providerName}</strong></span>
                            <span>•</span>
                            <span className="font-mono text-ink/70">{a.customerEmail}</span>
                          </div>

                          {a.customerNotes && (
                            <p className="mt-1.5 text-xs italic text-ink/60">
                              &ldquo;{a.customerNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <Link
                          href={isVendor ? `${base}/dashboard/appointments` : `${base}/dashboard/my-bookings`}
                          className="rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink"
                        >
                          View Details
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Forward queue preview */}
          {upcomingQueue.length > 0 && (
            <div className="pt-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                <h3 className="font-display text-lg font-light text-ink">
                  Upcoming Pipeline
                </h3>
                <span className="text-xs text-ink/50">Next scheduled bookings</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upcomingQueue.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col justify-between rounded-xl border border-ink/10 bg-white/60 p-4 transition-all hover:bg-white hover:shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-ink/50">
                        <span className="font-mono font-medium text-brass">
                          {formatDisplayDate(new Date(a.startTime))}
                        </span>
                        <span>{formatSlotTime(a.startTime)}</span>
                      </div>
                      <h4 className="mt-2 font-display text-sm font-medium text-ink">
                        {a.serviceName}
                      </h4>
                      <p className="mt-0.5 text-xs text-ink/60">With {a.providerName}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-2 text-[11px]">
                      <span className="capitalize text-ink/50">{a.status}</span>
                      <span className="text-ink/30">•</span>
                      <span className="truncate max-w-[120px] text-ink/60">{a.customerEmail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column (4 cols): Studio Console Shortcuts & Status */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-ink/50">
              Operations Console
            </h3>

            <div className="mt-4 space-y-2 text-xs">
              {isProvider && (
                <Link
                  href={`${base}/dashboard/my-availability`}
                  className="group flex items-center justify-between rounded-xl border border-ink/10 bg-paper/50 p-3 font-medium text-ink transition-all hover:border-ink/30 hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">🗓️</span>
                    <span>Set My Working Hours</span>
                  </div>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              )}

              {isVendor && (
                <>
                  <Link
                    href={`${base}/dashboard/services`}
                    className="group flex items-center justify-between rounded-xl border border-ink/10 bg-paper/50 p-3 font-medium text-ink transition-all hover:border-ink/30 hover:bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">✨</span>
                      <span>Manage Services & Pricing</span>
                    </div>
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>

                  <Link
                    href={`${base}/dashboard/providers`}
                    className="group flex items-center justify-between rounded-xl border border-ink/10 bg-paper/50 p-3 font-medium text-ink transition-all hover:border-ink/30 hover:bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">👥</span>
                      <span>Practitioner Roster</span>
                    </div>
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </Link>
                </>
              )}

              <Link
                href={`${base}/dashboard/${isVendor ? 'appointments' : 'my-bookings'}`}
                className="group flex items-center justify-between rounded-xl border border-ink/10 bg-paper/50 p-3 font-medium text-ink transition-all hover:border-ink/30 hover:bg-white"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">📋</span>
                  <span>Full Ledger & Confirmations</span>
                </div>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>

          {/* Domain & Public Engine Card */}
          <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink/40">
              Public Link
            </span>
            <h4 className="mt-2 font-display text-base font-medium text-ink">
              Storefront Endpoint
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">
              Clients access your booking engine directly at this URL:
            </p>
            <div className="mt-3 rounded-xl border border-ink/10 bg-paper/70 p-2.5 font-mono text-[11px] text-ink break-all">
              {base}
            </div>
            <div className="mt-4">
              <a
                href={base}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-white py-2 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <span>Launch Storefront</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}