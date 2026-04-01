import { FastifyPluginAsync } from "fastify";

import { requireAuth } from "../../middleware/require-auth.js";
import { prisma } from "@repo/database";

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/mentions",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId, q } = request.query as {
        workspaceId: string;
        q: string;
      };

      if (!workspaceId)
        return reply.code(400).send({ message: "Workspace ID required" });

      const searchFilter = { contains: q, mode: "insensitive" as const };

      try {
        // 🟢 THE FIX: If there is a query, filter by it. If not, just return undefined (which tells Prisma to fetch everything)
        const searchFilter = q
          ? { contains: q, mode: "insensitive" as const }
          : undefined;

        const [users, projects, tasks] = await Promise.all([
          prisma.user.findMany({
            where: {
              workspaces: { some: { workspaceId } },
              name: searchFilter, // If undefined, it just grabs the first 5 users
            },
            take: 5,
            select: { id: true, name: true, image: true },
          }),

          prisma.project.findMany({
            where: {
              workspaceId,
              name: searchFilter,
            },
            take: 5,
            select: { id: true, name: true },
          }),

          prisma.task.findMany({
            where: {
              project: { workspaceId },
              title: searchFilter,
            },
            take: 5,
            select: { id: true, title: true, status: true },
          }),
        ]);

        const mentions = [
          ...users.map((u) => ({
            id: u.id,
            title: u.name || "Unknown User",
            type: "user",
            avatar: u.image,
          })),
          ...projects.map((p) => ({
            id: p.id,
            title: p.name,
            type: "project",
          })),
          ...tasks.map((t) => ({
            id: t.id,
            title: t.title,
            type: "task",
            status: t.status,
          })),
        ];

        return reply.code(200).send({ data: mentions });
      } catch (error) {
        console.error("Search API Error:", error);
        return reply.code(500).send({ message: "Search failed", error });
      }
    },
  );

  fastify.get(
    "/global",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId, q } = request.query as {
        workspaceId: string;
        q?: string;
      };

      if (!workspaceId)
        return reply.code(400).send({ message: "Workspace ID required" });

      // If the user hasn't typed at least 2 characters, return empty arrays to save DB power
      if (!q || q.length < 2) {
        return reply
          .code(200)
          .send({ data: { tasks: [], documents: [], whiteboards: [] } });
      }

      // Format query for Postgres Full-Text Search ("marketing plan" -> "marketing | plan")
      const searchQuery = q.trim().split(/\s+/).join(" | ");

      try {
        // Run all 3 heavy searches perfectly in parallel!
        const [tasks, documents, whiteboards] = await Promise.all([
          // 1. Search Tasks
          prisma.task.findMany({
            where: {
              project: { workspaceId },
              // Searches BOTH the title and description for keywords!
              OR: [
                { title: { search: searchQuery } },
                { description: { search: searchQuery } },
              ],
            },
            take: 5,
            select: {
              id: true,
              title: true,
              status: true,
              sequenceId: true,
              project: { select: { id: true, identifier: true } },
            },
          }),

          // 2. Search Documents
          prisma.document.findMany({
            where: {
              workspaceId,
              title: { search: searchQuery },
            },
            take: 5,
            select: { id: true, title: true, emoji: true },
          }),

          // 3. Search Whiteboards
          prisma.whiteboard.findMany({
            where: {
              workspaceId,
              title: { search: searchQuery },
            },
            take: 5,
            select: { id: true, roomId: true, title: true }, // Need roomId for routing!
          }),
        ]);

        return reply.code(200).send({
          data: { tasks, documents, whiteboards },
        });
      } catch (error) {
        console.error("Global Search API Error:", error);
        return reply.code(500).send({ message: "Search failed", error });
      }
    },
  );
};

export default searchRoutes;

