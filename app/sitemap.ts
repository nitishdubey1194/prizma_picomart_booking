import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const protocol = isDev ? 'http' : 'https';
  const baseUrl = `${protocol}://${rootDomain}`;
  const apiOrigin =
    process.env.NEXT_PUBLIC_API_ORIGIN ??
    (isDev ? 'http://localhost:3000' : 'https://api.picomart.in');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const [servicesRes, providersRes] = await Promise.all([
      fetch(`${apiOrigin}/api/services`, { next: { revalidate: 86400 } }),
      fetch(`${apiOrigin}/api/providers`, { next: { revalidate: 86400 } }),
    ]);

    let serviceRoutes: MetadataRoute.Sitemap = [];
    let providerRoutes: MetadataRoute.Sitemap = [];

    if (servicesRes.ok) {
      const servicesData = await servicesRes.json();
      const items: Array<{ slug: string; updatedAt?: string }> =
        servicesData.services ?? servicesData.data ?? servicesData ?? [];

      serviceRoutes = items.map((s) => ({
        url: `${baseUrl}/book?service=${s.slug}`,
        lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }

    if (providersRes.ok) {
      const providersData = await providersRes.json();
      const items: Array<{ slug: string; updatedAt?: string }> =
        providersData.providers ?? providersData.data ?? providersData ?? [];

      providerRoutes = items.map((p) => ({
        url: `${baseUrl}/providers/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }

    return [...staticRoutes, ...providerRoutes, ...serviceRoutes];
  } catch (err) {
    console.error('Failed to generate sitemap from public endpoints:', err);
    return staticRoutes;
  }
}