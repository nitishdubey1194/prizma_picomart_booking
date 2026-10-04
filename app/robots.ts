import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isDev = process.env.NODE_ENV === 'development';
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? (isDev ? 'localhost:3000' : 'picomart.in');
  const protocol = isDev ? 'http' : 'https';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: `${protocol}://${rootDomain}/sitemap.xml`,
  };
}