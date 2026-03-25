/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // 🟢 Whitelist Google Avatars
      },
      // You might also want to add GitHub avatars if you use GitHub login!
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      }
    ],
  },
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