import type { Metadata } from 'next';
import Link from 'next/link';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { queryKeys } from '@/lib/queries';
import { getProviders, getServices } from '@/lib/api';
import { Nav } from '@/components/Nav';
import { BookingFlow } from './BookingFlow';

export const metadata: Metadata = {
  title: 'Book an Appointment — Picomart Engine',
  description: 'Select your preferred service, specialist, and schedule your appointment with instantaneous reservation confirmation.',
};

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const base = `${isDev ? 'http' : 'https'}://${subdomain}.${rootDomain}`;

  const queryClient = getQueryClient();

  const businessName = titleCase(subdomain);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen bg-paper text-ink antialiased selection:bg-brass/20 selection:text-ink">
        <Nav businessName={businessName} base={base} />

        {/* Breadcrumb / Context Tracker Header */}
        <header className="border-b border-ink/10 bg-white/40 backdrop-blur-xs">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink/50 sm:text-sm">
              <Link 
                href={base} 
                className="transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-ink"
              >
                {businessName}
              </Link>
              <span className="text-ink/30" aria-hidden="true">/</span>
              <span className="font-medium text-ink" aria-current="page">
                Appointment Schedule
              </span>
            </nav>

            <div className="hidden items-center gap-2 text-xs font-medium text-ink/60 sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <span>Direct Booking Console</span>
            </div>
          </div>
        </header>

        {/* Main Application Container */}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14 lg:py-16">
          <header className="mb-10 max-w-2xl sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
              <span className="font-mono text-brass">Secure Checkout</span>
              <span className="text-ink/30">•</span>
              <span>Encrypted Reservation</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Select Your Session
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/70 sm:text-base">
              Follow the guided checklist below to designate your care parameters. Calendar openings populate synchronously in real time.
            </p>
          </header>

          <BookingFlow tenantSlug={subdomain} />
        </main>

        <footer className="border-t border-ink/10 bg-paper py-10 text-xs text-ink/60">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
            <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="h-1 w-1 rounded-full bg-ink/20" />
              <p>Powered by Picomart Engine</p>
            </div>
          </div>
        </footer>
      </div>
    </HydrationBoundary>
  );
}