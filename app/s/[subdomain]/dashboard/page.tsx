'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  ExternalLink,
  Sparkles,
  ArrowRight,
  User,
  CalendarDays,
  Store,
  ChevronRight,
  Scissors,
  Users,
} from 'lucide-react';
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

const STATUS_META: Record<
  string,
  {
    badgeLabel: string;
    badgeStyle: string;
    borderAccent: string;
  }
> = {
  pending: {
    badgeLabel: 'New Request',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30',
    borderAccent: 'border-l-amber-500',
  },
  confirmed: {
    badgeLabel: 'Scheduled',
    badgeStyle: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 ring-1 ring-emerald-500/20',
    borderAccent: 'border-l-emerald-600',
  },
  completed: {
    badgeLabel: 'Done',
    badgeStyle: 'bg-stone-200/70 text-stone-600 border-stone-300',
    borderAccent: 'border-l-stone-400',
  },
  cancelled: {
    badgeLabel: 'Cancelled',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
    borderAccent: 'border-l-rose-400',
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
  const isVendor = user?.role?.includes('vendor') ?? false;
  const isProvider = user?.providerId !== null && user?.providerId !== undefined;

  // Practitioners see their chair; Vendors see all
  const scopedAppointments = useMemo(() => {
    if (!isVendor && isProvider && user?.providerId) {
      return appointments.filter((a) => a.providerId === user.providerId);
    }
    return appointments;
  }, [appointments, isVendor, isProvider, user]);

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toDateString(), [now]);

  // Aggregate stats
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

  // Next 4 upcoming bookings
  const upcomingQueue = useMemo(() => {
    return scopedAppointments
      .filter((a) => new Date(a.startTime) >= now && a.status !== 'cancelled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);
  }, [scopedAppointments, now]);

  const isLoading = loadingUser || loadingAppointments || loadingProviders || loadingServices;

  const scheduleUrl = isVendor ? `${base}/dashboard/appointments` : `${base}/dashboard/my-bookings`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-3 py-6 sm:px-6">
        <div className="h-28 w-full animate-pulse rounded-3xl bg-stone-200/50" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200/50" />
          ))}
        </div>
        <div className="h-64 w-full animate-pulse rounded-3xl bg-stone-200/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* 1. Header Card with Live Status & Metric Capsule */}
      <header className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                {isVendor ? 'Studio Executive' : `Chair #${user?.providerId ?? 'Desk'}`}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Desk
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Operational overview for <span className="font-semibold text-stone-700">{formatDisplayDate(now)}</span>
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center rounded-2xl border border-stone-200 bg-white/70 p-1 shadow-2xs self-start sm:self-auto">
            <div className="px-3.5 py-1 text-center">
              <span className="block text-[9px] uppercase font-bold text-stone-400">Today</span>
              <span className="text-base font-bold text-stone-900 leading-tight">{stats.todaySessions}</span>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div className="px-3.5 py-1 text-center">
              <span className="block text-[9px] uppercase font-bold text-amber-700">Requests</span>
              <span className="text-base font-bold text-amber-700 leading-tight">{stats.pendingActions}</span>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div className="px-3.5 py-1 text-center">
              <span className="block text-[9px] uppercase font-bold text-emerald-700">Upcoming</span>
              <span className="text-base font-bold text-emerald-700 leading-tight">{stats.confirmedUpcoming}</span>
            </div>
          </div>
        </div>

        {/* Action Button Links Strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/70 pt-4">
          <div className="flex items-center gap-2">
            <Link
              href={scheduleUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 transition active:scale-[0.98]"
            >
              <span>Manage Appointments</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`${base}/book`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition active:scale-[0.98]"
            >
              <span>Client Booking Page</span>
              <ExternalLink className="h-3 w-3 text-stone-400" />
            </Link>
          </div>

          <span className="text-xs text-stone-500">
            <strong>{services.length}</strong> services active • <strong>{providers.length}</strong> {providers.length === 1 ? 'practitioner' : 'practitioners'}
          </span>
        </div>
      </header>

      {/* 2. Urgent Pending Requests Notification Banner */}
      {stats.pendingActions > 0 && (
        <Link
          href={scheduleUrl}
          className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/60 p-3.5 shadow-2xs transition hover:border-amber-400 hover:bg-amber-50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Action Required ({stats.pendingActions} Pending {stats.pendingActions === 1 ? 'Request' : 'Requests'})
              </p>
              <p className="text-xs text-amber-800/80">
                New client bookings are waiting for chair confirmation.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 group-hover:translate-x-0.5 transition-transform">
            Review <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      {/* 3. Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column: Today's Run List (8 cols) */}
        <section className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">
              Today&apos;s Run List
            </h2>
            <Link
              href={scheduleUrl}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
            >
              View Full Schedule →
            </Link>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-[#FAF8F5]/60 py-12 px-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200/60 text-stone-500">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-stone-800">Clear calendar today</p>
              <p className="mt-0.5 text-xs text-stone-400">No scheduled sessions for the rest of today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((a) => {
                const meta = STATUS_META[a.status] ?? STATUS_META.pending;
                const isPending = a.status === 'pending';

                return (
                  <div
                    key={a.id}
                    className={`relative overflow-hidden rounded-2xl border border-l-4 border-stone-200/90 ${meta.borderAccent} bg-[#FAF8F5] p-4 shadow-2xs transition hover:border-stone-300`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {/* Time Box */}
                        <div className="flex h-11 w-13 shrink-0 flex-col items-center justify-center rounded-xl bg-stone-200/60 font-mono text-center">
                          <span className="text-xs font-bold text-stone-900 leading-tight">
                            {formatSlotTime(a.startTime).split(' ')[0]}
                          </span>
                          <span className="text-[9px] uppercase font-semibold text-stone-500 leading-none">
                            {formatSlotTime(a.startTime).split(' ')[1]}
                          </span>
                        </div>

                        {/* Booking Meta */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-stone-900">
                              {a.serviceName}
                            </h3>
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeStyle}`}
                            >
                              {meta.badgeLabel}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                            <span>Specialist: <strong className="font-semibold text-stone-800">{a.providerName}</strong></span>
                            <span>•</span>
                            <span className="truncate max-w-[160px] text-stone-600">{a.customerEmail}</span>
                          </div>

                          {a.customerNotes && (
                            <p className="text-xs italic text-stone-500 line-clamp-1">
                              &ldquo;{a.customerNotes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="flex shrink-0 items-center justify-end border-t border-stone-200/60 pt-2 sm:border-0 sm:pt-0">
                        <Link
                          href={scheduleUrl}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-[0.98] ${
                            isPending
                              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-xs'
                              : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <span>{isPending ? 'Review Request' : 'Details'}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          
        </section>

        {/* Right Column: Console Shortcuts & Storefront Link (4 cols) */}
        <aside className="space-y-4 lg:col-span-4">
          {/* Quick Navigation Panel */}
          <div className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Operations Hub
            </h3>

            <div className="mt-3 space-y-2 text-xs">
              {isProvider && (
                <Link
                  href={`${base}/dashboard/my-availability`}
                  className="group flex items-center justify-between rounded-xl border border-stone-200/70 bg-white/70 p-3 font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-stone-400 group-hover:text-stone-900" />
                    <span>My Working Hours</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {isVendor && (
                <>
                  <Link
                    href={`${base}/dashboard/services`}
                    className="group flex items-center justify-between rounded-xl border border-stone-200/70 bg-white/70 p-3 font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <Scissors className="h-4 w-4 text-stone-400 group-hover:text-stone-900" />
                      <span>Services & Pricing</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href={`${base}/dashboard/providers`}
                    className="group flex items-center justify-between rounded-xl border border-stone-200/70 bg-white/70 p-3 font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-stone-400 group-hover:text-stone-900" />
                      <span>Practitioner Roster</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </>
              )}

              <Link
                href={scheduleUrl}
                className="group flex items-center justify-between rounded-xl border border-stone-200/70 bg-white/70 p-3 font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-white"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-stone-400 group-hover:text-stone-900" />
                  <span>Full Appointments Ledger</span>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Storefront Endpoint Card */}
          <div className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400">
              <Store className="h-3.5 w-3.5" />
              <span>Public Storefront</span>
            </div>

            <p className="mt-2 text-xs text-stone-600">
              Clients book appointments directly at your dedicated domain:
            </p>

            <div className="mt-2.5 rounded-xl border border-stone-200 bg-white/80 p-2 font-mono text-[11px] text-stone-800 break-all select-all">
              {base}
            </div>

            <div className="mt-3">
              <a
                href={base}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white py-2 text-xs font-semibold text-stone-800 shadow-2xs hover:bg-stone-50 transition active:scale-[0.98]"
              >
                <span>Launch Storefront</span>
                <ExternalLink className="h-3 w-3 text-stone-400" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}