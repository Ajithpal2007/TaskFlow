import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { requireAuth } from "../../middleware/require-auth.js";
import { Liveblocks } from "@liveblocks/node";
import crypto from "crypto";
import { WebhookHandler } from "@liveblocks/node";

// Initialize the Liveblocks Node SDK using your secure backend key
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export default async function canvasRoutes(fastify: FastifyInstance) {
  // 🟢 1. CREATE A NEW WHITEBOARD
  // This matches the apiClient.post(`/canvas/workspaces/${workspaceId}`) from your frontend
  fastify.post(
    "/workspaces/:workspaceId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { title } = request.body as { title: string };
      const userId = (request as any).user.id;

      try {
        // Generate a unique, unguessable Room ID for Liveblocks
        const roomId = `room_${crypto.randomBytes(16).toString("hex")}`;

        // Save it to your PostgreSQL database via Prisma
        const newBoard = await prisma.whiteboard.create({
          data: {
            title: title || "Untitled Canvas",
            workspaceId,
            roomId,
            createdById: userId,
          },
        });

        return reply.code(200).send({ success: true, data: newBoard });
      } catch (error) {
        console.error("Failed to create whiteboard:", error);
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  );

  // 🟢 2. LIVEBLOCKS AUTHENTICATION ENDPOINT
  // 🟢 LIVEBLOCKS AUTHENTICATION WITH ENFORCED RBAC
  fastify.post(
    "/liveblocks-auth",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const user = (request as any).user;
      const { room } = request.body as { room: string };

      if (!user || !user.id || !room) {
        return reply.code(400).send({ message: "Invalid request" });
      }

      try {
        // 1. Fetch the Whiteboard and its settings
        const board = await prisma.whiteboard.findUnique({
          where: { roomId: room },
        });

        if (!board) {
          return reply.code(404).send({ message: "Whiteboard not found" });
        }

        // 2. Default Access States
        let canView = false;
        let canEdit = false;

        // 3. Workspace Level Permissions (Base Inheritance)
        // 3. Workspace Level Permissions
        const workspaceMember = await prisma.workspaceMember.findUnique({
          where: {
            // 🟢 MATCHES YOUR SCHEMA: userId first, workspaceId second
            userId_workspaceId: { 
              userId: user.id, 
              workspaceId: board.workspaceId 
            }
          }
        });

        if (workspaceMember) {
          canView = true;
          // Owners, Admins, and Members can edit by default. Guests cannot.
          if (["OWNER", "ADMIN", "MEMBER"].includes(workspaceMember.role)) {
            canEdit = true;
          }
        }

        // 4. Project Level Permissions (Overrides Workspace)
        
        if (board.projectId) {
          const projectMember = await prisma.projectMember.findUnique({
            where: {
              // 🟢 MATCHES YOUR SCHEMA: userId first, projectId second
              userId_projectId: { 
                userId: user.id, 
                projectId: board.projectId 
              }
            }
          });
          
          

          if (projectMember) {
            canView = true;
            if (["MANAGER", "CONTRIBUTOR"].includes(projectMember.role)) {
              canEdit = true;
            } else if (projectMember.role === "VIEWER") {
              canEdit = false; // Strictly downgrade to view-only for this project
            }
          }
        }

        // 5. Global Board Toggles
        if (board.isPublic) {
          canView = true; // Anyone logged into the app with the link can view
        }

        if (board.isLocked) {
          canEdit = false; // Absolute override: No one can edit a locked board
        }

        // 6. Final Access Check
        if (!canView) {
          return reply
            .code(403)
            .send({
              message: "Forbidden: You do not have access to this board.",
            });
        }

        // 7. Issue the specific Liveblocks token
        const session = liveblocks.prepareSession(user.id, {
          userInfo: {
            name: user.name || "Anonymous User",
            avatar: user.image || "https://liveblocks.io/avatars/avatar-1.png",
          },
        });

        // Apply the resolved permission!
        const accessLevel = canEdit ? session.FULL_ACCESS : session.READ_ACCESS;
        session.allow(room, accessLevel);

        const { status, body } = await session.authorize();
        return reply.code(status).send(JSON.parse(body));
      } catch (error) {
        console.error("Liveblocks Auth Error:", error);
        return reply.code(500).send({ message: "Authentication failed" });
      }
    },
  );

  // 🟢 3. UPDATE WHITEBOARD TITLE
  // 🟢 UPDATE WHITEBOARD TITLE & THUMBNAIL
  fastify.patch(
    "/workspaces/:workspaceId/boards/:boardId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId, boardId } = request.params as {
        workspaceId: string;
        boardId: string;
      };

      // Make both optional in the type definition
      const { title, imageUrl } = request.body as {
        title?: string;
        imageUrl?: string;
      };

      // Ensure they sent at least ONE thing to update
      if (!title && !imageUrl) {
        return reply
          .code(400)
          .send({ message: "Nothing to update. Provide a title or imageUrl." });
      }

      try {
        const updatedBoard = await prisma.whiteboard.update({
          where: {
            id: boardId,
            workspaceId: workspaceId,
          },
          data: {
            // 🟢 Dynamically apply whichever fields were actually sent!
            ...(title && { title: title.trim() }),
            ...(imageUrl && { imageUrl: imageUrl }),
          },
        });

        return reply.code(200).send({ success: true, data: updatedBoard });
      } catch (error) {
        console.error("Failed to update whiteboard:", error);
        return reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  );

  fastify.post(
    "/webhooks/liveblocks",
    { config: { rawBody: true } }, // Tells fastify-raw-body to capture the raw text here
    async (request, reply) => {
      // 1. Verify the webhook signature
      const webhookSecret = process.env.LIVEBLOCKS_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return reply.code(500).send("Webhook secret is missing from .env");
      }

      const webhookHandler = new WebhookHandler(webhookSecret);
      const headers = request.headers as Record<string, string>;
      const rawBody = (request as any).rawBody;

      let event;
      try {
        event = webhookHandler.verifyRequest({ headers, rawBody });
      } catch (error) {
        console.error("Webhook signature verification failed");
        return reply.code(400).send("Invalid signature");
      }

      // 2. Listen specifically for Y.js document updates
      if (event.type === "ydocUpdated") {
        const roomId = event.data.roomId;

        try {
          // 3. Download the actual binary Y.js state from Liveblocks
          const response = await fetch(
            `https://api.liveblocks.io/v2/rooms/${roomId}/ydoc`,
            {
              headers: {
                Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
              },
            },
          );

          if (!response.ok) throw new Error("Failed to fetch Ydoc");

          const arrayBuffer = await response.arrayBuffer();

          // 4. Convert the binary to a Base64 string for safe Postgres storage
          const base64Ydoc = Buffer.from(arrayBuffer).toString("base64");

          // 5. Save it securely in Neon!
          await prisma.whiteboard.update({
            where: { roomId: roomId },
            data: {
              latestSnapshot: { yjsData: base64Ydoc },
            },
          });

          console.log(`✅ Successfully backed up canvas: ${roomId}`);
        } catch (error) {
          console.error(`❌ Failed to backup canvas ${roomId}:`, error);
          // Return 200 anyway so Liveblocks doesn't keep retrying and crashing
        }
      }

      return reply.code(200).send("Webhook processed");
    },
  );
}
