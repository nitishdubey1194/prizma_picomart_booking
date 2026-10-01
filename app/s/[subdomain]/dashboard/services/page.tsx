'use client';

import { useParams } from 'next/navigation';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import {
  useServices,
  useCreateService,
  useDeleteService,
} from '@/lib/queries';
import type { Service, ServicesResponse } from '@/lib/api';

interface ServiceTemplate {
  name: string;
  slug: string;
  defaultPrice: number;
  defaultDuration: number;
  defaultDescription: string;
}

interface ServiceCategoryGroup {
  category: string;
  templates: readonly ServiceTemplate[];
}

const PREDEFINED_SERVICES: readonly ServiceCategoryGroup[] = [
  {
    category: 'Barber Shop',
    templates: [
      {
        name: 'Standard Haircut & Fade',
        slug: 'standard-haircut-fade',
        defaultPrice: 30,
        defaultDuration: 30,
        defaultDescription: 'Precision cut, fade, neck trim, and styling.',
      },
      {
        name: 'Beard Trim & Shape-Up',
        slug: 'beard-trim-shape-up',
        defaultPrice: 20,
        defaultDuration: 20,
        defaultDescription: 'Beard shaping, line work, and hot towel finish.',
      },
      {
        name: 'Full Haircut + Beard Combo',
        slug: 'haircut-beard-combo',
        defaultPrice: 45,
        defaultDuration: 45,
        defaultDescription: 'Complete grooming package with hair styling and beard treatment.',
      },
      {
        name: 'Hot Towel Head Shave',
        slug: 'hot-towel-head-shave',
        defaultPrice: 25,
        defaultDuration: 30,
        defaultDescription: 'Classic straight razor head shave with essential oil massage.',
      },
    ],
  },
  {
    category: 'Car Wash',
    templates: [
      {
        name: 'Express Exterior Wash',
        slug: 'express-exterior-wash',
        defaultPrice: 15,
        defaultDuration: 15,
        defaultDescription: 'High-pressure rinse, foam cannon soap, wheel wash, and air dry.',
      },
      {
        name: 'Full Interior & Exterior Detail',
        slug: 'interior-exterior-detail',
        defaultPrice: 50,
        defaultDuration: 45,
        defaultDescription: 'Hand wash, rim degrease, interior vacuum, and dash wipe-down.',
      },
      {
        name: 'Ceramic Seal & Wax Finish',
        slug: 'ceramic-seal-wax',
        defaultPrice: 80,
        defaultDuration: 60,
        defaultDescription: 'Deep paint decontamination and protective high-gloss synthetic wax.',
      },
      {
        name: 'Engine Bay Detailing',
        slug: 'engine-bay-detail',
        defaultPrice: 40,
        defaultDuration: 30,
        defaultDescription: 'Degrease, steam clean, and protective non-stick coating application.',
      },
    ],
  },
] as const;

