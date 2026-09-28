'use client';

import { useState, useTransition } from 'react';
import { Provider, UserSearchResult } from '@/lib/api';
import { useUserSearch, useLinkProvider } from '@/lib/queries';

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  provider: Provider;
  onRefresh: () => Promise<void> | void;
}

export default function LinkAccountModal({
  isOpen,
  onClose,
  tenantSlug,
  provider,
  onRefresh,
}: LinkAccountModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: searchResults = [], isFetching } = useUserSearch(tenantSlug, searchTerm);
  const linkProvider = useLinkProvider(tenantSlug);

  if (!isOpen) return null;

  const currentEmail = provider.userLinkEmail || (provider.userId?.includes('@') ? provider.userId : null);

  const handleLinkUser = (user: UserSearchResult) => {
  setErrorMessage(null);
  startTransition(async () => {
    try {
      await linkProvider.mutateAsync({
        providerId: provider.id,
        userId: user.id,
      });

      // Optimistically update the current provider reference with userLinkEmail
      provider.userId = user.id;
      provider.userLinkEmail = user.email;

      await onRefresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to link user account.');
      }
    }
  });
};

  const handleUnlinkUser = () => {
  setErrorMessage(null);
  startTransition(async () => {
    try {
      await linkProvider.mutateAsync({
        providerId: provider.id,
        userId: null,
      });

      // Clear both references locally
      provider.userId = null;
      provider.userLinkEmail = null;

      await onRefresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to unlink user account.');
      }
    }
  });
};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Link User Account
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Connect a login account to{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {provider.name}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Current Linked Status Card */}
        <div className="px-6 pt-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Currently Associated Account
            </span>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              {provider.userId ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {currentEmail ?? `User ID: ${provider.userId}`}
                    </p>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Active connection
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No account currently connected to this staff profile.</p>
              )}

              {provider.userId && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleUnlinkUser}
                  className="rounded-md border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40 disabled:opacity-50"
                >
                  {isPending ? 'Removing…' : 'Unlink Account'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="px-6 pt-4">
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Search Directory
            <div className="relative mt-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by email or name…"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {isFetching && (
                <span className="absolute right-3 top-2.5 text-xs text-zinc-400 animate-pulse">
                  Searching…
                </span>
              )}
            </div>
          </label>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {searchTerm.length < 2 ? (
            <p className="py-6 text-center text-xs text-zinc-400">
              Type at least 2 characters to search accounts in this tenant.
            </p>
          ) : searchResults.length === 0 && !isFetching ? (
            <p className="py-6 text-center text-xs text-zinc-400">
              No registered user accounts match &quot;{searchTerm}&quot;.
            </p>
          ) : (
            <div className="space-y-2.5">
              {searchResults.map((user) => {
                const isSelected = provider.userId === user.id;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between rounded-lg border p-3.5 transition-colors ${
                      isSelected
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                        : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {user.fullName || user.email}
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Connected
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{user.email}</span>
                        {user.role && (
                          <>
                            <span>·</span>
                            <span className="uppercase text-[10px] tracking-wider">{user.role}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPending || isSelected}
                      onClick={() => handleLinkUser(user)}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'border border-emerald-300 bg-white text-emerald-700 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                      } disabled:opacity-50`}
                    >
                      {isPending ? 'Updating…' : isSelected ? 'Linked' : 'Link Account'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">
            {provider.userId ? '1 account linked' : 'No account linked'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}