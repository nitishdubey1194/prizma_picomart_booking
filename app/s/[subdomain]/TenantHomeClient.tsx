'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Sparkles,
  ArrowRight,
  Star,
  RotateCcw,
  UserCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAvailability, useCurrentUser } from '@/lib/queries';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';

export interface TenantHomeClientProps {
  subdomain: string;
  base: string;
  businessName: string;
  firstProviderId: number | null;
  today: string;
  serviceId: number | null;
  announcement?: string | null;
}

const STEPS = [
  {
    step: '01',
    title: 'Instant Online Reservation',
    summary: 'Direct scheduling without back-and-forth communication.',
    details:
      'Select your treatment, choose your practitioner, and lock in an exact time slot in under two minutes with instant confirmation.',
  },
  {
    step: '02',
    title: 'Dedicated Studio Session',
    summary: 'A calm, unhurried environment tailored to your visit.',
    details:
      'Arrive for your private, one-on-one session. We design your treatment around your personal goals, schedule, and preferences.',
  },
  {
    step: '03',
    title: 'Digital Aftercare & Easy Check-In',
    summary: 'Personalized treatment notes following every appointment.',
    details:
      'Leave with actionable home guidance, treatment logs, and simple single-tap rebooking access for your subsequent visits.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The booking flow was completely effortless, and the studio atmosphere is second to none. My appointment started right on the dot without waiting.',
    author: 'Elena Rostova',
    role: 'Verified Guest',
    tag: 'Monthly Member',
    rating: 5,
  },
  {
    quote:
      'The depth of consultation here is rare. My practitioner walked me through the entire routine and tailored every minute to what I needed.',
    author: 'Marcus Vance',
    role: 'Verified Guest',
    tag: 'Signature Session',
    rating: 5,
  },
  {
    quote:
      'Easily the cleanest appointment experience I have encountered. Rescheduling via email when my schedule shifted took ten seconds.',
    author: 'Devon Lee',
    role: 'Verified Guest',
    tag: 'Consultation',
    rating: 5,
  },
];

