import { Worker } from "bullmq"; // 🟢 Removed the invalid 'tryCatch' import
import { redisConnection } from "../lib/queue";
import { prisma } from "@repo/database";

export const canvasWorker = new Worker(
  "canvas",
  async (job) => {
    if (job.name === "sync-board") {
      const { roomId } = job.data;
      console.log(`[CanvasWorker] Downloading snapshot for room: ${roomId}`);

      try {
        // 1. Download from Liveblocks
        const response = await fetch(
          `https://api.liveblocks.io/v2/rooms/${roomId}/ydoc`,
          {
            headers: {
              Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
            },
          },
        );

        // 🟢 THE DIAGNOSTIC FIX: If Liveblocks rejects us, read the exact error message!
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Liveblocks API Error (${response.status}): ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Ydoc = Buffer.from(arrayBuffer).toString("base64");

        // 2. Save securely in Neon
        await prisma.whiteboard.update({
          where: { roomId: roomId },
          data: {
            latestSnapshot: { yjsData: base64Ydoc },
          },
        });

        console.log(`✅ Successfully backed up canvas: ${roomId}`);
        
      } catch (error) {
        // 🟢 This will now catch BOTH Liveblocks fetch errors AND Prisma database errors!
        console.error(`❌ WORKER CRASHED [Room: ${roomId}]:`, error);
        
        // Throw the error so BullMQ knows it failed and can automatically retry later
        throw error; 
      }
    }
  },
  { connection: redisConnection },
);