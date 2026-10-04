'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Clock,
  Mail,
  Phone,
  Check,
  X,
  AlertCircle,
  UserX,
  Loader2,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAppointments, useUpdateAppointmentStatus, useCurrentUser } from '@/lib/queries';
import type { AppointmentWithDetails } from '@/lib/api';

type AppointmentStatus = AppointmentWithDetails['status'];
type ActionableStatus = Extract<AppointmentStatus, 'confirmed' | 'cancelled' | 'completed'>;
type FilterView = 'requests' | 'today' | 'upcoming' | 'all';

// Clear, unambiguous status display settings
const STATUS_META: Record<
  AppointmentStatus,
  {
    badgeLabel: string;
    badgeStyle: string;
    cardBorder: string;
    cardBg: string;
  }
> = {
  pending: {
    badgeLabel: 'New Request',
    badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400/30',
    cardBorder: 'border-amber-300/80 ring-2 ring-amber-400/20',
    cardBg: 'bg-amber-50/40',
  },
  confirmed: {
    badgeLabel: 'Scheduled',
    badgeStyle: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 ring-1 ring-emerald-500/20',
    cardBorder: 'border-stone-200/90',
    cardBg: 'bg-[#FAF8F5]',
  },
  completed: {
    badgeLabel: 'Done',
    badgeStyle: 'bg-stone-200/70 text-stone-600 border-stone-300',
    cardBorder: 'border-stone-200/60',
    cardBg: 'bg-stone-100/40 opacity-75',
  },
  cancelled: {
    badgeLabel: 'Cancelled',
    badgeStyle: 'bg-rose-100 text-rose-800 border-rose-200',
    cardBorder: 'border-stone-200/50',
    cardBg: 'bg-stone-100/30 opacity-60',
  },
};

