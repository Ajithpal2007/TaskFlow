import { Worker } from 'bullmq';
import { redisConnection } from '../lib/queue';
import { sendInviteEmail,sendDocumentInviteEmail } from "../services/email.service.js";

export const emailWorker = new Worker(
  'emails', // Listen to the 'emails' queue
  async (job) => {
    console.log(`[EmailWorker] Processing job: ${job.name} (ID: ${job.id})`);

    try {
      if (job.name === 'workspace-invite') {
        const { toEmail, inviterName, workspaceName, token } = job.data;

        // 🟢 Execute the slow Nodemailer function safely in the background
        await sendInviteEmail(
          toEmail,
          inviterName,
          workspaceName,
          token
        );

        console.log(`✅ Invite email successfully sent to ${toEmail}`);
      }

      if (job.name === 'document-invite') {
        const { 
          email, 
          inviterName, 
          documentTitle, 
          workspaceId, 
          docId, 
          accessLevel, 
          isNewUser 
        } = job.data;

        // Execute the slow Nodemailer function in the background
        await sendDocumentInviteEmail(
          email, 
          inviterName, 
          documentTitle, 
          workspaceId, 
          docId, 
          accessLevel, 
          isNewUser
        );

        console.log(`✅ Document invite email successfully sent to ${email}`);
      }

    
      


    } catch (error) {
      console.error(`❌ Failed to send email for job ${job.id}:`, error);
      throw error; // Throwing triggers the BullMQ exponential backoff retry!
    }
  },
  { connection: redisConnection }
);

// Logging listeners
emailWorker.on('completed', (job) => console.log(`🏁 Job ${job.id} completed.`));
emailWorker.on('failed', (job, err) => console.error(`⚠️ Job ${job?.id} failed: ${err.message}`));