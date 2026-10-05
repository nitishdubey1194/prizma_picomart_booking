import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { getProviders } from "@/lib/api";

interface Provider {
  id: string | number;
  name: string;
  category: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const businessName = titleCase(subdomain);

  return {
    title: `Meet the Specialists | ${businessName}`,
    description: `Browse active specialists and providers at ${businessName}.`,
  };
}

export default async function ProvidersPage({ params }: PageProps) {
  const { subdomain } = await params;
  const businessName = titleCase(subdomain);
  const isDev = process.env.NODE_ENV === "development";
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? "localhost:3000" : "picomart.in");
  const base = `${isDev ? "http" : "https"}://${subdomain}.${rootDomain}`;

  let providers: Provider[] = [];
  let loadError = false;

  try {
    providers = await getProviders(subdomain);
  } catch {
    loadError = true;
  }

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <Nav businessName={businessName} base={base} isProvider={false} isVendor={false} />
      
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-ink/10 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brass">Our team</p>
            <h1 className="mt-2 font-display text-3xl font-medium text-ink sm:text-4xl">
              Meet the specialists
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink/65">
              Browse the active providers at {businessName} and choose who you would like to see.
            </p>
          </div>
          <span className="font-mono text-xs text-ink/50">
            {providers.length} {providers.length === 1 ? "provider" : "providers"}
          </span>
        </div>

        {loadError ? (
          <p role="alert" className="py-12 text-sm text-ink/65">
            Providers could not be loaded. Please try again shortly.
          </p>
        ) : providers.length === 0 ? (
          <p className="py-12 text-sm text-ink/65">
            No active providers are available right now.
          </p>
        ) : (
          <ul className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => {
              const initials =
                provider.name
                  ?.split(/\s+/)
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "?";

              return (
                <li
                  key={provider.id}
                  className="flex min-h-64 flex-col border border-ink/10 bg-white p-5"
                >
                  <div className="flex items-center gap-4">
                    {provider.avatarUrl ? (
                      <Image
                        src={provider.avatarUrl}
                        alt=""
                        aria-hidden="true"
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brass/10 font-display text-lg text-ink"
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl font-medium text-ink">
                        {provider.name}
                      </h2>
                      <p className="mt-1 truncate text-sm text-ink/65">
                        {provider.title || titleCase(provider.category || "")}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ink/65">
                    {provider.bio || titleCase(provider.category || "")}
                  </p>

                  <Link
                    href={`/assistant?providerId=${provider.id}`}
                    className="mt-5 inline-flex min-h-11 items-center justify-center bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Book with {provider.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}