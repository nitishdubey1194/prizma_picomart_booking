import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTenant } from '@/lib/api';
function titleCase(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain).catch(() => null);
  const businessName = tenant?.name ?? titleCase(subdomain);
  const isDev = process.env.NODE_ENV === 'development';
  const canonical = isDev
    ? `http://${subdomain}.localhost:3001`
    : `https://${subdomain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'picomart.in'}`;
  return {
    title: businessName,
    description: `Book an appointment with ${businessName} online in a few taps.`,
    alternates: { canonical },
  };
}

export default async function TenantLayout({children,params}: {children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);
  if (!tenant) notFound();
  return children;
}