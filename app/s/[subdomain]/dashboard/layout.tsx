'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/queries';

function titleCase(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { subdomain } = useParams<{ subdomain: string }>();
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const base = `${isDev ? 'http' : 'https'}://${subdomain}.${rootDomain}`;

  const { data: user, isLoading } = useCurrentUser(subdomain);
  
  const isVendor = user?.role?.includes('vendor') ?? false;
  const isProvider = user?.providerId !== null && user?.providerId !== undefined;
  const hasDashboardAccess = isVendor || isProvider;
  console.log(hasDashboardAccess,'dsfdsfd', isVendor, isProvider, user)
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push(`${base}/login?returnTo=${encodeURIComponent(`${base}/dashboard`)}`);
      return;
    }
    if (!hasDashboardAccess) {
      router.push(base);
    }
  }, [isLoading, user, hasDashboardAccess, router, base]);

  // Loading skeleton screen to eliminate harsh jumps
  if (isLoading || !user || !hasDashboardAccess) {
    return (
      <div className="min-h-screen bg-paper text-ink antialiased">
        <header className="h-16 border-b border-ink/10 bg-white/40" />
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="space-y-4 animate-pulse">
            <div className="h-12 w-64 rounded-2xl bg-ink/5" />
            <div className="h-10 w-full rounded-xl bg-ink/5" />
            <div className="h-96 w-full rounded-3xl bg-ink/5" />
          </div>
        </div>
      </div>
    );
  }

  const businessName = titleCase(subdomain);

  return (
    <div className="min-h-screen bg-paper text-ink antialiased selection:bg-brass/20 selection:text-ink">
      {/* Top Application Shell Header */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`${base}/dashboard`}
              className="font-display text-lg font-medium tracking-tight text-ink transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ink"
            >
              {businessName}
            </Link>
            <span className="hidden rounded-full border border-ink/10 bg-ink/[0.03] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/60 sm:inline-block">
              Operations Hub
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={base}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-xs text-ink/60 transition-colors hover:text-ink sm:inline-flex"
            >
              <span>View Live Storefront</span>
              <span className="text-[10px]">↗</span>
            </Link>

            <span className="hidden h-4 w-px bg-ink/15 sm:block" />

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 font-mono text-xs font-semibold uppercase text-ink ring-1 ring-ink/10">
                {user.email ? user.email.charAt(0) : 'U'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-[130px] truncate text-xs font-medium text-ink">
                  {user.email}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brass">
                  {isVendor ? 'Studio Vendor' : 'Specialist'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <DashboardNav base={base} isVendor={isVendor} isProvider={isProvider} />
        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

interface NavItem {
  label: string;
  href: string;
  exact?: boolean;
}

function DashboardNav({
  base,
  isVendor,
  isProvider,
}: {
  base: string;
  isVendor: boolean;
  isProvider: boolean;
}) {
  const pathname = usePathname();

  const navLinks = useMemo(() => {
    const links: NavItem[] = [
      { label: 'Overview', href: `${base}/dashboard`, exact: true },
    ];

    if (isProvider) {
      links.push(
        { label: 'My Bookings', href: `${base}/dashboard/my-bookings` },
        { label: 'My Availability', href: `${base}/dashboard/my-availability` }
      );
    }

    if (isVendor) {
      links.push(
        { label: 'All Appointments', href: `${base}/dashboard/appointments` },
        { label: 'Team & Providers', href: `${base}/dashboard/providers` },
        { label: 'Service Ledger', href: `${base}/dashboard/services` }
      );
    }

    return links;
  }, [base, isVendor, isProvider]);

  return (
    <nav
      aria-label="Dashboard Navigation"
      className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto border-b border-ink/10 px-4 pb-2 sm:mx-0 sm:px-0"
    >
      {navLinks.map((item) => {
        // Robust active state calculation across local subdomains and production bases
        const itemPath = new URL(item.href, 'http://dummy.com').pathname;
        const isActive = item.exact
          ? pathname === itemPath || pathname === `${itemPath}/`
          : pathname.startsWith(itemPath);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium tracking-wide transition-all ${
              isActive
                ? 'bg-ink text-paper shadow-xs ring-1 ring-ink'
                : 'text-ink/65 hover:bg-ink/5 hover:text-ink'
            }`}
          >
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-brass" aria-hidden="true" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}