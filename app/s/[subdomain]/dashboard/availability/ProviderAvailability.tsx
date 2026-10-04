'use client';

import { useState } from 'react';
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CalendarOff,
  AlertCircle,
  Loader2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import {
  WEEKDAY_NAMES,
  useAvailabilityBlocks,
  useCreateAvailabilityBlock,
  useDeleteAvailabilityBlock,
  useExceptions,
  useCreateException,
  useDeleteException,
} from '@/lib/queries';

export function ProviderAvailability({
  tenantSlug,
  providerId,
}: {
  tenantSlug: string;
  providerId: number;
}) {
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

  // Group recurring blocks by weekday order
  const sortedBlocks = [...blocks].sort((a, b) => a.weekday - b.weekday);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: WEEKLY RECURRING SHIFTS                            */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white/70 p-4 shadow-2xs sm:p-5">
        <div>
          {/* Section Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Weekly Operating Routine</h3>
              <p className="text-[11px] text-stone-500">Regular hours when clients can book your chair.</p>
            </div>
          </div>

          {/* Blocks List */}
          <div className="mt-3.5 space-y-2">
            {sortedBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-8 text-center">
                <CalendarDays className="h-6 w-6 text-stone-400" />
                <p className="mt-2 text-xs font-semibold text-stone-700">No active hours defined</p>
                <p className="text-[11px] text-stone-400">Add recurring intervals using the form below.</p>
              </div>
            ) : (
              sortedBlocks.map((b) => (
                <div
                  key={b.id}
                  className="group flex items-center justify-between rounded-xl border border-stone-200/70 bg-[#FAF8F5] px-3.5 py-2.5 transition hover:border-stone-300"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block w-20 text-xs font-bold text-stone-900">
                      {WEEKDAY_NAMES[b.weekday]}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-200/70 px-2 py-0.5 font-mono text-xs font-semibold text-stone-800">
                      {b.startTime} – {b.endTime}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteBlock.mutate(b.id)}
                    disabled={deleteBlock.isPending}
                    className="inline-flex items-center gap-1 rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                    title="Remove hours"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Block Form */}
        <div className="mt-5 border-t border-stone-200/70 pt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setBlockError(null);
              createBlock.mutate(
                { weekday, startTime, endTime },
                {
                  onError: (err) =>
                    setBlockError(err instanceof Error ? err.message : 'Could not add working block.'),
                }
              );
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* Day selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Day
                </label>
                <select
                  value={weekday}
                  onChange={(e) => setWeekday(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                >
                  {WEEKDAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  From
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  To
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={createBlock.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 active:scale-[0.98] transition disabled:opacity-50"
              >
                {createBlock.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Add Working Hours</span>
              </button>
            </div>

            {blockError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{blockError}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: SPECIAL DATE EXCEPTIONS & CLOSURES                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white/70 p-4 shadow-2xs sm:p-5">
        <div>
          {/* Section Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200/60">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-800">
              <CalendarOff className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Date Overrides & Holidays</h3>
              <p className="text-[11px] text-stone-500">Block specific calendar dates or take personal leave.</p>
            </div>
          </div>

          {/* Exceptions List */}
          <div className="mt-3.5 space-y-2">
            {exceptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-8 text-center">
                <Calendar className="h-6 w-6 text-stone-400" />
                <p className="mt-2 text-xs font-semibold text-stone-700">No date closures scheduled</p>
                <p className="text-[11px] text-stone-400">Add planned vacations or closures below.</p>
              </div>
            ) : (
              exceptions.map((e) => (
                <div
                  key={e.id}
                  className="group flex items-center justify-between rounded-xl border border-stone-200/70 bg-[#FAF8F5] px-3.5 py-2.5 transition hover:border-stone-300"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {e.exceptionDate}
                      </span>
                      <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        Closed
                      </span>
                    </div>
                    {e.reason && (
                      <p className="text-[11px] italic text-stone-500 line-clamp-1">
                        &ldquo;{e.reason}&rdquo;
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteException.mutate(e.id)}
                    disabled={deleteException.isPending}
                    className="inline-flex items-center gap-1 rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                    title="Remove closure"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Exception Form */}
        <div className="mt-5 border-t border-stone-200/70 pt-4">
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              setExceptionError(null);
              createException.mutate(
                { exceptionDate, isAvailable: false, reason: reason || undefined },
                {
                  onSuccess: () => {
                    setExceptionDate('');
                    setReason('');
                  },
                  onError: (err) =>
                    setExceptionError(err instanceof Error ? err.message : 'Could not add date closure.'),
                }
              );
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Date Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Select Date
                </label>
                <input
                  type="date"
                  required
                  value={exceptionDate}
                  onChange={(e) => setExceptionDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden"
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Reason <span className="font-normal text-stone-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Vacation, Renovation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 shadow-2xs placeholder:text-stone-400 focus:border-stone-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={createException.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-50 active:scale-[0.98] transition disabled:opacity-50"
              >
                {createException.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Block Date Off</span>
              </button>
            </div>

            {exceptionError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{exceptionError}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}