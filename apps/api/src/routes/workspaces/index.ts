import { FastifyInstance } from "fastify";
import { createWorkspaceSchema } from "@repo/validators";
import { workspaceService } from "../../services/workspace.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { tagService } from "../../services/tag.service.js";

import { analyticsService } from "../../services/analytics.service";
import { prisma } from "@repo/database";

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
      preHandler: requireAuth,
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

  fastify.get("/:workspaceId/analytics", { preHandler: requireAuth }, async (request, reply) => {
  const { workspaceId } = request.params as { workspaceId: string };

  try {
    const analytics = await analyticsService.getWorkspaceAnalytics(workspaceId);
    return reply.send({ data: analytics });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ message: "Failed to load analytics" });
  }
});

// 🟢 GET /api/workspaces/:workspaceId/search?q=something
  fastify.get("/:workspaceId/search", { preHandler: requireAuth }, async (request, reply) => {
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
            { title: { contains: q, mode: 'insensitive' } },
            
            // 🟢 3. ONLY add sequenceId to the search if 'q' is actually a number!
            ...(isSearchNumber ? [{ sequenceId: searchNumber }] : [])
          ]
        },
        take: 8, 
        include: {
          project: { select: { id: true, name: true, identifier: true } }
        }
      });

      // 3. Search Projects
      const projects = await prisma.project.findMany({
        where: {
          workspaceId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { identifier: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 3,
      });

      return reply.send({ data: { tasks, projects } });
    } catch (error) {
      return reply.code(500).send({ message: "Search failed", error });
    }
  });

}