export default function ServicesDashboardPage() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params?.subdomain ?? '';

  // Queries
  const { data: rawServices, isLoading } = useServices(subdomain);
  const createService = useCreateService(subdomain);
  const deleteService = useDeleteService(subdomain);

  // Initial template selection
  const defaultTemplate = PREDEFINED_SERVICES[0].templates[0];

  const [selectedSlug, setSelectedSlug] = useState<string>(defaultTemplate.slug);
  const [selectedName, setSelectedName] = useState<string>(defaultTemplate.name);
  const [durationMinutes, setDurationMinutes] = useState<number>(defaultTemplate.defaultDuration);
  const [price, setPrice] = useState<number>(defaultTemplate.defaultPrice);
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);
  const [description, setDescription] = useState<string>(defaultTemplate.defaultDescription);
  const [error, setError] = useState<string | null>(null);

  // Strict type normalizer
  const services: Service[] = (() => {
    if (!rawServices) return [];
    if (Array.isArray(rawServices)) return rawServices;
    if (
      typeof rawServices === 'object' &&
      'services' in rawServices &&
      Array.isArray((rawServices as ServicesResponse).services)
    ) {
      return (rawServices as ServicesResponse).services;
    }
    return [];
  })();

  // Handle template selection change
  function handleTemplateChange(e: ChangeEvent<HTMLSelectElement>): void {
    const slugValue = e.target.value;
    setSelectedSlug(slugValue);

    for (const group of PREDEFINED_SERVICES) {
      const match = group.templates.find((t) => t.slug === slugValue);
      if (match) {
        setSelectedName(match.name);
        setPrice(match.defaultPrice);
        setDurationMinutes(match.defaultDuration);
        setDescription(match.defaultDescription);
        break;
      }
    }
  }

  function handleCreate(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);

    createService.mutate(
      {
        name: selectedName,
        slug: selectedSlug,
        durationMinutes,
        price,
      },
      {
        onSuccess: () => {
          setSelectedSlug(defaultTemplate.slug);
          setSelectedName(defaultTemplate.name);
          setPrice(defaultTemplate.defaultPrice);
          setDurationMinutes(defaultTemplate.defaultDuration);
          setBufferMinutes(0);
          setDescription(defaultTemplate.defaultDescription);
        },
        onError: (err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to create service.');
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-sm tracking-wide text-ink/60 animate-pulse">Loading service catalog…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-col gap-1 border-b border-ink/10 pb-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Services & Treatments</h1>
        <p className="text-sm text-ink/60">
          Select standard service offerings to make them bookable in your store.
        </p>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="mb-8 rounded-lg border border-dashed border-ink/20 p-8 text-center">
          <p className="text-sm text-ink/60">No services created yet.</p>
        </div>
      ) : (
        <ul className="mb-8 divide-y divide-ink/10">
          {services.map((s: Service) => (
            <li key={s.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="text-xs font-semibold text-ink/80">
                    ${Number(s.price).toFixed(2)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-ink/50">
                  <span>Duration: {s.durationMinutes}m</span>
                  <span>·</span>
                  <span>Slug: /{s.slug}</span>
                </div>
                {s.description && (
                  <p className="mt-1 text-xs text-ink/60 line-clamp-1">{s.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => deleteService.mutate(s.id)}
                disabled={deleteService.isPending}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Simplified Dropdown Creation Form */}
      <div className="rounded-lg border border-ink/10 bg-white/50 p-6 shadow-sm dark:bg-zinc-900/50">
        <h2 className="mb-4 text-base font-semibold text-ink">Add New Service</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          
          {/* Service Dropdown & Auto-Resolved Slug Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Select Service Package
              </label>
              <div className="relative mt-1.5">
                <select
                  value={selectedSlug}
                  onChange={handleTemplateChange}
                  className="block w-full appearance-none rounded border border-ink/20 bg-white px-3 py-2 text-sm font-medium text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800 cursor-pointer"
                >
                  {PREDEFINED_SERVICES.map((group) => (
                    <optgroup key={group.category} label={`── ${group.category} ──`}>
                      {group.templates.map((tmpl) => (
                        <option key={tmpl.slug} value={tmpl.slug}>
                          {tmpl.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-ink/40">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Read-only URL Slug */}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Generated URL Slug
              </label>
              <input
                disabled
                value={selectedSlug}
                className="mt-1.5 block w-full rounded border border-ink/10 bg-ink/5 px-3 py-2 text-sm font-mono text-ink/60 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Pricing, Duration, and Buffer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Base Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPrice(Number(e.target.value))}
                className="mt-1.5 block w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                required
                value={durationMinutes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDurationMinutes(Number(e.target.value))}
                className="mt-1.5 block w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
                Buffer After (Minutes)
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={bufferMinutes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBufferMinutes(Number(e.target.value))}
                className="mt-1.5 block w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-ink/70">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="mt-1.5 block w-full rounded border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass dark:bg-zinc-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createService.isPending}
              className="h-[38px] rounded bg-brass px-6 text-sm font-medium text-white transition-colors hover:bg-ink disabled:opacity-50"
            >
              {createService.isPending ? 'Adding…' : 'Add Service'}
            </button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}