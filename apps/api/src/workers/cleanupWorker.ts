import { Worker } from 'bullmq';
import { redisConnection } from '../lib/queue';
import { UTApi } from "uploadthing/server"; // Uploadthing's backend SDK
import { Liveblocks } from "@liveblocks/node";

// Initialize Uploadthing API
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! }); 

export const cleanupWorker = new Worker(
  'cleanup',
  async (job) => {
    if (job.name === 'delete-uploadthing-files') {
      const { fileUrls } = job.data as { fileUrls: string[] };
      console.log(`[CleanupWorker] Preparing to delete ${fileUrls.length} files...`);

      try {
        // 1. Uploadthing needs the "file key" (the random string at the end of the URL)
        // Example URL: https://utfs.io/f/abc-123.png -> Key: abc-123.png
        const fileKeys = fileUrls.map(url => {
          const parts = url.split('/');
          return parts[parts.length - 1]; // Grabs the last part of the URL
        });

        // 2. Ping Uploadthing to physically delete the files from AWS S3
        const response = await utapi.deleteFiles(fileKeys);

        if (response.success) {
          console.log(`✅ Successfully deleted ${fileKeys.length} files from Uploadthing.`);
        } else {
          console.error(`⚠️ Uploadthing deletion failed:`, response);
          throw new Error("Uploadthing API rejected the deletion request.");
        }
       
      } catch (error) {
        console.error(`❌ [CleanupWorker] Failed to delete files:`, error);
        throw error; // Triggers BullMQ's automatic retry!
      }
    }


    if (job.name === 'delete-liveblocks-room') {
      const { roomId } = job.data as { roomId: string };
      console.log(`[CleanupWorker] Preparing to delete Liveblocks room: ${roomId}`);

      try {
        // Ping Liveblocks to permanently destroy the room and its data
        await liveblocks.deleteRoom(roomId);
        console.log(`✅ Successfully deleted room ${roomId} from Liveblocks servers.`);
        
      } catch (error: any) {
        // If the room was already deleted or doesn't exist, just ignore the error
        if (error.status === 404) {
          console.log(`⚠️ Liveblocks room ${roomId} already deleted or not found. Skipping.`);
          return;
        }
        
        console.error(`❌ [CleanupWorker] Failed to delete Liveblocks room:`, error);
        throw error; // Triggers BullMQ's automatic retry
      }
    }

  },
  { connection: redisConnection }
);