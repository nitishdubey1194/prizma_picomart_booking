'use client';

import Link from 'next/link';
import { useAvailability } from '@/lib/queries';
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
    title: 'Seamless Digital Booking',
    summary: 'Direct scheduling without back-and-forth communication.',
    details:
      'Select your desired treatment, choose your preferred practitioner, and reserve an exact time slot in under two minutes with instant calendar lock.',
  },
  {
    step: '02',
    title: 'Tailored In-Studio Care',
    summary: 'A calm, intentional environment dedicated to your visit.',
    details:
      'Arrive at our studio for an unhurried, one-on-one session. We design your treatment around your personal goals and physical profile.',
  },
  {
    step: '03',
    title: 'Ongoing Progress & Support',
    summary: 'Personalized aftercare plans following every appointment.',
    details:
      'Leave with actionable home guidance, digital recap notes, and simple single-click rebooking access for your subsequent check-in.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The booking flow was completely effortless, and the studio atmosphere is second to none. My appointment started right on the dot.',
    author: 'Elena Rostova',
    role: 'Verified Client',
    tag: 'Monthly Member',
    rating: 5,
  },
  {
    quote:
      'The depth of consultation here is rare. My practitioner walked me through the entire routine and tailored every minute to what I needed.',
    author: 'Marcus Vance',
    role: 'Verified Client',
    tag: 'Signature Session',
    rating: 5,
  },
  {
    quote:
      'Easily the most seamless appointment experience I have encountered. Rescheduling via email when my schedule shifted took ten seconds.',
    author: 'Devon Lee',
    role: 'Verified Client',
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

  return (
    <div className="relative min-h-screen bg-paper text-ink selection:bg-brass/20 selection:text-ink">
      {/* Top Announcement Strip */}
      {announcement && (
        <aside className="relative z-50 flex items-center justify-center gap-2 border-b border-ink/10 bg-ink px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-widest text-paper">
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
          <span>{announcement}</span>
        </aside>
      )}

      {/* Navigation */}
      <Nav businessName={businessName} base={base} />

      <main className="relative">
        {/* Hero Section */}
        <Hero
          businessName={businessName}
          tagline="Pick a service, choose a time that works, and you're booked — no calls, no waiting."
          nextSlotIso={nextSlotIso}
          base={base}
        />

        {/* Feature Value Props - Responsive Stacking */}
        <section className="relative border-y border-ink/10 bg-white/40 py-8 backdrop-blur-sm sm:py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8 sm:divide-x sm:divide-ink/10">
              <div className="flex items-start gap-4 sm:pr-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink ring-1 ring-ink/10">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-base font-medium text-ink">Instant Confirmation</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink/65">Direct calendar lock with calendar invites & SMS alerts.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink ring-1 ring-ink/10">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-base font-medium text-ink">Verified Practitioners</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink/65">Qualified, licensed specialists dedicated to personal care.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:pl-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink ring-1 ring-ink/10">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-base font-medium text-ink">Zero Lock-In</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink/65">Reschedule or modify your sessions online with single-click ease.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. How It Works Section - Mobile Responsive Split Grid */}
        {/* 1. How It Works Section */}
        <section id="experience" className="py-10 sm:py-16 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-14">
              
              {/* Section Header: Hidden on mobile, visible on desktop */}
              <div className="hidden md:sticky md:top-28 md:col-span-4 md:block md:self-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  <span className="font-mono text-brass">01</span>
                  <span className="text-ink/30">•</span>
                  <span>Process</span>
                </div>

                <h2 className="mt-4 font-display text-2xl font-light tracking-tight text-ink sm:text-3xl lg:text-4xl">
                  How It Works
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  From instant reservation to dedicated in-studio treatment, here is what to expect during your journey.
                </p>

                <div className="mt-8">
                  <Link
                    href={`${base}/book`}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:bg-brass active:scale-[0.98]"
                  >
                    <span>Reserve a Slot</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Steps List: Takes full width on mobile, 8 columns on desktop */}
              <div className="md:col-span-8">
                <div className="space-y-4">
                  {STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="group rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs transition-all hover:border-ink/20 hover:shadow-md sm:p-7"
                    >
                      <div className="flex items-center justify-between border-b border-ink/5 pb-3">
                        <span className="font-mono text-xs font-semibold tracking-wider text-brass">{s.step}</span>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-ink/40">Step</span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-medium text-ink sm:text-xl">{s.title}</h3>
                      <p className="mt-1 text-xs font-medium text-ink/50">{s.summary}</p>
                      <p className="mt-3 text-xs leading-relaxed text-ink/70 sm:text-sm">{s.details}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2. Client Stories & Reviews Section - Fluid Responsive Cards */}
        <section id="reviews" className="border-t border-ink/10 bg-ink/[0.015] py-14 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-14">
              <div className="md:col-span-4 md:sticky md:top-28 md:self-start">
                <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  <span className="font-mono text-brass">02</span>
                  <span className="text-ink/30">•</span>
                  <span>Social Proof</span>
                </div>

                <h2 className="mt-4 font-display text-2xl font-light tracking-tight text-ink sm:text-3xl lg:text-4xl">
                  Client Stories
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-ink/70 sm:mt-3">
                  Read genuine reviews from guests who schedule appointments and treatments with our team.
                </p>

                {/* Rating stat card */}
                <div className="mt-6 rounded-2xl border border-ink/10 bg-white/70 p-4 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs sm:mt-8 sm:p-5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-normal text-ink sm:text-4xl">4.9</span>
                    <span className="text-xs text-ink/40">/ 5.0</span>
                  </div>
                  <div className="mt-1.5 flex text-brass">
                    {'★★★★★'.split('').map((star, i) => (
                      <span key={i} className="text-sm">★</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-ink/60">Based on verified post-appointment evaluations.</p>
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="grid grid-cols-1 gap-4">
                  {TESTIMONIALS.map((t, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-xs ring-1 ring-ink/5 backdrop-blur-xs sm:p-7"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex text-brass text-sm">
                          {'★'.repeat(t.rating)}
                        </div>
                        <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink/60">
                          {t.tag}
                        </span>
                      </div>
                      <p className="mt-4 text-xs leading-relaxed text-ink/80 italic sm:text-sm">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3">
                        <span className="font-display text-sm font-medium text-ink">{t.author}</span>
                        <span className="text-xs text-ink/40">{t.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Inverted Dark Contrast CTA Banner - Responsive Padding & Touch Targets */}
        <section className="relative overflow-hidden bg-ink py-16 text-paper sm:py-24 lg:py-28">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-[0.04] [background-size:24px_24px]" />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-paper/10 bg-paper/5 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-paper/70 backdrop-blur-xs">
              Instant Online Booking
            </span>
            <h2 className="mt-5 font-display text-2xl font-light tracking-tight text-paper sm:text-4xl lg:text-5xl">
              Ready to schedule your appointment?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-paper/70 sm:mt-4 sm:text-sm lg:text-base">
              Choose your service, designate your preferred specialist, and confirm your slot in under two minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={`${base}/book`}
                className="w-full rounded-full bg-brass px-8 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-white hover:text-ink active:scale-[0.98] sm:w-auto"
              >
                Schedule Appointment
              </Link>
              {nextSlotIso && (
                <div className="inline-flex items-center gap-2 rounded-full border border-paper/15 px-4 py-2 text-xs text-paper/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Slots open for this week</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-paper py-8 text-xs text-ink/60 sm:py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            
          </div>
        </div>
      </footer>
    </div>
  );
}