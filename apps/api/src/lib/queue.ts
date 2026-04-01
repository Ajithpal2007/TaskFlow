import { Queue } from 'bullmq';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

// 🟢 THE FIX: Loudly crash if the URL is missing, don't silently fallback to localhost!
if (!redisUrl) {
  throw new Error("❌ CRITICAL: REDIS_URL is missing from your environment variables!");
}

// 1. Connect to Upstash securely
export const redisConnection = new Redis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null, // Required by BullMQ
  tls: {
    rejectUnauthorized: false // Required for Upstash Serverless Redis
  }
});

// 2. Create the Queue
export const notificationQueue = new Queue('notifications', { connection: redisConnection });
export const emailQueue = new Queue('emails', { connection: redisConnection });
export const canvasQueue = new Queue('canvas', { connection: redisConnection });
export const cleanupQueue = new Queue('cleanup', { connection: redisConnection });