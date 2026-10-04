'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Clock,
  ArrowRight,
  Scissors,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import type { ServiceItem } from './page';

interface ProviderServicesCatalogProps {
  services: ServiceItem[];
  providerId: number;
  base: string;
}

type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'duration_asc';

const ITEMS_PER_PAGE = 4;

export function ProviderServicesCatalog({
  services,
  providerId,
  base,
}: ProviderServicesCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Filter & Search
  const filteredServices = useMemo(() => {
    let result = [...services];

    // Search query filter (name & description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    // Duration filter
    if (durationFilter === 'short') {
      result = result.filter((s) => s.effectiveDuration <= 30);
    } else if (durationFilter === 'medium') {
      result = result.filter(
        (s) => s.effectiveDuration > 30 && s.effectiveDuration <= 60
      );
    } else if (durationFilter === 'long') {
      result = result.filter((s) => s.effectiveDuration > 60);
    }

    // Sort order
    if (sortBy === 'price_asc') {
      result.sort((a, b) => Number(a.effectivePrice) - Number(b.effectivePrice));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => Number(b.effectivePrice) - Number(a.effectivePrice));
    } else if (sortBy === 'duration_asc') {
      result.sort((a, b) => a.effectiveDuration - b.effectiveDuration);
    }

    return result;
  }, [services, searchQuery, durationFilter, sortBy]);

  // Reset to page 1 whenever filters change
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginatedServices = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, safePage]);

  function handleSearchChange(val: string) {
    setSearchQuery(val);
    setCurrentPage(1);
  }

  function handleFilterChange(filter: DurationFilter) {
    setDurationFilter(filter);
    setCurrentPage(1);
  }

  function handleSortChange(sort: SortOption) {
    setSortBy(sort);
    setCurrentPage(1);
  }

  function clearAllFilters() {
    setSearchQuery('');
    setDurationFilter('all');
    setSortBy('recommended');
    setCurrentPage(1);
  }

  const isFiltered = Boolean(searchQuery || durationFilter !== 'all' || sortBy !== 'recommended');

  return (
    <section className="space-y-4">
      {/* Catalog Control Bar */}
      <div className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 sm:text-lg">
              Available Treatments & Services
            </h2>
            <p className="text-xs text-stone-500">
              Filter by treatment duration or keyword to book your slot.
            </p>
          </div>

          <span className="text-xs font-semibold text-stone-500 self-start sm:self-auto">
            Showing <strong className="text-stone-900">{filteredServices.length}</strong> of{' '}
            {services.length} services
          </span>
        </div>

        {/* Search & Select Controls */}
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search treatments by name or description..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-8 py-2 text-xs font-medium text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-stone-400 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-800 shadow-2xs focus:border-stone-400 focus:outline-hidden cursor-pointer"
            >
              <option value="recommended">Sort: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="duration_asc">Duration: Shortest</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-stone-200/60 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Duration:
          </span>

          {[
            { id: 'all', label: 'All Durations' },
            { id: 'short', label: '≤ 30 mins' },
            { id: 'medium', label: '31 – 60 mins' },
            { id: 'long', label: '> 60 mins' },
          ].map((pill) => {
            const isActive = durationFilter === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleFilterChange(pill.id as DurationFilter)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition active:scale-[0.98] ${
                  isActive
                    ? 'bg-stone-900 text-[#FAF8F5] shadow-xs'
                    : 'bg-white/80 border border-stone-200/90 text-stone-600 hover:bg-white hover:text-stone-900'
                }`}
              >
                {pill.label}
              </button>
            );
          })}

          {isFiltered && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="ml-auto text-xs font-semibold text-rose-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Services List */}
      {paginatedServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-stone-200 bg-[#FAF8F5]/60 py-14 px-4 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200/60 text-stone-500">
            <Scissors className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-bold text-stone-800">No matching services</p>
          <p className="mt-0.5 text-xs text-stone-400">
            No treatments match your current filter settings. Try clearing the search or filters.
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-800 shadow-2xs hover:bg-stone-50"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedServices.map((svc) => (
            <div
              key={svc.id}
              className="group relative rounded-2xl border border-stone-200/80 bg-[#FAF8F5] p-4 shadow-2xs transition hover:border-stone-300 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">{svc.name}</h3>
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-stone-200/70 px-2 py-0.5 text-xs font-bold text-stone-900">
                      ₹{Number(svc.effectivePrice).toFixed(0)}
                    </span>
                  </div>

                  {svc.description && (
                    <p className="text-xs leading-relaxed text-stone-600 line-clamp-2">
                      {svc.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
                    <Clock className="h-3.5 w-3.5 text-stone-400" />
                    <span>{svc.effectiveDuration} mins session</span>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center justify-between border-t border-stone-200/60 pt-3 sm:border-0 sm:pt-0 sm:justify-end gap-4 shrink-0">
                  <div className="text-left sm:text-right sm:hidden">
                    <span className="block text-[10px] uppercase font-bold text-stone-400">
                      Price
                    </span>
                    <span className="text-base font-bold text-stone-900">
                      ₹{Number(svc.effectivePrice).toFixed(0)}
                    </span>
                  </div>

                  <Link
                    href={`${base}/book?providerId=${providerId}&serviceId=${svc.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-[#FAF8F5] shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all"
                  >
                    <span>Reserve Slot</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-[#FAF8F5] px-4 py-3 text-xs text-stone-500 shadow-2xs">
          <span>
            Page <strong className="text-stone-900">{safePage}</strong> of{' '}
            <strong className="text-stone-900">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}