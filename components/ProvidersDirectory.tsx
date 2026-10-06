'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface TodaySchedule {
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  formatted?: string;
  isExceptionOverride?: boolean;
}

export interface Provider {
  id: string | number;
  name: string;
  category: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
  isAvailableToday?: boolean;
  todayStartTime?: string | null;
  todayEndTime?: string | null;
  todaySchedule?: TodaySchedule;
}

const ITEMS_PER_PAGE = 6;

function titleCase(str: string): string {
  return str
    .split(/[-_ ]+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function formatTime(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${period}`;
}

export default function ProvidersDirectory({ providers }: { providers: Provider[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Derive unique categories with exact counts
  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const provider of providers) {
      if (provider.category) {
        counts.set(provider.category, (counts.get(provider.category) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([key, total]) => ({
      key,
      label: titleCase(key),
      total,
    }));
  }, [providers]);

  // Combined search and category filtering
  const filteredProviders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        provider.category.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) return false;
      if (!term) return true;

      return (
        provider.name.toLowerCase().includes(term) ||
        (provider.title && provider.title.toLowerCase().includes(term)) ||
        (provider.bio && provider.bio.toLowerCase().includes(term)) ||
        (provider.category && provider.category.toLowerCase().includes(term))
      );
    });
  }, [providers, searchTerm, selectedCategory]);

  const totalPages = Math.ceil(filteredProviders.length / ITEMS_PER_PAGE) || 1;
  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProviders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProviders, currentPage]);

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchTerm(query);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Filtering Header Section */}
      <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-stone-200/80">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Category Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 max-w-md">
            <label
              htmlFor="specialty-dropdown"
              className="text-xs font-semibold tracking-wider uppercase text-stone-500 shrink-0 font-mono"
            >
              Filter Specialty
            </label>
            <div className="relative w-full">
              <select
                id="specialty-dropdown"
                value={selectedCategory}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-stone-200 bg-stone-50/70 py-2.5 pl-4 pr-10 text-xs font-semibold text-stone-800 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all cursor-pointer shadow-xs"
              >
                <option value="all">
                  All Specialties ({providers.length})
                </option>
                {categoryStats.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label} ({cat.total})
                  </option>
                ))}
              </select>

              {/* Chevron Icon */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" x2="16.65" y1="21" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by specialist or role..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/70 py-2.5 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Applied Filter Readout / Reset */}
        {(selectedCategory !== 'all' || searchTerm.trim() !== '') && (
          <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
              <span>Matching results:</span>
              <strong className="text-stone-900">{filteredProviders.length}</strong>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-stone-700">
                  {titleCase(selectedCategory)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-stone-500 hover:text-stone-900 font-medium underline underline-offset-2 transition-colors cursor-pointer"
            >
              Reset active filters
            </button>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      {filteredProviders.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-stone-200 bg-white p-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-stone-900">No specialists found</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            No active practitioners matched your current category selection or keyword search.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 inline-flex items-center text-xs font-semibold text-stone-900 hover:text-stone-600 underline underline-offset-4 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProviders.map((provider) => {
            const initials =
              provider.name
                ?.split(/\s+/)
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'SP';

            const isAvailable =
              provider.todaySchedule?.isAvailable ?? provider.isAvailableToday ?? false;

            const rawStart = provider.todaySchedule?.startTime ?? provider.todayStartTime;
            const rawEnd = provider.todaySchedule?.endTime ?? provider.todayEndTime;
            const formattedStart = formatTime(rawStart);
            const formattedEnd = formatTime(rawEnd);
            const hasCoordinates = provider.latitude != null && provider.longitude != null;

            return (
              <div
                key={provider.id}
                className="group relative flex flex-col justify-between rounded-3xl bg-white p-6 border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <div>
                  {/* Top Bar: Avatar & Category Chip */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative">
                      {provider.avatarUrl ? (
                        <Image alt="{provider.name}" className="h-16 w-16 rounded-2xl object-cover ring-4 ring-stone-50" height={64} src="{provider.avatarUrl}" unoptimized width={64} />
                      ) : (
                        <div className="flex h-16 w-16 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 items-center justify-center font-semibold text-stone-700 text-lg shadow-inner ring-4 ring-stone-50">
                          {initials}
                        </div>
                      )}
                      {/* Presence Indicator */}
                      <span
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full ring-2 ring-white flex items-center justify-center ${
                          isAvailable ? 'bg-emerald-500' : 'bg-stone-300'
                        }`}
                        title={isAvailable ? 'Available today' : 'Unavailable today'}
                      >
                        {isAvailable && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </span>
                    </div>

                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-100 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                      {titleCase(provider.category)}
                    </span>
                  </div>

                  {/* Provider Info */}
                  <div className="mt-4">
                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                      {provider.name}
                    </h3>
                    <p className="text-xs font-medium text-stone-500 mt-0.5">
                      {provider.title || titleCase(provider.category)}
                    </p>
                  </div>

                  {/* Bio */}
                  <p className="mt-3 text-xs leading-relaxed text-stone-600 line-clamp-2">
                    {provider.bio ||
                      `Certified specialist available for direct booking and scheduled consultations.`}
                  </p>
                </div>

                {/* Footer Section */}
                <div className="mt-6 pt-4 border-t border-stone-100 space-y-4">
                  {/* Availability Hours & Geolocation Meta */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isAvailable ? 'bg-emerald-500' : 'bg-stone-300'
                        }`}
                      />
                      <span className="font-medium text-stone-600">
                        {isAvailable && formattedStart && formattedEnd
                          ? `${formattedStart} - ${formattedEnd}`
                          : isAvailable
                          ? 'Available Today'
                          : 'Unavailable Today'}
                      </span>
                    </div>

                    {hasCoordinates && (
                      <a
                        href={`https://maps.google.com/?q=${provider.latitude},${provider.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Map
                      </a>
                    )}
                  </div>

                  {/* Booking CTA Button */}
                  <Link 
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 focus:ring-2 focus:ring-stone-900/20 active:scale-[0.99] transition-all shadow-xs" 
                    href={`/assistant/${provider.slug}`}
                  >
                    <span>Schedule Appointment</span>
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-stone-200">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Previous
          </button>

          <span className="text-xs font-medium text-stone-500">
            Page <strong className="font-semibold text-stone-900">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-stone-900">{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}