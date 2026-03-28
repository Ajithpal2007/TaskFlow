import { FastifyPluginAsync } from "fastify";

import { requireAuth } from "../../middleware/require-auth.js";
import { prisma } from "@repo/database";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/mentions",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId, q } = request.query as { workspaceId: string; q: string };

      if (!workspaceId) return reply.code(400).send({ message: "Workspace ID required" });
     

      const searchFilter = { contains: q, mode: "insensitive" as const };

      try {
        // 🟢 THE FIX: If there is a query, filter by it. If not, just return undefined (which tells Prisma to fetch everything)
        const searchFilter = q ? { contains: q, mode: "insensitive" as const } : undefined;

        const [users, projects, tasks] = await Promise.all([
          prisma.user.findMany({
            where: {
              workspaces: { some: { workspaceId } },
              name: searchFilter // If undefined, it just grabs the first 5 users
            },
            take: 5,
            select: { id: true, name: true, image: true }
          }),
          
          prisma.project.findMany({
            where: {
              workspaceId,
              name: searchFilter
            },
            take: 5,
            select: { id: true, name: true }
          }),

          prisma.task.findMany({
            where: {
              project: { workspaceId }, 
              title: searchFilter
            },
            take: 5,
            select: { id: true, title: true, status: true }
          })
        ]);

        const mentions = [
          ...users.map(u => ({ id: u.id, title: u.name || "Unknown User", type: "user", avatar: u.image })),
          ...projects.map(p => ({ id: p.id, title: p.name, type: "project" })),
          ...tasks.map(t => ({ id: t.id, title: t.title, type: "task", status: t.status }))
        ];

        return reply.code(200).send({ data: mentions });
      } catch (error) {
        console.error("Search API Error:", error);
        return reply.code(500).send({ message: "Search failed", error });
      } 
    }
  );
};

export default searchRoutes;
