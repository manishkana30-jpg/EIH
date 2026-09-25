/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: isExport ? 'export' : undefined,
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  env: {
    NEXT_PUBLIC_BUILD_TIME: process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()),
    NEXT_PUBLIC_APP_VERSION: '1.2.1',
  },
  images: isExport
    ? { unoptimized: true }
    : {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000,
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'eih-chi.vercel.app',
          },
        ],
      },
  headers: isExport ? undefined : async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
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
          value: 'microphone=(self), camera=(self), geolocation=(self)',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: data:; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws://localhost:8000 ws://127.0.0.1:8000 https://*.vercel.app https://eutils.ncbi.nlm.nih.gov https://nominatim.openstreetmap.org https://overpass-api.de https://api.tavily.com; worker-src 'self' blob:; frame-ancestors 'none';`,
        },
      ],
    },
    {
      source: '/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/(.*).(jpg|jpeg|png|svg|webp|ico|css|js|woff|woff2)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
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
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
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