export function TenantHomeClient({
  subdomain,
  base,
  businessName,
  firstProviderId,
  today,
  serviceId,
  announcement = null,
}: TenantHomeClientProps) {
  const { data: slots = [] } = useAvailability(subdomain, firstProviderId, today, serviceId);
  const nextSlotIso = slots[0]?.startTime ?? null;
  const { data: user, isLoading: loadingUser } = useCurrentUser(subdomain);
  const isProvider = user?.providerId !== null && user?.providerId !== undefined;
  const isVendor = user?.role
    ? Array.isArray(user.role)
      ? user.role.includes('vendor')
      : user.role === 'vendor'
    : false;

  // Track scroll state for mobile bottom sticky CTA bar
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setShowStickyBar(window.scrollY > 380);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#F6F4EE] text-stone-900 selection:bg-[#9A7B56]/20 selection:text-stone-900 pb-20 sm:pb-0">
      {/* Studio Announcement Header */}
      {announcement && (
        <aside className="relative z-50 flex items-center justify-center gap-2 border-b border-stone-200/80 bg-[#1C1917] px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#FAF8F5]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C5A059] animate-pulse" />
          <span>{announcement}</span>
        </aside>
      )}

      {/* Navigation Header */}
      {!loadingUser && (
        <Nav
          businessName={businessName}
          base={base}
          isProvider={isProvider}
          isVendor={isVendor}
        />
      )}

      <main className="relative">
        {/* Hero Section */}
        <Hero
          businessName={businessName}
          tagline="Pick a service, choose a time that works, and you're booked — no calls, no waiting."
          nextSlotIso={nextSlotIso}
          base={base}
        />

        {/* Value Proposition Ribbon (Snap slider on mobile, 3-col on desktop) */}
        <section className="relative border-y border-stone-200/80 bg-[#FAF8F5]/90 py-5 sm:py-8 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-6 sm:divide-x sm:divide-stone-200/80">
              {/* Feature 1 */}
              <div className="flex min-w-[260px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-white/60 p-3 sm:min-w-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:pr-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 shadow-2xs">
                  <Clock className="h-4 w-4 text-[#9A7B56]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 sm:text-sm">Instant Calendar Lock</h3>
                  <p className="text-[11px] text-stone-500 sm:mt-0.5">Real-time slot lock with email & SMS confirmation.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex min-w-[260px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-white/60 p-3 sm:min-w-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 shadow-2xs">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 sm:text-sm">Verified Practitioners</h3>
                  <p className="text-[11px] text-stone-500 sm:mt-0.5">Experienced specialists dedicated to personal care.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex min-w-[260px] shrink-0 snap-start items-center gap-3 rounded-2xl bg-white/60 p-3 sm:min-w-0 sm:rounded-none sm:bg-transparent sm:p-0 sm:pl-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 shadow-2xs">
                  <RotateCcw className="h-4 w-4 text-stone-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900 sm:text-sm">Zero Lock-In</h3>
                  <p className="text-[11px] text-stone-500 sm:mt-0.5">Modify or reschedule your session online with 1 tap.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. How It Works Section */}
        <section id="experience" className="py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
              {/* Header column */}
              <div className="md:sticky md:top-28 md:col-span-4 md:self-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#FAF8F5] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 shadow-2xs">
                  <span className="font-mono text-[#9A7B56]">01</span>
                  <span className="text-stone-300">•</span>
                  <span>Simple Process</span>
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  How It Works
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-500 sm:text-sm">
                  From instant booking to dedicated studio time, here is what to expect during your journey.
                </p>

                <div className="mt-6 hidden md:block">
                  <Link
                    href={`${base}/book`}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-bold text-[#FAF8F5] shadow-xs hover:bg-stone-800 active:scale-[0.98] transition-all"
                  >
                    <span>Reserve a Slot</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Steps Deck */}
              <div className="md:col-span-8">
                <div className="space-y-3.5">
                  {STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="group rounded-3xl border border-stone-200/90 bg-[#FAF8F5] p-5 shadow-2xs transition hover:border-stone-300 sm:p-6"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                        <span className="font-mono text-xs font-extrabold tracking-wider text-[#9A7B56]">
                          {s.step}
                        </span>
                        <span className="rounded-md bg-stone-200/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-600">
                          Step
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-stone-900 sm:text-base">
                        {s.title}
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-stone-500">{s.summary}</p>
                      <p className="mt-2.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
                        {s.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Client Stories & Reviews Section */}
        <section id="reviews" className="border-t border-stone-200/80 bg-[#FAF8F5]/60 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
              {/* Review Overview Sidebar */}
              <div className="md:sticky md:top-28 md:col-span-4 md:self-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#FAF8F5] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 shadow-2xs">
                  <span className="font-mono text-[#9A7B56]">02</span>
                  <span className="text-stone-300">•</span>
                  <span>Social Proof</span>
                </div>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  Client Stories
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-stone-500 sm:text-sm">
                  Read genuine reviews from guests who visit our studio chairs.
                </p>

                {/* Score Pill Card */}
                <div className="mt-5 rounded-2xl border border-stone-200/90 bg-[#FAF8F5] p-4 shadow-2xs sm:p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-stone-900 sm:text-4xl">4.9</span>
                    <span className="text-xs text-stone-400">/ 5.0</span>
                  </div>
                  <div className="mt-1 flex gap-0.5 text-[#C5A059]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-[#C5A059]" />
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-stone-500">
                    Based on verified post-appointment evaluations.
                  </p>
                </div>
              </div>

              {/* Review Cards Deck */}
              <div className="md:col-span-8">
                <div className="space-y-3.5">
                  {TESTIMONIALS.map((t, idx) => (
                    <div
                      key={idx}
                      className="rounded-3xl border border-stone-200/90 bg-[#FAF8F5] p-5 shadow-2xs transition hover:border-stone-300 sm:p-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5 text-[#C5A059]">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#C5A059]" />
                          ))}
                        </div>
                        <span className="rounded-md bg-stone-200/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-600">
                          {t.tag}
                        </span>
                      </div>

                      <p className="mt-3 text-xs italic leading-relaxed text-stone-700 sm:text-sm">
                        &ldquo;{t.quote}&rdquo;
                      </p>

                      <div className="mt-3.5 flex items-center justify-between border-t border-stone-200/60 pt-2.5 text-xs">
                        <span className="font-bold text-stone-900">{t.author}</span>
                        <span className="text-stone-400">{t.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Deep Espresso CTA Section */}
        <section className="relative overflow-hidden bg-[#1C1917] py-14 text-[#FAF8F5] sm:py-20">
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-700 bg-stone-800/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-300 shadow-xs">
              <Sparkles className="h-3 w-3 text-[#C5A059]" />
              <span>Instant Online Booking</span>
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#FAF8F5] sm:text-3xl lg:text-4xl">
              Ready to schedule your appointment?
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-stone-400 sm:text-sm">
              Select your service, choose your preferred specialist chair, and confirm your slot in under
              two minutes.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={`${base}/book`}
                className="w-full rounded-xl bg-[#C5A059] px-7 py-3 text-center text-xs font-bold text-[#1C1917] shadow-xs transition hover:bg-white hover:text-stone-900 active:scale-[0.98] sm:w-auto"
              >
                Schedule Appointment
              </Link>
              {nextSlotIso && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800/60 px-3.5 py-2.5 text-xs text-stone-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Slots available for this week</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-[#FAF8F5] py-8 text-xs text-stone-500">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-stone-400">
            <span>Powered by Picomart Engine</span>
          </div>
        </div>
      </footer>

      {/* 4. Mobile Sticky Bottom Action Dock */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/90 bg-[#FAF8F5]/95 p-3.5 backdrop-blur-md transition-all duration-300 sm:hidden ${
          showStickyBar ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 leading-none">
                Direct Booking
              </span>
              <span className="block text-xs font-bold text-stone-900 leading-tight">
                {nextSlotIso ? 'Slots Available Today' : 'Instant Reservation'}
              </span>
            </div>
          </div>

          <Link
            href={`${base}/book`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs active:scale-[0.98] transition-transform"
          >
            <span>Book Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}