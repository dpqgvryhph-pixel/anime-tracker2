import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OniAnime Tracker',
    short_name: 'OniAnime',
    description: 'Anime statisztika dashboard',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#ff6b35',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
