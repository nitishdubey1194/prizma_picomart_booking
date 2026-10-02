'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAppointments, useUpdateAppointmentStatus, useCurrentUser } from '@/lib/queries';
import type { AppointmentWithDetails } from '@/lib/api';
import { Mail, Phone } from 'lucide-react';

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
    label: 'Pending Review',
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

type FilterView = 'active' | 'today' | 'pending' | 'all';

function allowedNextStatuses(status: AppointmentWithDetails['status']) {
  if (status === 'pending') return ['confirmed', 'cancelled'] as const;
  if (status === 'confirmed') return ['completed', 'cancelled'] as const;
  return [] as const;
}

function getActionLabel(status: 'confirmed' | 'cancelled' | 'completed') {
  switch (status) {
    case 'confirmed':
      return 'Confirm Slot';
    case 'completed':
      return 'Mark Complete';
    case 'cancelled':
      return 'Cancel';
    default:
      return status;
  }
}

export default function MyBookingsDashboardPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
  const { data: appointments = [], isLoading: loadingAppointments, error } = useAppointments(subdomain);
  const updateStatus = useUpdateAppointmentStatus(subdomain);

  const [filter, setFilter] = useState<FilterView>('active');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter down strictly to appointments for this practitioner's chair
  const myBookings = useMemo(() => {
    if (!user || user.providerId === null) return [];
    return appointments.filter((a) => a.providerId === user.providerId);
  }, [appointments, user]);

  const now = new Date();
  const todayStr = now.toDateString();

  // Metrics Counters
  const metrics = useMemo(() => {
    const todayCount = myBookings.filter(
      (a) => new Date(a.startTime).toDateString() === todayStr && a.status !== 'cancelled'
    ).length;

    const pendingCount = myBookings.filter((a) => a.status === 'pending').length;
    const confirmedCount = myBookings.filter((a) => a.status === 'confirmed').length;

    return { todayCount, pendingCount, confirmedCount };
  }, [myBookings, todayStr]);

  // Tab Filtering Logic
  const filteredBookings = useMemo(() => {
    return myBookings.filter((a) => {
      const isPast = new Date(a.startTime) < now;
      const isToday = new Date(a.startTime).toDateString() === todayStr;

      if (filter === 'active') {
        return (a.status === 'pending' || a.status === 'confirmed') && !isPast;
      }
      if (filter === 'today') {
        return isToday && a.status !== 'cancelled';
      }
      if (filter === 'pending') {
        return a.status === 'pending';
      }
      return true;
    });
  }, [myBookings, filter, now, todayStr]);

  function handleStatusChange(id: number, nextStatus: 'confirmed' | 'cancelled' | 'completed') {
    setActionError(null);
    updateStatus.mutate(
      { id, status: nextStatus },
      {
        onSuccess: () => setCancellingId(null),
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : 'Could not modify appointment state.');
          setCancellingId(null);
        },
      }
    );
  }

  /* ------------------------------------------------------------- */
  /* Access / Guard States                                         */
  /* ------------------------------------------------------------- */
  if (loadingUser || loadingAppointments) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-20 animate-pulse rounded-2xl border border-ink/10 bg-white/40" />
        <div className="h-44 animate-pulse rounded-2xl border border-ink/10 bg-white/40" />
      </div>
    );
  }

  if (!user || user.providerId === null) {
    return (
      <div className="rounded-3xl border border-dashed border-ink/15 bg-white/50 p-12 text-center backdrop-blur-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5 text-ink/40">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mt-4 font-display text-lg font-medium text-ink">Practitioner Record Unlinked</h2>
        <p className="mt-1 text-xs text-ink/60">
          This account is not associated with an active provider seat in this studio.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/50 p-8 text-center">
        <p className="text-sm font-medium text-rose-800">Could not retrieve schedule entries.</p>
        <p className="mt-1 text-xs text-rose-600">Please refresh or verify operational permissions.</p>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* Main Dashboard Interface                                      */
  /* ------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* Header & Metric Counter Cards */}
      <div>
        <div className="flex flex-col justify-between gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
              <span className="font-mono text-brass">Practitioner Console</span>
              <span className="text-ink/30">•</span>
              <span>Schedule Manager</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
              Chair Appointments
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Manage incoming requests, attendance statuses, and chair availability.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-2.5 text-center shadow-xs backdrop-blur-xs">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink/40">Today</span>
              <span className="font-display text-xl font-medium text-ink">{metrics.todayCount}</span>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-2.5 text-center shadow-xs backdrop-blur-xs">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700/60">Pending</span>
              <span className="font-display text-xl font-medium text-amber-800">{metrics.pendingCount}</span>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-2.5 text-center shadow-xs backdrop-blur-xs">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700/60">Confirmed</span>
              <span className="font-display text-xl font-medium text-emerald-800">{metrics.confirmedCount}</span>
            </div>
          </div>
        </div>

        {/* View Filter Pill Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border border-ink/10 bg-white/80 p-1 text-xs shadow-xs backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setFilter('active')}
              className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
                filter === 'active' ? 'bg-ink text-paper shadow-xs' : 'text-ink/60 hover:text-ink'
              }`}
            >
              Active Queue
            </button>
            <button
              type="button"
              onClick={() => setFilter('today')}
              className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
                filter === 'today' ? 'bg-ink text-paper shadow-xs' : 'text-ink/60 hover:text-ink'
              }`}
            >
              Today&apos;s Slots
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition-all ${
                filter === 'pending' ? 'bg-ink text-paper shadow-xs' : 'text-ink/60 hover:text-ink'
              }`}
            >
              <span>Pending Action</span>
              {metrics.pendingCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {metrics.pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full px-3.5 py-1.5 font-medium transition-all ${
                filter === 'all' ? 'bg-ink text-paper shadow-xs' : 'text-ink/60 hover:text-ink'
              }`}
            >
              Full Ledger ({myBookings.length})
            </button>
          </div>

          <span className="text-xs text-ink/40">
            Showing <strong className="text-ink">{filteredBookings.length}</strong> items
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {actionError && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white/40 px-6 py-16 text-center backdrop-blur-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5 text-ink/40">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-lg font-medium text-ink">No Appointments in View</h2>
          <p className="mt-1 max-w-sm text-xs text-ink/50">
            No schedule bookings match the active filter criteria. Switch filters or await incoming bookings.
          </p>
        </div>
      )}

      {/* Bookings Queue */}
      {filteredBookings.length > 0 && (
        <ul className="space-y-4">
          {filteredBookings.map((a) => {
            const startDate = new Date(a.startTime);
            const statusCfg = STATUS_MAP[a.status] ?? {
              label: a.status,
              badgeClass: 'bg-ink/5 text-ink/60 border-ink/10',
              dotClass: 'bg-ink/30',
            };
            const nextOptions = allowedNextStatuses(a.status);
            const isConfirmingCancel = cancellingId === a.id;

            return (
              <li
                key={a.id}
                className="group relative flex flex-col justify-between gap-6 rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-md sm:flex-row sm:items-center sm:p-6"
              >
                {/* Left Column: Date Stamp & Customer Info */}
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Visual Date Badge */}
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

                  {/* Booking Metadata */}
                  <div className="space-y-1">
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

                    {/* Email, Time & ID details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink/60">
  <span className="font-medium text-ink">
    {startDate.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })}
  </span>
  <a
    href={`mailto:${a.customerEmail}`}
    className="flex items-center gap-1.5 transition-colors hover:text-ink"
  >
    <Mail className="h-3.5 w-3.5 text-ink/40" />
    <span>{a.customerEmail}</span>
  </a>
  <a
    href={`tel:${a.customerMobile}`}
    className="flex items-center gap-1.5 transition-colors hover:text-ink"
  >
    <Phone className="h-3.5 w-3.5 text-ink/40" />
    <span>{a.customerMobile}</span>
  </a>
</div>

                    {/* Customer Notes Quote */}
                    {a.customerNotes && (
                      <div className="mt-2 rounded-xl border border-ink/10 bg-paper/60 px-3.5 py-2 text-xs italic text-ink/75">
                        &ldquo;{a.customerNotes}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: State Transitions & Inline Guard */}
                <div className="flex shrink-0 items-center justify-end border-t border-ink/5 pt-3 sm:border-t-0 sm:pt-0">
                  {isConfirmingCancel ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-700">Cancel this slot?</span>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(a.id, 'cancelled')}
                        disabled={updateStatus.isPending}
                        className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-rose-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingId(null)}
                        className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-ink/5"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {nextOptions.map((next) => {
                        const isCancel = next === 'cancelled';
                        const isConfirm = next === 'confirmed';
                        const isComplete = next === 'completed';

                        return (
                          <button
                            key={next}
                            type="button"
                            onClick={() => {
                              if (isCancel) {
                                setCancellingId(a.id);
                              } else {
                                handleStatusChange(a.id, next);
                              }
                            }}
                            disabled={updateStatus.isPending}
                            className={`rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 ${
                              isConfirm
                                ? 'bg-ink text-paper shadow-xs hover:bg-brass'
                                : isComplete
                                ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'border border-ink/15 bg-white text-ink/70 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-700'
                            }`}
                          >
                            {getActionLabel(next)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}