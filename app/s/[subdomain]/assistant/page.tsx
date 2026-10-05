import { Nav } from "@/components/Nav";
import { ChatBookingAssistant } from "./ChatBookingAssistant";

interface AssistantPageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AssistantPage({
  params,
  searchParams,
}: AssistantPageProps) {
  const { subdomain } = await params;
  const sp = await searchParams;

  // Case-insensitive query param matching (e.g. ?providerid=7, ?providerId=7, ?PROVIDERID=7)
  const providerKey = Object.keys(sp).find(
    (key) => key.toLowerCase() === "providerid"
  );
  const rawProviderId = providerKey ? sp[providerKey] : undefined;
  const resolvedProviderId = Array.isArray(rawProviderId)
    ? rawProviderId[0]
    : rawProviderId;

  const parsedId = Number(resolvedProviderId);
  const initialProviderId =
    Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;

  const businessName = titleCase(subdomain);
  const isDev = process.env.NODE_ENV === "development";
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
    (isDev ? "localhost:3000" : "picomart.in");
  const base = `${isDev ? "http" : "https"}://${subdomain}.${rootDomain}`;

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <Nav
        businessName={businessName}
        base={base}
        isProvider={false}
        isVendor={false}
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-7 border-b border-ink/10 pb-6">
          <p className="font-mono text-xs uppercase tracking-widest text-brass">
            Booking assistant
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink sm:text-4xl">
            Let’s plan your visit
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/65">
            Choose a service, specialist, date, and available time. Your
            appointment is confirmed after you review it.
          </p>
        </header>
        <ChatBookingAssistant
          tenantSlug={subdomain}
          base={base}
          initialProviderId={initialProviderId}
        />
      </main>
    </div>
  );
}