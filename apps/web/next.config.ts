import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@atomquest/shared'],
  experimental: {
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
};

export default nextConfig;
