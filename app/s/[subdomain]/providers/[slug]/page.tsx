// app/s/[subdomain]/providers/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Nav } from '@/components/Nav';
interface Props {
  params: Promise<{ subdomain: string; slug: string }>;
}

async function fetchProviderDetail(slug: string, subdomain: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_ORIGIN}/api/providers/${slug}`,
    {
      headers: { "x-subdomain": subdomain },
      cache: "no-store",
    },
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
  console.log("Provider Profile Data:", provider);
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
    <div className="min-h-screen bg-paper text-ink antialiased selection:bg-brass/20 selection:text-ink">
      <Nav businessName={businessName} base={base} isProvider={false} />

      {/* Breadcrumb / Context Tracker Header */}
      <header className="border-b border-ink/10 bg-white/40 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-ink/50 sm:text-sm"
          >
            <Link
              href={base}
              className="transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-ink"
            >
              {businessName}
            </Link>
            <span className="text-ink/30" aria-hidden="true">
              /
            </span>
            <span className="font-medium text-ink" aria-current="page">
              Services
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
      {/* Header Profile Info */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-14 lg:py-16">
        <div className="flex items-center gap-6 pb-8 border-b mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
            {provider.avatarUrl && (
              <Image
                src={provider.avatarUrl}
                alt={provider.name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{provider.name}</h1>
            <p className="text-gray-600 font-medium">{provider.title}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-xs rounded-full uppercase tracking-wider font-semibold">
              {provider.category}
            </span>
            {provider.bio && (
              <p className="text-sm text-gray-700 mt-2">{provider.bio}</p>
            )}
          </div>
        </div>
        {/* Linked Provider Services Only */}
        <h2 className="text-2xl font-bold mb-4">Available Services</h2>
        <div className="space-y-4">
          {provider.services?.map(
            (svc: {
              id: number;
              name: string;
              description: string;
              effectiveDuration: number;
              effectivePrice: number;
            }) => (
              <div
                key={svc.id}
                className="flex items-center justify-between p-4 border rounded-xl hover:border-black transition"
              >
                <div>
                  <h3 className="font-semibold text-lg">{svc.name}</h3>
                  {svc.description && (
                    <p className="text-sm text-gray-500 mb-1">
                      {svc.description}
                    </p>
                  )}
                  <span className="text-xs text-gray-500 font-medium">
                    {svc.effectiveDuration} mins
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">
                    ${Number(svc.effectivePrice).toFixed(2)}
                  </span>
                  <Link
                    href={`/book?providerId=${provider.id}&serviceId=${svc.id}`}
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition"
                  >
                    Book
                  </Link>
                </div>
              </div>
            ),
          )}

          {(!provider.services || provider.services.length === 0) && (
            <p className="text-gray-500 py-6">
              No services are currently assigned to this provider.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
