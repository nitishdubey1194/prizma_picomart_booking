'use client';

import { useParams } from 'next/navigation';
import {
  Clock,
  Calendar,
  AlertCircle,
  UserX,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
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
      <div className="mx-auto max-w-4xl space-y-4 px-3 py-6 sm:px-6">
        <div className="h-32 w-full animate-pulse rounded-3xl bg-stone-200/50" />
        <div className="h-96 w-full animate-pulse rounded-3xl bg-stone-200/50" />
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Error Recovery State                                                       */
  /* -------------------------------------------------------------------------- */
  if (isError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl border border-rose-300/80 bg-rose-50/70 p-8 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 ring-1 ring-rose-200">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-bold text-rose-950">
            Operational Synchronization Error
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-rose-800/80">
            We could not verify your provider credentials against the studio directory.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Unauthorized / Unlinked Provider State                                     */
  /* -------------------------------------------------------------------------- */
  if (!user || user.providerId === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-3xl border border-stone-300/70 bg-[#FAF8F5] p-8 shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/20">
            <UserX className="h-6 w-6" />
          </div>
          <span className="mt-4 inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Unassigned Chair
          </span>
          <h2 className="mt-1 text-base font-bold text-stone-900">
            No Associated Seat
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            Your account is not mapped to an active practitioner station for{' '}
            <span className="font-semibold text-stone-700">{subdomain}</span>. Contact your studio
            administrator to configure your station.
          </p>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-white/70 p-3.5 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-stone-500">
              <span>Account Identity</span>
              <span className="font-medium text-stone-800">{user?.email ?? 'Unknown User'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-stone-200/60 pt-2 text-stone-500">
              <span>Station Linkage</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Unassigned Chair
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
    <div className="mx-auto max-w-7xl space-y-4">
      {/* 1. Header Card with Live Status & Chair Meta */}
      <header className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                Chair #{user.providerId}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Synchronization
              </span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Working Availability
            </h1>
            <p className="mt-0.5 max-w-xl text-xs text-stone-500">
              Configure your weekly schedule, operating hours, and break periods. Changes apply immediately
              to your live booking storefront.
            </p>
          </div>

          {/* Quick Parameters Capsule */}
          <div className="flex items-center rounded-2xl border border-stone-200 bg-white/70 p-1 shadow-2xs self-start sm:self-auto text-xs">
            <div className="px-3.5 py-1 text-center">
              <span className="block text-[9px] uppercase font-bold text-stone-400">Notice Buffer</span>
              <span className="text-xs font-bold text-stone-900 leading-tight">24 Hours</span>
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div className="px-3.5 py-1 text-center">
              <span className="block text-[9px] uppercase font-bold text-stone-400">Timezone</span>
              <span className="text-xs font-bold text-stone-700 leading-tight">Asia/Kolkata</span>
            </div>
          </div>
        </div>

        {/* Status Chips Strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200/70 pt-3 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/70 px-2.5 py-1 shadow-2xs">
            <Clock className="h-3 w-3 text-stone-400" />
            <span>Direct Calendar Sync</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/70 px-2.5 py-1 shadow-2xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Active Station #{user.providerId}</span>
          </span>
        </div>
      </header>

      {/* 2. Embedded Availability Table & Timeslot Matrix Card */}
      <section className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-1 border-b border-stone-200/70 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Weekly Routine & Active Hours
            </h2>
            <p className="text-xs text-stone-500">
              Turn operating days on/off and designate start and end times for your chair.
            </p>
          </div>
          <span className="self-start rounded-md bg-stone-200/60 px-2 py-0.5 text-[10px] font-semibold text-stone-600 sm:self-center">
            IST (UTC+5:30)
          </span>
        </div>

        <ProviderAvailability tenantSlug={subdomain} providerId={user.providerId} />
      </section>

      {/* 3. Operational Conflict Safeguard Notice */}
      <aside className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-100/50 p-4 text-xs text-stone-600 shadow-2xs">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
        <div className="space-y-0.5">
          <h3 className="font-semibold text-stone-900">Existing Appointments Notice</h3>
          <p className="leading-relaxed text-stone-500">
            Adjusting recurring hours only restricts future bookings. Any existing client reservations that
            fall within newly closed intervals remain intact unless cancelled or rescheduled directly from
            your appointments queue.
          </p>
        </div>
      </aside>
    </div>
  );
}