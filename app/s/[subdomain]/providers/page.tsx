import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { getProviders } from '@/lib/api';
import ProvidersDirectory, { Provider } from '@/components/ProvidersDirectory';

function titleCase(slug: string) {
  return slug
    .split(/[-_ ]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const businessName = titleCase(subdomain);

  return {
    title: `Our Team & Specialists | ${businessName}`,
    description: `Explore specialists and book your visit at ${businessName}.`,
  };
}

export default async function ProvidersPage({ params }: PageProps) {
  const { subdomain } = await params;
  const businessName = titleCase(subdomain);
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const base = `${isDev ? 'http' : 'https'}://${subdomain}.${rootDomain}`;

  let providers: Provider[] = [];
  let loadError = false;

  try {
    providers = await getProviders(subdomain);
  } catch {
    loadError = true;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 antialiased selection:bg-stone-900 selection:text-white">
      <Nav businessName={businessName} base={base} isProvider={false} isVendor={false} />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Editorial Hero Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/60 text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-3">
              Certified Practitioners
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-950 font-display">
              Meet our team
            </h1>
            <p className="mt-2.5 max-w-xl text-sm sm:text-base text-stone-600 leading-relaxed">
              Find the right practitioner for your next appointment at {businessName}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3.5 py-1.5 rounded-full border border-stone-200 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-stone-700">
              {providers.length} {providers.length === 1 ? 'Specialist' : 'Specialists'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        {loadError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50/50 p-8 text-center text-sm text-red-700">
            We were unable to load specialists right now. Please refresh or try again later.
          </div>
        ) : providers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <p className="text-base font-semibold text-stone-900">No specialists currently listed</p>
            <p className="mt-1 text-xs text-stone-500">Please check back soon for availability.</p>
          </div>
        ) : (
          <ProvidersDirectory providers={providers} />
        )}
      </main>
    </div>
  );
}