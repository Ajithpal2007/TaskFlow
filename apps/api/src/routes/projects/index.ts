import { FastifyInstance } from "fastify";
import { createProjectSchema } from "@repo/validators";
import { projectService } from "../../services/project.service.js";
import { requireAuth } from "../../middleware/require-auth.js"; 
import { prisma } from "@repo/database";


export default async function projectRoutes(fastify: FastifyInstance) {
  fastify.post("/", {
    preHandler: requireAuth
  }, async (request, reply) => {
    const result = createProjectSchema.safeParse(request.body);
    if (!result.success)
      return reply.status(400).send({ error: result.error.format() });

    const userId = (request as any).user?.id || "your-seed-user-id";

    const project = await projectService.createProject(result.data, userId);
    return reply.status(201).send({ data: project });
  });


  fastify.get("/workspace/:workspaceId", async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const projects = await projectService.getWorkspaceProjects(workspaceId);
    if (!projects) 
      return reply.code(404).send({ message: "Projects not found" });

    return { data: projects };
  }
)

// 🟢 PATCH /api/projects/:projectId
  fastify.patch("/:projectId", { preHandler: requireAuth }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { name, wipLimits } = request.body as any; // Extract the incoming data

    try {
      // Update the database!
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: name !== undefined ? name : undefined,
          wipLimits: wipLimits !== undefined ? wipLimits : undefined,
        },
      });

      return reply.send({ data: updatedProject });
    } catch (error) {
      return reply.status(500).send({ message: "Failed to update project", error });
    }
  });
}
