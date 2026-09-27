import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { headers } from 'next/headers';
import { getQueryClient } from '@/lib/get-query-client';
import { queryKeys } from '@/lib/queries';
import { getProviders, getServices, getAvailability } from '@/lib/api';
import type { Provider, Service } from '@/lib/api';
import { StructuredData } from '@/components/StructuredData';
import { TenantHomeClient } from './TenantHomeClient';

function titleCase(slug: string) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function TenantHome({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const businessName = titleCase(subdomain);
  const nonce = (await headers()).get('x-nonce') ?? '';
  const isDev = process.env.NODE_ENV === 'development';
  const base = isDev
    ? `http://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'}`
    : `https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'picomart.in'}`;

  const queryClient = getQueryClient();

  const [providers, services]: [Provider[], Service[]] = await Promise.all([
    queryClient
      .fetchQuery({ queryKey: queryKeys.providers(subdomain), queryFn: () => getProviders(subdomain) })
      .catch(() => []),
    queryClient
      .fetchQuery({ queryKey: queryKeys.services(subdomain), queryFn: () => getServices(subdomain) })
      .catch(() => []),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const firstProviderId = providers[0]?.id ?? null;
  const serviceId = services[0]?.id ?? null;
  if (firstProviderId !== null) {
    await queryClient
      .prefetchQuery({
        queryKey: queryKeys.availability(subdomain, firstProviderId, today),
        queryFn: () => getAvailability(subdomain, firstProviderId, today, serviceId),
      })
      .catch(() => {});
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StructuredData
        nonce={nonce}
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: businessName,
          url: `https://${subdomain}.picomart.in`,
          makesOffer: services.map((s) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: s.name },
            price: s.price,
            priceCurrency: 'INR',
          })),
        }}
      />
      <TenantHomeClient
        subdomain={subdomain}
        base={base}
        businessName={businessName}
        firstProviderId={firstProviderId}
        today={today}
        serviceId={serviceId}
      />
    </HydrationBoundary>
  );
}