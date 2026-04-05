import { PrismaClient } from "../generated/client/index.js"; // 🟢 ADD /index.js
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  console.log("[database] Creating new PrismaClient instance.");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL } as any);
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/client/index.js"; // 🟢 ADD /index.js