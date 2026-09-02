/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: isExport ? 'export' : undefined,
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  images: isExport ? { unoptimized: true } : undefined,
  headers: isExport ? undefined : async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'microphone=(self), camera=(), geolocation=(self)',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: data:; connect-src 'self' https://*.trycloudflare.com https://*.pages.dev https://eutils.ncbi.nlm.nih.gov https://nominatim.openstreetmap.org https://overpass-api.de https://api.tavily.com https://api.groq.com https://generativelanguage.googleapis.com wss: ws:; worker-src 'self' blob:; frame-ancestors 'none';",
        },
      ],
    },
    {
      source: '/audio-worklet-processor.js',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/javascript; charset=utf-8',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
  rewrites: isExport ? undefined : async () => [
    {
      source: '/api/py/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ],
};

export default nextConfig;
