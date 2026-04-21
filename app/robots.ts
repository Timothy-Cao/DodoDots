import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/builder/'] }],
    sitemap: 'https://dodo-dots.vercel.app/sitemap.xml',
  };
}
