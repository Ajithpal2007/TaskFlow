/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/database', 'auth'],
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:4000/api/auth/:path*',
      },
    ];
  },
};

export default nextConfig;