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
  transpilePackages: ['@repo/ui', '@repo/database', 'auth',"@repo/validators"],
  async rewrites() {
    // Dynamically choose the Render URL in production, or localhost in development
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/auth/:path*`, 
      },
    ];
  },
};

export default nextConfig;