export default function MyBookingsDashboardPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
  const { data: appointments = [], isLoading: loadingAppointments, error } = useAppointments(subdomain);
  const updateStatus = useUpdateAppointmentStatus(subdomain);

  const [filter, setFilter] = useState<FilterView>('requests');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  // Filter bookings strictly to this practitioner
  const myBookings = useMemo(() => {
    if (!user || user.providerId === null) return [];
    return appointments.filter((apt) => apt.providerId === user.providerId);
  }, [appointments, user]);

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toDateString(), [now]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let todayCount = 0;
    let pendingCount = 0;
    let confirmedCount = 0;

    for (const apt of myBookings) {
      if (new Date(apt.startTime).toDateString() === todayStr && apt.status !== 'cancelled') {
        todayCount++;
      }
      if (apt.status === 'pending') pendingCount++;
      if (apt.status === 'confirmed') confirmedCount++;
    }

    return { todayCount, pendingCount, confirmedCount };
  }, [myBookings, todayStr]);

  // Tab Filtering Logic
  const filteredBookings = useMemo(() => {
    return myBookings.filter((apt) => {
      const isPast = new Date(apt.startTime).getTime() < now.getTime();
      const isToday = new Date(apt.startTime).toDateString() === todayStr;

      switch (filter) {
        case 'requests':
          // Prioritize actions: Pending first, or all active if none pending
          return apt.status === 'pending';
        case 'today':
          return isToday && apt.status !== 'cancelled';
        case 'upcoming':
          return apt.status === 'confirmed' && !isPast;
        case 'all':
        default:
          return true;
      }
    });
  }, [myBookings, filter, now, todayStr]);

  function handleStatusChange(id: number, nextStatus: ActionableStatus) {
    setActionError(null);
    setActiveActionId(id);

    updateStatus.mutate(
      { id, status: nextStatus },
      {
        onSuccess: () => {
          setCancellingId(null);
          setActiveActionId(null);
        },
        onError: (err) => {
          setActionError(err instanceof Error ? err.message : 'Action failed');
          setCancellingId(null);
          setActiveActionId(null);
        },
      }
    );
  }

  /* ------------------------------------------------------------- */
  /* Skeleton Loading State                                        */
  /* ------------------------------------------------------------- */
  if (loadingUser || loadingAppointments) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-4 py-8">
        <div className="h-28 w-full animate-pulse rounded-2xl bg-stone-200/50" />
        <div className="h-36 w-full animate-pulse rounded-2xl bg-stone-200/50" />
        <div className="h-36 w-full animate-pulse rounded-2xl bg-stone-200/50" />
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* Unlinked Provider State                                       */
  /* ------------------------------------------------------------- */
  if (!user || user.providerId === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-3xl border border-stone-300/70 bg-[#FAF8F5] p-8 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-200/80 text-stone-600">
            <UserX className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-bold text-stone-900">No Chair Assigned</h2>
          <p className="mt-1 text-xs text-stone-500">
            This account is not associated with an active station. Please ask an administrator to assign your chair.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* Error State                                                   */
  /* ------------------------------------------------------------- */
  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <p className="text-xs font-semibold">Failed to sync schedule. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Top Header Card */}
      <header className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="font-semibold text-stone-900">Chair #{user.providerId}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Schedule
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Appointments
            </h1>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="flex items-center rounded-2xl border border-stone-200 bg-white/70 px-3 py-1.5 shadow-2xs">
            <div className="text-center pr-3 border-r border-stone-200">
              <span className="block text-[9px] uppercase font-bold text-stone-400">Today</span>
              <span className="text-sm font-bold text-stone-900 leading-none">{metrics.todayCount}</span>
            </div>
            <div className="text-center pl-3">
              <span className="block text-[9px] uppercase font-bold text-amber-700">Requests</span>
              <span className="text-sm font-bold text-amber-700 leading-none">{metrics.pendingCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <nav className="mt-5 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-stone-200/70 pt-3">
          {[
            { id: 'requests', label: 'New Requests', count: metrics.pendingCount, alert: true },
            { id: 'today', label: 'Today', count: metrics.todayCount },
            { id: 'upcoming', label: 'Upcoming', count: metrics.confirmedCount },
            { id: 'all', label: `All (${myBookings.length})` },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as FilterView)}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      tab.alert && !isActive
                        ? 'bg-amber-500 text-white'
                        : isActive
                        ? 'bg-stone-700 text-stone-100'
                        : 'bg-stone-200 text-stone-800'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Action Error Notice */}
      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="font-bold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-[#FAF8F5]/60 py-14 px-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200/60 text-stone-500">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-stone-800">
            {filter === 'requests' ? 'No pending requests' : 'No appointments found'}
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            {filter === 'requests'
              ? 'All new requests have been accepted or settled.'
              : 'Try selecting a different filter above.'}
          </p>
        </div>
      ) : (
        /* Appointment Cards */
        <div className="space-y-3">
          {filteredBookings.map((apt) => {
            const startDate = new Date(apt.startTime);
            const meta = STATUS_META[apt.status] ?? STATUS_META.pending;
            const isConfirmingCancel = cancellingId === apt.id;
            const isRowMutating = activeActionId === apt.id && updateStatus.isPending;

            return (
              <div
                key={apt.id}
                className={`relative rounded-3xl border p-4 sm:p-5 shadow-2xs transition-all ${meta.cardBorder} ${meta.cardBg}`}
              >
                {/* Header: Service Name & Clear Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-stone-900 sm:text-lg">
                      {apt.serviceName}
                    </h2>

                    {/* Date & Time Capsule */}
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium text-stone-600">
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-200/70 px-2 py-0.5 font-bold text-stone-800">
                        <Clock className="h-3 w-3 text-stone-500" />
                        {startDate.toLocaleTimeString('en-IN', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {startDate.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* High-visibility Status Badge */}
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${meta.badgeStyle}`}
                  >
                    {meta.badgeLabel}
                  </span>
                </div>

                {/* Customer Contact Chips */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60">
                  {apt.customerMobile && (
                    <a
                      href={`tel:${apt.customerMobile}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-800 hover:border-stone-300 hover:bg-white transition-all shadow-2xs"
                    >
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <span>{apt.customerMobile}</span>
                    </a>
                  )}

                  {apt.customerEmail && (
                    <a
                      href={`mailto:${apt.customerEmail}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-white transition-all shadow-2xs"
                    >
                      <Mail className="h-3 w-3 text-stone-500" />
                      <span className="truncate max-w-[170px]">{apt.customerEmail}</span>
                    </a>
                  )}
                </div>

                {/* Optional Customer Note */}
                {apt.customerNotes && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-stone-200/50 p-2.5 text-xs text-stone-700">
                    <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500" />
                    <span className="italic leading-relaxed">&ldquo;{apt.customerNotes}&rdquo;</span>
                  </div>
                )}

                {/* ACTION ZONE: Clear, Unmistakable Buttons */}
                <div className="mt-4 pt-3 border-t border-stone-200/70">
                  {isConfirmingCancel ? (
                    /* Inline Cancellation Safeguard */
                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-rose-900 font-semibold">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>Cancel this appointment?</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'cancelled')}
                          disabled={isRowMutating}
                          className="rounded-xl bg-rose-700 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-800 disabled:opacity-50"
                        >
                          {isRowMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Yes, Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancellingId(null)}
                          disabled={isRowMutating}
                          className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          Keep
                        </button>
                      </div>
                    </div>
                  ) : apt.status === 'pending' ? (
                    /* STATE 1: PENDING -> ACCEPT / DECLINE */
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(apt.id, 'confirmed')}
                        disabled={isRowMutating}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isRowMutating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 stroke-[3]" />
                        )}
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingId(apt.id)}
                        disabled={isRowMutating}
                        className="inline-flex items-center justify-center rounded-2xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-bold text-stone-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 active:scale-[0.98] transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  ) : apt.status === 'confirmed' ? (
                    /* STATE 2: CONFIRMED -> COMPLETE / CANCEL */
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(apt.id, 'completed')}
                        disabled={isRowMutating}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isRowMutating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>Mark as Completed</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancellingId(apt.id)}
                        disabled={isRowMutating}
                        className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white/70 px-3.5 py-2.5 text-xs font-semibold text-stone-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 active:scale-[0.98] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}