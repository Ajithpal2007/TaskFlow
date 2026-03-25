import { FastifyInstance, FastifyRequest } from "fastify";
import { createProjectSchema } from "@repo/validators";
import { projectService } from "../../services/project.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { prisma,ProjectRole } from "@repo/database";
import { requireProjectRole } from "../../middleware/require-role";

export default async function projectRoutes(fastify: FastifyInstance) {
  const projectRooms = new Map<string, Set<any>>();

 fastify.get(
    "/:projectId/board/ws",
    { websocket: true },
    (connection: any, request: any) => {
      
      // 🟢 1. The Universal Socket Extractor
      // Depending on Fastify's mood, the websocket is either `connection` or `connection.socket`
      const socket = connection.socket || connection;

      // 🟢 2. The Safety Net
      // If this is an accidental HTTP request, reject it cleanly instead of crashing!
      if (!socket || typeof socket.on !== 'function') {
        return request.status(400).send({ error: "Please connect via ws://" });
      }

      const rawUrl = request.raw?.url || "";
      const projectId = request.params?.projectId || rawUrl.split('/')[3] || "unknown";
      
      console.log(`🔌 Client joining Project Room: ${projectId}`);

      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set());
      }
      projectRooms.get(projectId)?.add(socket);

      socket.on("message", (message: Buffer | string) => {
        try {
          const data = message.toString();
          console.log(`📥 Received in Room ${projectId}: ${data}`);

          const room = projectRooms.get(projectId);
          if (room) {
            room.forEach((client) => {
              if (client.readyState === 1 && client !== socket) {
                client.send(data);
              }
            });
          }
        } catch (err) {
          console.error("WS error:", err);
        }
      });

      socket.on("close", () => {
        console.log(`❌ Client left Project Room ${projectId}`);
        const room = projectRooms.get(projectId);
        if (room) {
          room.delete(socket);
          if (room.size === 0) projectRooms.delete(projectId);
        }
      });
    }
  );

//fastify.addHook("preHandler", requireAuth);

  fastify.post(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const result = createProjectSchema.safeParse(request.body);
      if (!result.success)
        return reply.status(400).send({ error: result.error.format() });

      const userId = (request as any).user?.id || "your-seed-user-id";

      const project = await projectService.createProject(result.data, userId);
      return reply.status(201).send({ data: project });
    },
  );

  fastify.get("/workspace/:workspaceId", async (request, reply) => {
    const { workspaceId } = request.params as { workspaceId: string };
    const projects = await projectService.getWorkspaceProjects(workspaceId);
    if (!projects)
      return reply.code(404).send({ message: "Projects not found" });

    return { data: projects };
  });

  // 🟢 PATCH /api/projects/:projectId
  fastify.patch(
    "/:projectId",
    { 
      // 🟢 THE FIX: Add the shield array
      preHandler: [
        requireAuth,
        requireProjectRole([ProjectRole.MANAGER]) 
      ] 
    },
    async (request, reply) => {
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
        return reply
          .status(500)
          .send({ message: "Failed to update project", error });
      }
    },
  );

  
}

