import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://dodo-dots.vercel.app/', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://dodo-dots.vercel.app/daily', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://dodo-dots.vercel.app/tutorial', changeFrequency: 'monthly', priority: 0.5 },
  ];
}
