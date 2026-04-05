import { FastifyPluginAsync } from "fastify";
import { prisma } from "@repo/database";

const slackRoutes: FastifyPluginAsync = async (fastify) => {

  // 🟢 Define dynamic URLs at the top so both routes can use them
  const apiUrl = process.env.API_URL || "http://localhost:4000";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  // Dynamically build the exact callback URI we gave to Slack
  const redirectUri = `${apiUrl}/api/integrations/slack/callback`;

  // 1. Redirect to Slack's authorization page
  fastify.get("/connect/:workspaceId", async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };

    const clientId = process.env.SLACK_CLIENT_ID;

    

    // We pass the workspaceId as the "state" so we remember who they are when they come back!
    // 🟢 Add incoming-webhook to the scopes!
   const redirectUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=chat:write,chat:write.public,incoming-webhook&state=${workspaceId}&redirect_uri=${redirectUri}`;

    return reply.redirect(redirectUrl);
  });

  // 2. Slack sends them back here with a secret code
  fastify.get("/callback", async (request, reply) => {
    const { code, state: workspaceId } = request.query as {
      code: string;
      state: string;
    };

  

    try {
      // Exchange the code for an Access Token
      const response = await fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error("❌ Slack API Error:", data.error);
        return reply.redirect(
          `${frontendUrl}/dashboard/${workspaceId}/settings?slack=error`,
        );
      }

      // Save the token to their workspace!
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          slackAccessToken: data.access_token,
          slackChannelId: data.incoming_webhook?.channel_id,
        },
      });

      console.log("✅ Slack Connected Successfully!");
      return reply.redirect(
        `${frontendUrl}/dashboard/${workspaceId}/settings?slack=success`,
      );
    } catch (error) {
      // 🟢 This will catch any DB or Server errors!
      console.error("❌ Fastify Server Crash:", error);
      return reply.status(500).send("Internal Server Error during Slack OAuth");
    }
  });
};

export default slackRoutes;
