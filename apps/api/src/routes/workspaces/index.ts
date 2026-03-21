import { FastifyInstance } from "fastify";
import { createWorkspaceSchema } from "@repo/validators";
import { workspaceService } from "../../services/workspace.service.js";
import { requireAuth } from "../../middleware/require-auth.js"; 
import { tagService } from "../../services/tag.service.js";


export default async function workspaceRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces
  fastify.post("/", {
    preHandler: requireAuth
  }, async (request, reply) => {
    const result = createWorkspaceSchema.safeParse(request.body);
    if (!result.success)
      return reply.status(400).send({ error: result.error.format() });

    const userId = (request as any).user?.id || "your-seed-user-id";

    const workspace = await workspaceService.createWorkspace(
      result.data,
      userId,
    );
    return reply.status(201).send({ data: workspace });
  });

  fastify.get("/", {
    preHandler: requireAuth
  }, async (request, reply) => {
    // Using your existing fallback pattern for the user ID
    const userId = (request as any).user?.id || "your-seed-user-id";

    try {
      // Calls the service we talked about in the last step
      const workspaces = await workspaceService.getUserWorkspaces(userId);
      return reply.send({ data: workspaces });
    } catch (error) {
      return reply.status(500).send({ message: "Failed to fetch workspaces", error });
    }
  });

  // GET /api/workspaces/:slug
  fastify.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const userId = (request as any).user?.id || "your-seed-user-id";

    const workspace = await workspaceService.getWorkspaceBySlug(slug, userId);
    if (!workspace)
      return reply.code(404).send({ message: "Workspace not found" });

  return workspace;
  });



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


}
