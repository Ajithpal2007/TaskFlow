import { AccessToken } from "livekit-server-sdk";
import { prisma } from "@repo/database";
import { requireAuth } from "../../middleware/require-auth.js";
import { FastifyInstance } from "fastify";

export default async function callRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/channels/:channelId/huddle",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const userName = (request as any).user.name; // Assuming you have name in auth context
      const { channelId } = request.params as { channelId: string };

      try {
        // 🟢 1. FETCH THE WORKSPACE ID SECURELY FROM THE DATABASE
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          select: { workspaceId: true },
        });

        if (!channel) {
          return reply.code(404).send({ message: "Channel not found" });
        }

        // 2. Check if an active Huddle already exists for this channel
        let call = await prisma.call.findFirst({
          where: {
            channelId,
            type: "HUDDLE",
            status: "ONGOING",
          },
        });

        // 3. If no active call, create a new one using the real workspaceId!
        if (!call) {
          const livekitRoomName = `huddle-${channelId}-${Date.now()}`;
          
          call = await prisma.call.create({
            data: {
              livekitRoomName,
              type: "HUDDLE",
              status: "ONGOING",
              workspaceId: channel.workspaceId, // 🟢 FIXED: Using the real DB value
              channelId,
              hostId: userId,
              startedAt: new Date(),
            },
          });
        }

        // 4. Add or update the user in the CallParticipant table (Audit Trail)
        await prisma.callParticipant.upsert({
          where: {
            callId_userId: { callId: call.id, userId },
          },
          update: {
            joinedAt: new Date(),
            leftAt: null, // Reset leftAt if they are re-joining
          },
          create: {
            callId: call.id,
            userId,
            role: call.hostId === userId ? "HOST" : "PARTICIPANT",
          },
        });

        // 5. GENERATE THE LIVEKIT TOKEN
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
          throw new Error("LiveKit credentials are not configured");
        }

        // Create a secure ticket for this specific user to join this specific room
        const at = new AccessToken(apiKey, apiSecret, {
          identity: userId,
          name: userName,
        });

        // Grant them permissions
        at.addGrant({
          roomJoin: true,
          room: call.livekitRoomName,
          canPublish: true,      // Can share audio/video
          canSubscribe: true,    // Can hear/see others
        });

        // Use standard sync toJwt() or await if it returns a promise in your SDK version
        const token = await at.toJwt();

        // 6. Return the token and room info to React!
        return reply.code(200).send({
          success: true,
          data: {
            token,
            roomName: call.livekitRoomName,
            wsUrl: process.env.LIVEKIT_URL,
          },
        });

      } catch (error) {
        console.error("Huddle creation failed:", error);
        return reply.code(500).send({ message: "Failed to join huddle" });
      }
    }
  );
}