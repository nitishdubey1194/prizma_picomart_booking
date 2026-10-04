'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, getAccessToken } from '@/lib/auth';

export function Nav({ businessName, base, isProvider, isVendor }: { businessName: string; base: string, isProvider: boolean, isVendor: boolean }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    getAccessToken().then((token) => setIsLoggedIn(token !== null));
  }, []);

  async function handleLogout() {
    await authClient.logout();
    setIsLoggedIn(false);
    setIsMobileMenuOpen(false);
    router.push(base);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-6 lg:px-8">
        <Link 
          href={base} 
          className="font-display text-xl font-medium tracking-tight text-ink transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {businessName}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-[13px] font-medium tracking-wide sm:flex">
          {isLoggedIn === true && (
            <>
              {(isProvider || isVendor) ? (
                <Link 
                  href={`${base}/dashboard`} 
                  className="text-ink/65 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Dashboard
                </Link>
              ) :(

                <Link 
                  href={`${base}/bookings`} 
                  className="text-ink/65 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  My Bookings
                </Link>
              )
                
              }
              
              <button 
                onClick={handleLogout} 
                className="cursor-pointer text-ink/65 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Sign out
              </button>
            </>
          )}

          {isLoggedIn === false && (
            <Link 
              href={`${base}/login`} 
              className="text-ink/65 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Sign in
            </Link>
          )}

          <Link
            href={`${base}/book`}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink px-5 py-2.5 text-xs uppercase tracking-wider text-paper transition-all duration-200 hover:bg-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98]"
          >
            <span>Book Appointment</span>
            <svg 
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" 
              viewBox="0 0 16 16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="relative inline-flex items-center justify-center rounded-md p-2 text-ink transition-colors hover:bg-ink/5 sm:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <svg className="h-6 w-6 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="border-b border-ink/10 bg-paper px-6 py-6 sm:hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-4 text-sm font-medium">
            {isLoggedIn === true && (
              <>
                {(isProvider || isVendor) ? (
                  <Link 
                    href={`${base}/dashboard`} 
                    className="text-ink/65 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Dashboard
                  </Link>
                ) :(

                  <Link 
                    href={`${base}/bookings`} 
                    className="text-ink/65 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    My Bookings
                  </Link>
                )
                  
                }
                <button
                  onClick={handleLogout}
                  className="py-1 text-left text-ink/75 transition-colors hover:text-ink"
                >
                  Sign out
                </button>
              </>
            )}

            {isLoggedIn === false && (
              <Link
                href={`${base}/login`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 text-ink/75 transition-colors hover:text-ink"
              >
                Sign in
              </Link>
            )}

            <Link
              href={`${base}/book`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-ink py-3 text-xs uppercase tracking-wider text-paper"
            >
              Book an appointment
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}