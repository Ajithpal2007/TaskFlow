/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🟢 Fixed for Next.js 14.2
  experimental: {
    serverComponentsExternalPackages: ['ws', '@neondatabase/serverless'],
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // 🟢 Whitelist Google Avatars
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io", 
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      }
    ],
  },
  transpilePackages: ['@repo/ui', '@repo/database', 'auth'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/auth/:path*',
      },
    ];
  },
};

export default nextConfig;