// app/s/[subdomain]/providers/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ArrowRight,
  User,
  Scissors,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { ProviderServicesCatalog } from "./ProviderServicesCatalog";

interface Props {
  params: Promise<{ subdomain: string; slug: string }>;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  effectiveDuration: number;
  effectivePrice: number;
}

interface ProviderDetail {
  id: number;
  name: string;
  title: string;
  category?: string;
  bio?: string;
  avatarUrl?: string;
  services?: ServiceItem[];
}

export async function fetchProviderDetail(
  slug: string,
  subdomain: string
): Promise<ProviderDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_ORIGIN}/api/providers/${slug}`,
    {
      headers: { "x-tenant-slug": subdomain },
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function ProviderProfilePage({ params }: Props) {
  const { subdomain, slug } = await params;
  const provider = await fetchProviderDetail(slug, subdomain);

  if (!provider) {
    notFound();
  }

  const isDev = process.env.NODE_ENV === "development";
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
    (isDev ? "localhost:3000" : "picomart.in");
  const businessName = titleCase(subdomain);
  const base = `${isDev ? "http" : "https"}://${subdomain}.${rootDomain}`;

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-stone-900 antialiased selection:bg-[#9A7B56]/20 selection:text-stone-900">
      <Nav businessName={businessName} base={base} isProvider={false} isVendor={false} />

      {/* Breadcrumb Context Tracker */}
      <header className="border-b border-stone-200/80 bg-[#FAF8F5]/80 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-stone-500 sm:text-sm"
          >
            <Link
              href={base}
              className="transition-colors hover:text-stone-900 hover:underline"
            >
              {businessName}
            </Link>
            <span className="text-stone-300" aria-hidden="true">
              /
            </span>
            <span className="text-stone-500">Specialists</span>
            <span className="text-stone-300" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-stone-900" aria-current="page">
              {provider.name}
            </span>
          </nav>

          <div className="hidden items-center gap-2 text-xs font-semibold text-stone-600 sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span>Direct Specialist Console</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        {/* 1. Specialist Hero Profile Card */}
        <section className="rounded-3xl border border-stone-200/80 bg-[#FAF8F5] p-5 shadow-xs sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-stone-200/60 shadow-2xs sm:h-24 sm:w-24">
              {provider.avatarUrl ? (
                <Image
                  src={provider.avatarUrl}
                  alt={provider.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-stone-400">
                  <User className="h-10 w-10 stroke-[1.5]" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  {provider.name}
                </h1>
                {provider.category && (
                  <span className="inline-flex items-center rounded-md bg-stone-200/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                    {provider.category}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-[#9A7B56]">
                {provider.title || "Specialist Practitioner"}
              </p>

              {provider.bio && (
                <p className="pt-1 text-xs leading-relaxed text-stone-600 sm:text-sm">
                  {provider.bio}
                </p>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-stone-200/70 text-xs text-stone-500">
                <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Accepting Online Appointments</span>
                </div>
                <span>•</span>
                <span>{provider.services?.length ?? 0} services available</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Searchable, Filterable & Paginated Services Catalog */}
        <ProviderServicesCatalog
          services={provider.services ?? []}
          providerId={provider.id}
          base={base}
        />
      </main>
    </div>
  );
}