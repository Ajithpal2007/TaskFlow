import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/require-auth.js";
import { prisma } from "@repo/database";
export default function notificationRoutes(fastify: FastifyInstance) {
  
  // 🟢 1. GET ALL NOTIFICATIONS
  fastify.get(
    "/",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      try {
        const notifications = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 50, // Keep it fast, only fetch the 50 most recent
          include: {
            // Include basic task details so we can link directly to it!
            task: {
              select: { id: true, title: true, projectId: true }
            }
          }
        });
        return reply.send({ data: notifications });
      } catch (error) {
        return reply.status(500).send({ error: "Failed to fetch notifications" });
      }
    }
  );

  // 🟢 2. MARK ONE AS READ
  fastify.patch(
    "/:id/read",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.id;

      try {
        await prisma.notification.update({
          where: { id, userId }, // Verify they own it before updating
          data: { isRead: true },
        });
        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({ error: "Failed to mark as read" });
      }
    }
  );

  // 🟢 3. MARK ALL AS READ
  fastify.patch(
    "/read-all",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      try {
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({ error: "Failed to mark all as read" });
      }
    }
  );

  // 🟢 4. CLEAR ALL NOTIFICATIONS (DELETE)
  fastify.delete(
    "/clear-all",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;

      try {
        await prisma.notification.deleteMany({
          where: { userId }, // Only delete THEIR notifications!
        });
        return reply.send({ success: true });
      } catch (error) {
        return reply.status(500).send({ error: "Failed to clear notifications" });
      }
    }
  );
}