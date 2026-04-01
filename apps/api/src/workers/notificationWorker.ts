import { Worker } from 'bullmq';
import { redisConnection } from '../lib/queue'; // The secure Upstash connection
import { NotificationType, prisma } from '@repo/database'; // Your Prisma client

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name} (ID: ${job.id})`);

    try {
      if (job.name === 'task-assigned') {
        const { taskId, newAssigneeId, assignerId, taskTitle } = job.data;

        // 1. Fetch the assigner's name (Offloaded from the main API!)
        const assigner = await prisma.user.findUnique({ 
          where: { id: assignerId }
        });

        // 2. Create the In-App Database Notification
        await prisma.notification.create({
          data: {
            userId: newAssigneeId,
            type: "ASSIGNED",
            taskId: taskId,
            content: `${assigner?.name || "Someone"} assigned you to "${taskTitle}"`,
          }
        });

       

        console.log(`✅ Successfully processed assignment notification for task ${taskId}`);
      }


      // --- 🟢 NEW: The Mentions Block ---
      if (job.name === 'user-mentioned') {
        const { taskId, actorName, mentionedUserIds, snippet } = job.data;

        // Map the IDs into the Prisma format
        const notificationsData = mentionedUserIds.map((mentionedId: string) => ({
          userId: mentionedId, 
          taskId: taskId,      
          type: NotificationType.MENTIONED, 
          content: `${actorName} mentioned you: "${snippet}"`, 
        }));

        // Do the bulk insert in the background!
        await prisma.notification.createMany({
          data: notificationsData,
        });

        // (Future) Loop through mentionedUserIds and fire WebSockets
        // mentionedUserIds.forEach(id => socket.to(id).emit('ping'));

        console.log(`✅ Created ${mentionedUserIds.length} mention notifications for task ${taskId}`);
      }

    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);
      throw error; // Throwing triggers BullMQ's automatic retry logic
    }
  },
  { connection: redisConnection }
);

// Listeners for logging
notificationWorker.on('completed', (job) => {
  console.log(`🏁 Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`⚠️ Job ${job?.id} failed with error: ${err.message}`);
});