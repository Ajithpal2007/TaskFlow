import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/database";
import { redisConnection } from "../../../apps/api/src/lib/queue";

export const getAuth = () => betterAuth({
    baseURL: process.env.API_URL || "http://localhost:4000",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            // Get values directly from process.env here
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
   
  
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["http://localhost:3000"],
 advanced: {
    useSecureCookies: false, // Must be false for localhost (HTTP)
  },

  secondaryStorage: {
    get: async (key) => {
      const value = await redisConnection.get(key);
      return value || null;
    },
    set: async (key, value, ttl) => {
      if (ttl) {
        // 'EX' tells Redis this is an expiry time in seconds
        await redisConnection.set(key, value, "EX", ttl);
      } else {
        await redisConnection.set(key, value);
      }
    },
    delete: async (key) => {
      await redisConnection.del(key);
    },
  },

  // 🟢 2. Tell the Rate Limiter to use the secondary storage!
  rateLimit: {
    storage: "secondary-storage",
  },
  
});

export const auth = getAuth();

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;