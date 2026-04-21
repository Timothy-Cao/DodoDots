import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DodoDots',
    short_name: 'DodoDots',
    description: 'A Tron-styled graph puzzle. Trace every dot, every line, every night.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#05070d',
    theme_color: '#05070d',
    categories: ['games', 'puzzle'],
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
