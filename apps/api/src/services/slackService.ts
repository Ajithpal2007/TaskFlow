// apps/api/src/services/slackService.ts
import { prisma } from "@repo/database";

export const slackService = {
  async notifyWorkspace(workspaceId: string, message: string) {
    try {
      // 1. Get their Slack details from the database
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { slackAccessToken: true, slackChannelId: true }
      });

      // If they haven't connected Slack, exit silently
      if (!workspace?.slackAccessToken || !workspace?.slackChannelId) return;

      // 2. Send the message to Slack!
      await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${workspace.slackAccessToken}`
        },
        body: JSON.stringify({
          channel: workspace.slackChannelId,
          text: message, 
        })
      });
    } catch (error) {
      console.error("Failed to send Slack message:", error);
      // We don't throw the error because we don't want a Slack failure 
      // to crash the user's TaskFlow experience!
    }
  }
};