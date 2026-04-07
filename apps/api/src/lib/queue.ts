import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

// 🟢 Loudly crash if the URL is missing
if (!redisUrl) {
  throw new Error("❌ CRITICAL: REDIS_URL is missing from your environment variables!");
}

// 1. Connect to Aiven securely
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Still strictly required by BullMQ!
  
  // 🟢 THE AIVEN FIX: Turn on strict TLS. 
  // We no longer need 'rejectUnauthorized: false' because Aiven has valid certs.
  tls: {} 
});

redisConnection.on("connect", () => {
  console.log("🟢 Connected to Aiven Redis successfully!");
});

redisConnection.on("error", (err) => {
  console.error("🔴 Aiven Redis Error:", err);
});

// 2. Create the Queues (Zero changes needed here!)
export const notificationQueue = new Queue('notifications', { connection: redisConnection });
export const emailQueue = new Queue('emails', { connection: redisConnection });
export const canvasQueue = new Queue('canvas', { connection: redisConnection });
export const cleanupQueue = new Queue('cleanup', { connection: redisConnection });