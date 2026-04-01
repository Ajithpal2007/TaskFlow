import { FastifyInstance } from "fastify";
import { createWorkspaceSchema } from "@repo/validators";
import { workspaceService } from "../../services/workspace.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { tagService } from "../../services/tag.service.js";

import { analyticsService } from "../../services/analytics.service";
import { prisma, WorkspaceRole } from "@repo/database";

import { sendInviteEmail } from "../../services/email.service.js";
import crypto from "crypto";

import { requireWorkspaceRole } from "../../middleware/require-role";

import { emailQueue } from "../../lib/queue"; 

export default async function workspaceRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces
  fastify.post(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const result = createWorkspaceSchema.safeParse(request.body);
      if (!result.success)
        return reply.status(400).send({ error: result.error.format() });

      const userId = (request as any).user?.id || "your-seed-user-id";

      const workspace = await workspaceService.createWorkspace(
        result.data,
        userId,
      );
      return reply.status(201).send({ data: workspace });
    },
  );

  fastify.get(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      // Using your existing fallback pattern for the user ID
      const userId = (request as any).user?.id || "your-seed-user-id";

      try {
        // Calls the service we talked about in the last step
        const workspaces = await workspaceService.getUserWorkspaces(userId);
        return reply.send({ data: workspaces });
      } catch (error) {
        return reply
          .status(500)
          .send({ message: "Failed to fetch workspaces", error });
      }
    },
  );

  // 🟢 Make sure preHandler: requireAuth is here!
  fastify.get("/:slug", { preHandler: requireAuth }, async (request, reply) => {
    const { slug } = request.params as { slug: string };

    // Now that requireAuth is present, this will be your REAL user ID!
    const userId = (request as any).user.id;

    try {
      const workspace = await workspaceService.getWorkspaceBySlug(slug, userId);

      if (!workspace) {
        return reply.code(404).send({ message: "Workspace not found" });
      }

      return reply.send({ data: workspace });
    } catch (error) {
      return reply.code(500).send({ message: "Server error", error });
    }
  });

  fastify.patch(
    "/:workspaceId",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { name } = request.body as { name: string };

      if (!name || name.trim() === "") {
        return reply
          .status(400)
          .send({ message: "Workspace name is required" });
      }

      try {
        const updatedWorkspace = await workspaceService.updateWorkspace(
          workspaceId,
          name,
        );
        return reply.send({ data: updatedWorkspace });
      } catch (error) {
        return reply
          .status(500)
          .send({ message: "Failed to update workspace", error });
      }
    },
  );

  // 🟢 POST /api/workspaces/:workspaceId/members
  fastify.post(
    "/:workspaceId/members",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { email } = request.body as { email: string };

      if (!email) {
        return reply.status(400).send({ message: "Email is required" });
      }

      try {
        const newMember = await workspaceService.inviteMember(
          workspaceId,
          email,
        );
        return reply.status(201).send({ data: newMember });
      } catch (error: any) {
        // Send the specific error message (e.g., "User not found" or "Already a member")
        return reply
          .status(400)
          .send({ message: error.message || "Failed to invite member" });
      }
    },
  );

  // Add these inside your workspace routes plugin
  fastify.get("/:workspaceId/tags", async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    try {
      const tags = await tagService.getTagsByWorkspace(workspaceId);
      return { data: tags };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to fetch tags" });
    }
  });

  fastify.post("/:workspaceId/tags", async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const { name, color } = request.body as { name: string; color: string };
    try {
      const newTag = await tagService.createTag(workspaceId, name, color);
      return { data: newTag };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to create tag" });
    }
  });

  fastify.get(
    "/:workspaceId/analytics",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      try {
        const analytics =
          await analyticsService.getWorkspaceAnalytics(workspaceId);
        return reply.send({ data: analytics });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ message: "Failed to load analytics" });
      }
    },
  );

  // 🟢 GET /api/workspaces/:workspaceId/search?q=something
  fastify.get(
    "/:workspaceId/search",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const { q } = request.query as { q?: string };

      if (!q || q.trim() === "") {
        return reply.send({ data: { tasks: [], projects: [] } });
      }

      // 🟢 1. Check if the search term is a valid number
      const searchNumber = parseInt(q, 10);
      const isSearchNumber = !isNaN(searchNumber);

      try {
        // 2. Search Tasks
        const tasks = await prisma.task.findMany({
          where: {
            project: { workspaceId },
            OR: [
              // Always search the string fields
              { title: { contains: q, mode: "insensitive" } },

              // 🟢 3. ONLY add sequenceId to the search if 'q' is actually a number!
              ...(isSearchNumber ? [{ sequenceId: searchNumber }] : []),
            ],
          },
          take: 8,
          include: {
            project: { select: { id: true, name: true, identifier: true } },
          },
        });

        // 3. Search Projects
        const projects = await prisma.project.findMany({
          where: {
            workspaceId,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { identifier: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 3,
        });

        return reply.send({ data: { tasks, projects } });
      } catch (error) {
        return reply.code(500).send({ message: "Search failed", error });
      }
    },
  );

 fastify.post(
  "/:slug/invites",
  { preHandler: [requireAuth] ,
    config: {
      rateLimit: {
        max: 5,             // Max 5 invites...
        timeWindow: '1 minute' // ...per 1 minute window
      }
    }
  },
  async (request, reply) => {
    const { slug: workspaceId } = request.params as { slug: string };
    const { email, role } = request.body as { email: string; role?: string };
    const inviterId = (request as any).user.id;

    try {
      // 1. Auth & Validation (Unchanged)
      const inviterMembership = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: inviterId },
      });

      if (!inviterMembership || (inviterMembership.role !== "OWNER" && inviterMembership.role !== "ADMIN")) {
        return reply.status(403).send({
          success: false,
          message: "Forbidden: You do not have permission to invite members.",
        });
      }

      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

      if (!workspace || !inviter) {
        return reply.status(404).send({ success: false, message: "Workspace or User not found" });
      }

      // 2. Generate Token & Save to DB (Unchanged)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.workspaceInvitation.upsert({
        where: { email_workspaceId: { email, workspaceId } },
        update: { token, expiresAt, role: role || "MEMBER", inviterId },
        create: { email, token, expiresAt, role: role || "MEMBER", workspaceId, inviterId },
      });

      // 🟢 3. FIRE AND FORGET! Hand it off to BullMQ
      await emailQueue.add(
        'workspace-invite', // Job Name
        {
          toEmail: email,
          inviterName: inviter.name || "A teammate",
          workspaceName: workspace.name,
          token: token,
        },
        {
          attempts: 3, // If Nodemailer fails, try 3 more times
          backoff: {
            type: 'exponential',
            delay: 5000, // Wait 5s, then 10s, then 20s if it keeps failing
          },
          removeOnComplete: true, // Keep Redis memory clean
        }
      );

      // 4. Return to frontend INSTANTLY
      return reply.status(200).send({ success: true, message: "Invitation queued successfully!" });
      
    } catch (error) {
      console.error("❌ CRASH IN INVITE ROUTE:", error);
      return reply.status(500).send({ success: false, message: "Internal Server Error" });
    }
  },
);

  // 🟢 ROUTE: Accept an Invitation
  fastify.post(
    "/invites/accept",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { token } = request.body as { token: string };
      const userId = (request as any).user.id;

      try {
        // 1. Find the pending invitation in the database
        const invite = await prisma.workspaceInvitation.findUnique({
          where: { token },
        });

        // 2. Security Check: Does it exist? Is it expired?
        if (!invite) {
          return reply.status(404).send({
            success: false,
            message: "Invalid or expired invitation.",
          });
        }

        if (invite.expiresAt < new Date()) {
          // Clean up expired invite
          await prisma.workspaceInvitation.delete({ where: { id: invite.id } });
          return reply
            .status(400)
            .send({ success: false, message: "This invitation has expired." });
        }

        // Add this right before you check if they are an existingMember
        const loggedInUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (loggedInUser?.email !== invite.email) {
          return reply.status(403).send({
            success: false,
            message: `This invite was sent to ${invite.email}. Please log in with that account.`,
          });
        }
        // 3. Check if the user is ALREADY a member (prevents crashing if they click twice)
        // Note: Change 'workspaceMember' to whatever you named your bridging table in schema.prisma!
        const existingMember = await prisma.workspaceMember.findFirst({
          where: {
            workspaceId: invite.workspaceId,
            userId: userId,
          },
        });

        if (!existingMember) {
          // 4. Officially add them to the Workspace!
          let finalRole = invite.role;
          if (finalRole === "VIEWER") {
            finalRole = "GUEST";
          }

          // 🟢 2. Officially add them to the Workspace!
          await prisma.workspaceMember.create({
            data: {
              workspaceId: invite.workspaceId,
              userId: userId,
              // 🟢 3. THE FIX: Cast strictly to the allowed WorkspaceRole Enum strings
              role: finalRole as "ADMIN" | "MEMBER" | "GUEST",
            },
          });
        }

        // 5. Delete the invitation so it can never be used again
        await prisma.workspaceInvitation.delete({
          where: { id: invite.id },
        });

        console.log(
          `✅ User ${userId} successfully joined workspace ${invite.workspaceId}`,
        );

        // Return the workspaceId so the frontend knows where to redirect them!
        return reply.status(200).send({
          success: true,
          workspaceId: invite.workspaceId,
          message: "Welcome to the workspace!",
        });
      } catch (error) {
        console.error("❌ CRASH IN ACCEPT INVITE ROUTE:", error);
        return reply
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    },
  );

  // 🟢 CHANGE A USER'S ROLE
  fastify.patch(
    "/:workspaceId/members/:memberId",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { memberId } = request.params as { memberId: string };
      const { role } = request.body as { role: WorkspaceRole };

      // Make sure they aren't trying to downgrade the OWNER
      const targetMember = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
      });
      if (targetMember?.role === WorkspaceRole.OWNER) {
        return reply
          .status(403)
          .send({ error: "Cannot change the role of the Workspace Owner." });
      }

      const updatedMember = await prisma.workspaceMember.update({
        where: { id: memberId },
        data: { role },
      });

      return reply.send({ data: updatedMember });
    },
  );

  // 🟢 REMOVE A USER FROM WORKSPACE
  fastify.delete(
    "/:workspaceId/members/:memberId",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { memberId } = request.params as { memberId: string };

      // Prevent kicking the owner
      const targetMember = await prisma.workspaceMember.findUnique({
        where: { id: memberId },
      });
      if (targetMember?.role === WorkspaceRole.OWNER) {
        return reply
          .status(403)
          .send({ error: "Cannot remove the Workspace Owner." });
      }

      await prisma.workspaceMember.delete({
        where: { id: memberId },
      });

      return reply.send({ success: true });
    },
  );

  // 🟢 GET ALL USERS IN A WORKSPACE
  fastify.get(
    "/:workspaceId/users",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      try {
        // 1. Find all memberships for this workspace and include the user details
        const members = await prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });

        // 2. The frontend wants an array of pure 'User' objects, not 'Memberships'.
        // So we map over the members and extract just the nested user object.
        const users = members.map((member) => member.user);

        return reply.send({ data: users });
      } catch (error) {
        return reply
          .status(500)
          .send({ message: "Failed to fetch workspace users", error });
      }
    },
  );

  // 🔴 DELETE /api/workspaces/:workspaceId
  fastify.delete(
    "/:workspaceId",
    {
      preHandler: [
        requireAuth,
        // Ensure you have this middleware created for Workspace roles!
        requireWorkspaceRole([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
      ],
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      try {
        await prisma.workspace.delete({
          where: { id: workspaceId },
        });

        return reply.code(200).send({
          message: "Workspace deleted successfully",
          deletedWorkspaceId: workspaceId,
        });
      } catch (error) {
        return reply.code(500).send({
          message: "Failed to delete workspace.",
          error,
        });
      }
    },
  );

  // Add this to your Fastify document routes
  fastify.get(
    "/workspaces/:workspaceId/docs",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      const docs = await prisma.document.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true }, // Don't fetch the heavy JSON content here!
      });

      return reply.code(200).send({ data: docs });
    },
  );

  // 🟢 GET WORKSPACE ACTIVITY LOGS
  fastify.get(
    "/workspaces/:workspaceId/activity",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      try {
        const logs = await prisma.activityLog.findMany({
          where: {
            task: {
              project: {
                workspaceId: workspaceId,
              },
            },
          },
          include: {
            actor: { select: { id: true, name: true, image: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        });

        return reply.send({ data: logs });
      } catch (error) {
        return reply
          .status(500)
          .send({ error: "Failed to fetch activity logs" });
      }
    },
  );
}

