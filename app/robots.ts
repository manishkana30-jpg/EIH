import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: 'https://eih-chi.vercel.app/sitemap.xml',
    host: 'https://eih-chi.vercel.app',
  };
}
