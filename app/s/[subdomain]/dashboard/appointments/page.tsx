'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAppointments, useUpdateAppointmentStatus, useCurrentUser } from '@/lib/queries';
import type { AppointmentWithDetails } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-brass',
  confirmed: 'text-moss',
  completed: 'text-ink/50',
  cancelled: 'text-red-700',
};

function allowedNextStatuses(status: AppointmentWithDetails['status']) {
  if (status === 'pending') return ['confirmed', 'cancelled'] as const;
  if (status === 'confirmed') return ['completed', 'cancelled'] as const;
  return [] as const;
}

export default function AppointmentsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: user } = useCurrentUser(subdomain);
  const { data: appointments = [], isLoading, error } = useAppointments(subdomain);
  const updateStatus = useUpdateAppointmentStatus(subdomain);
  const [actionError, setActionError] = useState<string | null>(null);

  const isVendor = user?.roles.includes('vendor') ?? false;

  if (!isVendor) {
    return <p className="text-ink/60">You don&apos;t have access to this page.</p>;
  }

  if (isLoading) return <p className="text-ink/60">Loading appointments…</p>;
  if (error) return <p className="text-red-700">Couldn&apos;t load appointments.</p>;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">All appointments</h1>
      {appointments.length === 0 && <p className="text-ink/60">No appointments yet.</p>}
      <ul>
        {appointments.map((a) => (
          <li key={a.id} className="ledger-row flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-medium">
                {a.serviceName} — {a.providerName}
              </p>
              <p className="text-sm text-ink/60">
                {new Date(a.startTime).toLocaleString('en-IN')} · {a.customerEmail}
              </p>
              {a.customerNotes && <p className="mt-1 text-sm text-ink/50">&ldquo;{a.customerNotes}&rdquo;</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</span>
              {allowedNextStatuses(a.status).map((next) => (
                <button
                  key={next}
                  onClick={() => {
                    setActionError(null);
                    updateStatus.mutate(
                      { id: a.id, status: next },
                      { onError: (err) => setActionError(err instanceof Error ? err.message : 'Failed to update.') }
                    );
                  }}
                  disabled={updateStatus.isPending}
                  className="border border-ink/20 px-3 py-1.5 text-sm capitalize transition-colors hover:border-ink/50 disabled:opacity-50"
                >
                  {next}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {actionError && <p className="mt-4 text-sm text-red-700">{actionError}</p>}
    </div>
  );
}