'use client';

import { useState, useTransition, useMemo, type FormEvent, type ChangeEvent } from 'react';
import {
  type Provider,
  type Service,
  linkProviderToService,
  unlinkProviderToService,
  createServiceWithAutoAssign,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { IndianRupee, Plus, X, Loader2, Clock } from 'lucide-react';

export interface AssignedServiceItem {
  id?: number | string;
  serviceId?: number | string;
  name?: string;
  serviceName?: string;
  durationMinutes?: number;
  customDurationMinutes?: number | null;
  price?: number | string;
  customPrice?: number | string | null;
}

interface ProviderServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  provider: Provider;
  allServices: Service[];
  assignedServices: AssignedServiceItem[];
  onRefresh: () => Promise<void> | void;
}

interface ServiceCustomOverride {
  customDurationMinutes?: number;
  customPrice?: string;
}

interface NewServiceState {
  name: string;
  slug: string;
  price: number;
  durationMinutes: number;
  description: string;
}

export default function ProviderServicesModal({
  isOpen,
  onClose,
  tenantSlug,
  provider,
  allServices,
  assignedServices,
  onRefresh,
}: ProviderServicesModalProps) {
  const [isPending, startTransition] = useTransition();
  const [activeServiceId, setActiveServiceId] = useState<number | string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, ServiceCustomOverride>>({});

  // Inline "Create & Auto-Assign" states
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState<boolean>(false);
  const [newService, setNewService] = useState<NewServiceState>({
    name: '',
    slug: '',
    price: 350,
    durationMinutes: 30,
    description: '',
  });

  if (!isOpen) return null;

  // Accurately extract service IDs whether the API returned 'serviceId' or 'id'
  const assignedServiceIdSet = new Set<string>(
    assignedServices
      .map((item) => {
        const idVal = item.serviceId ?? item.id;
        return idVal !== undefined && idVal !== null ? String(idVal) : null;
      })
      .filter((id): id is string => id !== null)
  );

  const handleToggleService = (service: Service) => {
    const serviceIdStr = String(service.id);
    const isAssigned = assignedServiceIdSet.has(serviceIdStr);
    setErrorMessage(null);
    setActiveServiceId(service.id);

    startTransition(async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }

        if (isAssigned) {
          // Unassign: DELETE /api/providers/[id]/services/[serviceId]
          await unlinkProviderToService(
            tenantSlug,
            token,
            provider.id,
            service.id
          );
        } else {
          // Assign: POST /api/providers/[id]/services
          const override = overrides[serviceIdStr];
          await linkProviderToService(tenantSlug, token, provider.id, {
            serviceId: service.id,
            customDurationMinutes:
              override?.customDurationMinutes ?? service.durationMinutes,
            customPrice: override?.customPrice
              ? String(override.customPrice)
              : String(service.price),
          });
        }
        await onRefresh();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to update service mapping.');
        }
      } finally {
        setActiveServiceId(null);
      }
    });
  };

  const handleOverrideChange = (
    serviceId: number | string,
    field: keyof ServiceCustomOverride,
    value: string
  ) => {
    const key = String(serviceId);
    setOverrides((prev) => {
      const current = prev[key] ?? {};
      if (field === 'customDurationMinutes') {
        const parsed = parseInt(value, 10);
        return {
          ...prev,
          [key]: {
            ...current,
            customDurationMinutes: Number.isNaN(parsed) ? undefined : parsed,
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...current,
          customPrice: value,
        },
      };
    });
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setNewService((prev) => ({
      ...prev,
      name: val,
      slug: generatedSlug,
    }));
  };

  const handleCreateAndAutoAssign = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmittingNew(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      await createServiceWithAutoAssign(tenantSlug, token, {
        name: newService.name,
        slug: newService.slug,
        price: newService.price,
        durationMinutes: newService.durationMinutes,
        description: newService.description.trim() || undefined,
        providerId: provider.id,
      });

      // Reset form & reload
      setNewService({
        name: '',
        slug: '',
        price: 350,
        durationMinutes: 30,
        description: '',
      });
      setIsCreating(false);
      await onRefresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create and auto-assign service.');
      }
    } finally {
      setIsSubmittingNew(false);
    }
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
              Manage Services
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Assign or unassign bookable services for{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {provider.name}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreating((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isCreating ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Service</span>
                </>
              )}
            </button>
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
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Inline Create Service Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateAndAutoAssign}
            className="m-6 mb-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                Create & Auto-Assign to {provider.name}
              </span>
              <span className="text-[11px] text-zinc-400">Directly adds to catalog & provider</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Service Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Deluxe Polish & Detail"
                  value={newService.name}
                  onChange={handleNameChange}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Booking Slug
                </label>
                <input
                  required
                  type="text"
                  value={newService.slug}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewService((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-600 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Price (₹)
                </label>
                <div className="relative mt-1 flex items-center">
                  <IndianRupee className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={newService.price}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewService((prev) => ({ ...prev, price: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Duration (Minutes)
                </label>
                <div className="relative mt-1 flex items-center">
                  <Clock className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={newService.durationMinutes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewService((prev) => ({
                        ...prev,
                        durationMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingNew}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {isSubmittingNew && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save & Auto-Assign</span>
              </button>
            </div>
          </form>
        )}

        {/* Services List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {allServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No services available in this store yet. Click New Service above to start.
            </p>
          ) : (
            <div className="space-y-3">
              {allServices.map((service) => {
                const serviceIdStr = String(service.id);
                const isAssigned = assignedServiceIdSet.has(serviceIdStr);
                const isItemPending = isPending && activeServiceId === service.id;
                const override = overrides[serviceIdStr];

                // Check if currently assigned item has custom parameters
                const assignedItem = assignedServices.find((item) => {
                  const idVal = item.serviceId ?? item.id;
                  return String(idVal) === serviceIdStr;
                });

                const currentPrice = assignedItem?.customPrice ?? service.price;
                const currentDuration =
                  assignedItem?.customDurationMinutes ?? service.durationMinutes;

                return (
                  <div
                    key={service.id}
                    className={`flex flex-col gap-3 rounded-lg border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                      isAssigned
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                        : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40'
                    }`}
                  >
                    {/* Left: Indicator & Details */}
                    <div
                      className="flex cursor-pointer items-start gap-3 select-none"
                      onClick={() => !isItemPending && handleToggleService(service)}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isAssigned
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800'
                        }`}
                      >
                        {isAssigned && (
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {service.name}
                          </span>
                          {isAssigned && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center">
                          <span>{currentDuration} mins</span>
                          <span className="mx-1.5">·</span>
                          <span className="inline-flex items-center">
                            <IndianRupee size={10} className="-mr-0.5" />
                            {Number(currentPrice).toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                            })}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Overrides & Action Button */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 sm:border-0 sm:pt-0 dark:border-zinc-800">
                      {!isAssigned && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            placeholder="Mins"
                            title="Custom duration for this provider"
                            disabled={isItemPending}
                            value={override?.customDurationMinutes ?? ''}
                            onChange={(e) =>
                              handleOverrideChange(
                                service.id,
                                'customDurationMinutes',
                                e.target.value
                              )
                            }
                            className="w-16 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                          <div className="flex items-center">
                            <span className="mr-1 text-xs text-zinc-400">
                              <IndianRupee size={11} />
                            </span>
                            <input
                              type="text"
                              placeholder="Price"
                              title="Custom price for this provider"
                              disabled={isItemPending}
                              value={override?.customPrice ?? ''}
                              onChange={(e) =>
                                handleOverrideChange(
                                  service.id,
                                  'customPrice',
                                  e.target.value
                                )
                              }
                              className="w-20 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isItemPending}
                        onClick={() => handleToggleService(service)}
                        className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          isAssigned
                            ? 'border border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white'
                        } disabled:opacity-50`}
                      >
                        {isItemPending ? 'Updating…' : isAssigned ? 'Unlink' : 'Assign'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">
            {assignedServiceIdSet.size} of {allServices.length} services assigned
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