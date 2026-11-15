import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://traditionsbytiya.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/shipping-policy',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Fetch product slugs if server reachable
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products?limit=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.products)) {
      const productRoutes = data.products.map((p: any) => ({
        url: `${BASE_URL}/product/${p.slug}`,
        lastModified: p.updatedAt || new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
      return [...routes, ...productRoutes];
    }
  } catch {
    // Fallback to static routes
  }

  return routes;
}

