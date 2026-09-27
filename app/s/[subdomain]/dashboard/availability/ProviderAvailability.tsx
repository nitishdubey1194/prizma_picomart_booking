'use client';

import { useState } from 'react';
import {
  WEEKDAY_NAMES,
  useAvailabilityBlocks, useCreateAvailabilityBlock, useDeleteAvailabilityBlock,
  useExceptions, useCreateException, useDeleteException,
} from '@/lib/queries';

export function ProviderAvailability({ tenantSlug, providerId }: { tenantSlug: string; providerId: number }) {
  const { data: blocks = [] } = useAvailabilityBlocks(tenantSlug, providerId);
  const createBlock = useCreateAvailabilityBlock(tenantSlug, providerId);
  const deleteBlock = useDeleteAvailabilityBlock(tenantSlug, providerId);

  const { data: exceptions = [] } = useExceptions(tenantSlug, providerId);
  const createException = useCreateException(tenantSlug, providerId);
  const deleteException = useDeleteException(tenantSlug, providerId);

  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [blockError, setBlockError] = useState<string | null>(null);

  const [exceptionDate, setExceptionDate] = useState('');
  const [reason, setReason] = useState('');
  const [exceptionError, setExceptionError] = useState<string | null>(null);

  return (
    <div className="mt-8 grid gap-10 sm:grid-cols-2">
      <section>
        <h2 className="mb-4 font-display text-xl">Weekly hours</h2>
        <ul className="mb-4">
          {blocks.map((b) => (
            <li key={b.id} className="ledger-row flex items-center justify-between py-3">
              <span>
                {WEEKDAY_NAMES[b.weekday]} · {b.startTime}–{b.endTime}
              </span>
              <button onClick={() => deleteBlock.mutate(b.id)} className="text-sm text-red-700 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setBlockError(null);
            createBlock.mutate(
              { weekday, startTime, endTime },
              { onError: (err) => setBlockError(err instanceof Error ? err.message : 'Failed to add block.') }
            );
          }}
          className="flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4"
        >
          <label className="text-sm">
            Day
            <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="mt-1 block border border-ink/20 px-3 py-2">
              {WEEKDAY_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            From
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
          </label>
          <label className="text-sm">
            To
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
          </label>
          <button type="submit" className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-white hover:bg-ink">
            Add
          </button>
        </form>
        {blockError && <p className="mt-2 text-sm text-red-700">{blockError}</p>}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl">Exceptions (days off)</h2>
        <ul className="mb-4">
          {exceptions.map((e) => (
            <li key={e.id} className="ledger-row flex items-center justify-between py-3">
              <span>
                {e.exceptionDate} · {e.isAvailable ? 'Available' : 'Closed'} {e.reason && `— ${e.reason}`}
              </span>
              <button onClick={() => deleteException.mutate(e.id)} className="text-sm text-red-700 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            setExceptionError(null);
            createException.mutate(
              { exceptionDate, isAvailable: false, reason: reason || undefined },
              { onError: (err) => setExceptionError(err instanceof Error ? err.message : 'Failed to add exception.') }
            );
          }}
          className="flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4"
        >
          <label className="text-sm">
            Date
            <input type="date" required value={exceptionDate} onChange={(e) => setExceptionDate(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
          </label>
          <label className="text-sm">
            Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 block border border-ink/20 px-3 py-2" />
          </label>
          <button type="submit" className="rounded-sm bg-brass px-4 py-2 text-sm font-medium text-white hover:bg-ink">
            Mark closed
          </button>
        </form>
        {exceptionError && <p className="mt-2 text-sm text-red-700">{exceptionError}</p>}
      </section>
    </div>
  );
}