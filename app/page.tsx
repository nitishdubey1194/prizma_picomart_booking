"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Store,
  Zap,
  ShieldCheck,
  TrendingUp,
  Send,
  Loader2,
  Menu,
  X,
} from "lucide-react";

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://picomart.in";

  // Mobile Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // WhatsApp Configuration
  const whatsappNumber = "919596407756"; // Replace with your phone number (Country code + phone)
  const defaultMessage = encodeURIComponent(
    "Hi Picomart! I want to open my online store on your platform."
  );

  // Form State Management
  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    phone: "",
    category: "retail",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.log(response)
      if (response.ok) {
        setSubmitted(true);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Form submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Picomart",
        url: siteUrl,
        logo: `${siteUrl}/picomart-favicon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Picomart Merchant Platform",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#fcfbf9] text-slate-900 antialiased selection:bg-[#008060] selection:text-white">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8 lg:px-12">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#008060] font-black text-white shadow-sm sm:h-9 sm:w-9">
              P
            </span>
            <span>Picomart</span>
          </Link>

          {/* Desktop Navigation CTA */}
          <div className="hidden sm:flex sm:items-center sm:gap-4">
            <a
              href="#apply-form"
              className="rounded-full bg-[#008060] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#004c3f] hover:shadow-md"
            >
              Start Free Store
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 sm:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:hidden">
            <a
              href="#apply-form"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center rounded-lg bg-[#008060] py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              Start Free Store
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f4f7f5] via-[#fcfbf9] to-white px-4 py-12 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            
            {/* Hero Text */}
            <div className="text-center lg:col-span-7 lg:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#008060]/20 bg-[#008060]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#008060] sm:px-3.5 sm:py-1.5 sm:text-xs">
                <Zap size={14} /> Zero Commission • 100% Free Setup
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl xl:text-7xl">
                Build your online store for free.
              </h1>

              <p className="mt-4 text-base text-slate-600 sm:mt-6 sm:text-lg lg:text-xl">
                Launch your custom multi-tenant storefront with Picomart. Manage inventory, process orders seamlessly, and connect directly with your customers.
              </p>

              {/* Responsive Value Props */}
              <div className="mt-6 flex flex-col items-center justify-center gap-3 text-xs font-medium text-slate-700 sm:flex-row sm:gap-6 sm:text-sm lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#008060]" /> No Credit Card Needed
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#008060]" /> Ready in 5 Minutes
                </span>
              </div>
            </div>

            {/* Merchant Application Form Card */}
            <div id="apply-form" className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Claim Your Free Store
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Fill out your details to activate your online workspace.
                </p>

                {submitted ? (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-[#008060] sm:h-12 sm:w-12" />
                    <h3 className="mt-3 text-base font-bold text-slate-900 sm:text-lg">
                      Application Submitted!
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                      We have received your request. Check your email for your tenant setup details!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Store Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Urban Style Store"
                        value={formData.storeName}
                        onChange={(e) =>
                          setFormData({ ...formData, storeName: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#008060] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="merchant@domain.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#008060] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        WhatsApp Contact Phone
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#008060] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                        Store Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-[#008060] focus:outline-none focus:ring-1 focus:ring-[#008060]"
                      >
                        <option value="health_wellness">Health and Wellness</option>
                        {/* <option value="plumber">Plumber</option>
                        <option value="carpenter">Carpenter</option> */}
                        <option value="hair_dresser">Hair Dresser</option>
                        <option value="carwash">Car Wash</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#008060] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#004c3f] active:scale-[0.99] disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          Request Free Store <Send size={14} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to grow your enterprise
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Built on scalable infrastructure designed for modern digital commerce.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <Store className="h-7 w-7 text-[#008060]" />
              <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                Custom Tenant Subdomain
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Get an instant storefront like <strong>yourbrand.picomart.in</strong> with full theme customization options.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <TrendingUp className="h-7 w-7 text-[#008060]" />
              <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                Zero Transaction Fees
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Keep 100% of your earnings. We charge zero setup fees or cut-off transaction commissions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
              <ShieldCheck className="h-7 w-7 text-[#008060]" />
              <h3 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                Instant Order Management
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Integrated inventory tools, instant order tracking, and ready-to-use customer checkout modules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Action Widget (Mobile & Desktop Responsive) */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${defaultMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-2.5 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#20ba5a] sm:bottom-6 sm:right-6 sm:px-4 sm:py-3"
      >
        <MessageCircle className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
        <span className="text-xs font-bold uppercase tracking-wider sm:inline">
          Chat Support
        </span>
      </a>

      {/* Responsive Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-xs text-slate-500 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="font-bold text-slate-800">Picomart for Merchants</p>
          <p>© {new Date().getFullYear()} Picomart. Everyday shopping, made simpler.</p>
        </div>
      </footer>
    </main>
  );
}