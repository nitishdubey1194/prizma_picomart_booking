'use client';

import { useState, useTransition } from 'react';
import {
  Provider,
  Service,
  linkProviderToService,
  unlinkProviderToService,
} from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

// Support both direct Service shape and ProviderService join record shape
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

        {/* Services List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {allServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No services available in this store yet.
            </p>
          ) : (
            <div className="space-y-3">
              {allServices.map((service) => {
                const isAssigned = assignedServiceIdSet.has(String(service.id));
                const isItemPending = isPending && activeServiceId === service.id;
                const override = overrides[String(service.id)];

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
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Catalog standard: {service.durationMinutes} mins · ${service.price}
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
                            <span className="mr-1 text-xs text-zinc-400">$</span>
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
                              className="w-18 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
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