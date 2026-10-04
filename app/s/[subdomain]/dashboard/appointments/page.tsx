'use client';

import { useParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useAppointments, useUpdateAppointmentStatus, useCurrentUser } from '@/lib/queries';
import type { AppointmentWithDetails } from '@/lib/api';

// ---------------------------------------------------------------------------
// Design System & Configuration
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 5; // Adjust this number based on your preference

const STATUS_BADGE_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-600/20',
  completed: 'bg-slate-50 text-slate-700 border-slate-200/60 ring-slate-600/20',
  cancelled: 'bg-red-50 text-red-700 border-red-200/60 ring-red-600/20',
};

const ACTION_BUTTON_STYLES: Record<string, string> = {
  confirmed: 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm focus:ring-gray-900',
  completed: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus:ring-emerald-600',
  cancelled: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-red-500',
};

function allowedNextStatuses(status: AppointmentWithDetails['status']) {
  if (status === 'pending') return ['confirmed', 'cancelled'] as const;
  if (status === 'confirmed') return ['completed', 'cancelled'] as const;
  return [] as const;
}

// ---------------------------------------------------------------------------
// SVG Icon Components
// ---------------------------------------------------------------------------

const Icons = {
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
  ),
  Calendar: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
  ),
  Mail: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
  ),
  Phone: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  ),
  User: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  FileText: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
  ),
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  )
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AppointmentsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { data: user } = useCurrentUser(subdomain);
  const { data: appointments = [], isLoading, error } = useAppointments(subdomain);
  const updateStatus = useUpdateAppointmentStatus(subdomain);
  
  // State
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isVendor = user?.role.includes('vendor') ?? false;

  // Derived State: Filtering & Pagination
  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    const lowerTerm = searchTerm.toLowerCase();
    
    return appointments.filter((a) =>
      a.serviceName?.toLowerCase().includes(lowerTerm) ||
      a.providerName?.toLowerCase().includes(lowerTerm) ||
      a.customerEmail?.toLowerCase().includes(lowerTerm) ||
      (a.customerMobile && a.customerMobile.toLowerCase().includes(lowerTerm)) ||
      (a.customerNotes && a.customerNotes.toLowerCase().includes(lowerTerm)) ||
      a.status.toLowerCase().includes(lowerTerm)
    );
  }, [appointments, searchTerm]);

  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Render Access Denied
  if (!isVendor && user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-full bg-red-50 p-4 mb-4">
          <Icons.AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-sm">You do not have the necessary vendor permissions to view this page.</p>
      </div>
    );
  }

  // Render Loading State
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 rounded-lg mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl border border-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render Error State
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex flex-col items-center text-center">
          <Icons.AlertCircle className="w-10 h-10 text-red-600 mb-4" />
          <h3 className="text-lg font-medium text-red-800">Failed to load appointments</h3>
          <p className="mt-2 text-sm text-red-600">Please check your connection and try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-display">Appointments Dashboard</h1>
            <p className="mt-1.5 text-sm text-gray-500">Manage and track your customer bookings</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-700">
              {appointments.length} {appointments.length === 1 ? 'Appointment' : 'Appointments'}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icons.Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by customer, service, or status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page directly in handler
              }}
              className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
            />
          </div>
          {searchTerm && (
            <div className="hidden sm:block text-sm text-gray-500">
              Found {filteredAppointments.length} matching {filteredAppointments.length === 1 ? 'result' : 'results'}
            </div>
          )}
        </div>

        {/* Global Action Error Alert */}
        {actionError && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 flex items-start gap-3 shadow-sm transition-all">
            <Icons.AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Action failed</h3>
              <p className="text-sm text-red-600 mt-1">{actionError}</p>
            </div>
            <button 
              onClick={() => setActionError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              &times;
            </button>
          </div>
        )}

        {/* Empty States */}
        {appointments.length === 0 ? (
          <div className="text-center py-20 px-6 bg-white border border-gray-200 rounded-2xl border-dashed">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Icons.Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">No appointments yet</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              When customers book your services, their appointments will appear here.
            </p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
              <Icons.Search className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium">No matches found</p>
            <p className="text-sm text-gray-500 mt-1">We could not find anything matching {searchTerm}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Appointments List */}
            {paginatedAppointments.map((a) => (
              <div 
                key={a.id} 
                className="group flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md"
              >
                
                {/* Left Column: Details */}
                <div className="flex-1 space-y-4">
                  
                  {/* Meta row: Date & Status */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-start gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border ring-1 ring-inset ${STATUS_BADGE_STYLES[a.status] || STATUS_BADGE_STYLES.pending}`}>
                      {a.status}
                    </span>
                    <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      <Icons.Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(a.startTime).toLocaleString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Main Identity: Service & Provider */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {a.serviceName}
                    </h3>
                    <div className="flex items-center mt-1.5 text-sm text-gray-500">
                      <Icons.User className="w-4 h-4 mr-1.5 text-gray-400" />
                      Provided by <span className="font-medium text-gray-700 ml-1">{a.providerName}</span>
                    </div>
                  </div>

                  {/* Customer Contact Info Block */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-2 border-t border-gray-100">
                    <a href={`mailto:${a.customerEmail}`} className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group/link">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center mr-2 group-hover/link:bg-blue-100 transition-colors">
                        <Icons.Mail className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      {a.customerEmail}
                    </a>
                    
                    {a.customerMobile && (
                      <a href={`tel:${a.customerMobile}`} className="flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors group/link">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center mr-2 group-hover/link:bg-emerald-100 transition-colors">
                          <Icons.Phone className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        {a.customerMobile}
                      </a>
                    )}
                  </div>

                  {/* Customer Notes */}
                  {a.customerNotes && (
                    <div className="mt-3 flex items-start gap-3 rounded-xl bg-gray-50 p-4 border border-gray-100">
                      <Icons.FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        {a.customerNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Actions */}
                <div className="flex flex-row lg:flex-col items-center justify-end gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-auto">
                  {allowedNextStatuses(a.status).length > 0 ? (
                    allowedNextStatuses(a.status).map((next) => (
                      <button
                        key={next}
                        onClick={() => {
                          setActionError(null);
                          updateStatus.mutate(
                            { id: a.id, status: next },
                            { onError: (err) => setActionError(err instanceof Error ? err.message : `Failed to update status to ${next}.`) }
                          );
                        }}
                        disabled={updateStatus.isPending}
                        className={`
                          w-full lg:w-40 px-4 py-2.5 rounded-xl text-sm font-semibold capitalize 
                          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                          disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center
                          ${ACTION_BUTTON_STYLES[next] || 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                        `}
                      >
                        {updateStatus.isPending ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Updating...
                          </span>
                        ) : (
                          `Mark ${next}`
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="w-full lg:w-40 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-50 border border-gray-100 text-center flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      Resolved
                    </div>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {filteredAppointments.length > ITEMS_PER_PAGE && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}