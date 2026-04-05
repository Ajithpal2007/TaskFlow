import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@repo/database";
import { redisConnection,emailQueue } from "../../../apps/api/src/lib/queue";

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
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000",
    "https://task-flow-web-seven.vercel.app"],
 advanced: {
    // Force cookies to be sent across different domains securely
    defaultCookieAttributes: {
      sameSite: "none", // Critical for cross-domain (Vercel -> Render)
      secure: true,     // Required when sameSite is "none"
    },
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

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log(`[BetterAuth] New user created: ${user.email}. Queuing Welcome Email...`);
          
          await emailQueue.add(
            'welcome-email',
            { 
              email: user.email, 
              // Better Auth saves the name if they use Google/Github, otherwise fallback to "there"
              name: user.name || "there" 
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: true,
            }
          );
        }
      }
    }
  }
  
});

export const auth = getAuth();

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;