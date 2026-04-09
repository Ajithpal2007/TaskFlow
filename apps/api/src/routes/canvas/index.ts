import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { requireAuth } from "../../middleware/require-auth.js";
import { Liveblocks, WebhookHandler } from "@liveblocks/node";
import crypto from "crypto";

import { canvasQueue, cleanupQueue } from "../../lib/queue";

import { requireWorkspaceRole } from "../../middleware/require-role";

// Initialize the Liveblocks Node SDK using your secure backend key
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export default async function canvasRoutes(fastify: FastifyInstance) {
  // 🟢 1. CREATE A NEW WHITEBOARD
  // This matches the apiClient.post(`/canvas/workspaces/${workspaceId}`) from your frontend
 fastify.post(
  "/workspaces/:workspaceId/canvas", // 🟢 FIX 2: Added /canvas to the route URL
  {
    preHandler: [
      requireAuth,
      requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"]),
    ],
  },
  async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const { title } = request.body as { title?: string }; // Make title optional just in case
    const userId = (request as any).user.id;

    try {
      // 1. Fetch the workspace and the current whiteboard count
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { _count: { select: { whiteboards: true } } },
      });

      // 🟢 FIX 1: If the workspace doesn't exist, kick them out immediately!
      if (!workspace) {
        return reply.code(404).send({ message: "Workspace not found" });
      }

      // 2. Check their plan status safely
      const isPro =
        workspace.planId === "PRO" &&
        workspace.currentPeriodEnd &&
        new Date() < workspace.currentPeriodEnd;

      // 3. THE FREEMIUM CHECK
      if (!isPro && workspace._count.whiteboards >= 3) {
        return reply.code(402).send({
          error: "Payment Required",
          message: "Free workspaces are limited to 3 whiteboards. Upgrade to Pro for unlimited!",
        });
      }

      // 4. Generate a unique, unguessable Room ID for Liveblocks
      const roomId = `room_${crypto.randomBytes(16).toString("hex")}`;

      // 5. Save it to your PostgreSQL database
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
  }
);

  // 🟢 2. LIVEBLOCKS AUTHENTICATION ENDPOINT
  // 🟢 LIVEBLOCKS AUTHENTICATION WITH ENFORCED RBAC
  fastify.post(
    "/liveblocks-auth",
    {
      preHandler: [
        requireAuth,
       
      ],
    },
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
              workspaceId: board.workspaceId,
            },
          },
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
                projectId: board.projectId,
              },
            },
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
          return reply.code(403).send({
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
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"]),
      ],
    },
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
    { config: { rawBody: true } },
    async (request, reply) => {
      const webhookSecret = process.env.LIVEBLOCKS_WEBHOOK_SECRET;
      if (!webhookSecret) return reply.code(500).send("Webhook secret missing");

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

      if (event.type === "ydocUpdated") {
        const roomId = event.data.roomId;

        // 🟢 FIRE AND FORGET! Send to BullMQ
        await canvasQueue.add(
          "sync-board",
          { roomId },
          {
            // If they draw 50 times in 5 seconds, this overwrites the job
            // so we only download the canvas ONCE when they finish!
            jobId: `sync-${roomId}`,
            delay: 5000,
            removeOnComplete: true,
          },
        );
      }

      // Instantly return 200 so Liveblocks is happy
      return reply.code(200).send("Webhook processed");
    },
  );

  // 🟢 FIXED DELETE ROUTE
  fastify.delete(
    "/workspaces/:workspaceId/boards/:roomId", // 🟢 Added workspaceId to the path!
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN"])] },
    async (request, reply) => {
      const { roomId } = request.params as { roomId: string };

      try {
        await prisma.whiteboard.delete({
          where: { roomId: roomId },
        });

        await cleanupQueue.add("delete-liveblocks-room", {
          roomId: roomId,
        });

        return reply
          .code(200)
          .send({ message: "Whiteboard permanently deleted" });
      } catch (error) {
        console.error("Failed to delete whiteboard:", error);
        return reply
          .code(500)
          .send({ message: "Failed to delete whiteboard", error });
      }
    },
  );
}

