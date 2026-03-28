import { FastifyPluginAsync } from "fastify";
import { prisma } from "@repo/database";
import { requireAuth } from "../../middleware/require-auth.js";
import { sendDocumentInviteEmail } from "../../services/email.service.js";

const documentRoutes: FastifyPluginAsync = async (fastify) => {
  // 🟢 1. GET ALL DOCS FOR SIDEBAR (The Recursive Tree)
  // Frontend Hook: apiClient.get(`/docs/workspace/${workspaceId}`)
  fastify.get(
    "/docs/workspace/:workspaceId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const userId = (request as any).user.id;

      try {
        const allDocuments = await prisma.document.findMany({
          where: {
            workspaceId,
            isArchived: false,
            OR: [
              { visibility: "PUBLIC" },
              { authorId: userId },
              {
                collaborators: {
                  some: { userId: userId },
                },
              },
            ],
          },
          select: { id: true, title: true, emoji: true, parentId: true },
          orderBy: { createdAt: "asc" },
        });

        const buildTree = (parentId: string | null = null): any[] => {
          return allDocuments
            .filter((doc) => doc.parentId === parentId)
            .map((doc) => ({ ...doc, children: buildTree(doc.id) }));
        };

        return reply.code(200).send({ data: buildTree(null) });
      } catch (error) {
        return reply.code(500).send({ message: "Failed to fetch tree", error });
      }
    },
  );

  // 🟢 2. CREATE A NEW DOCUMENT (Root or Child)
  // Frontend Hook: apiClient.post("/docs", payload)
  fastify.post(
    "/docs",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { title, parentId, workspaceId } = request.body as any;
      const userId = (request as any).user.id;

      try {
        const newDoc = await prisma.document.create({
          data: {
            title: title || "Untitled",
            parentId: parentId || null,
            workspaceId,
            authorId: userId,
            content: [], // Blank BlockNote canvas
          },
        });
        return reply.code(201).send({ data: newDoc });
      } catch (error) {
        return reply
          .code(500)
          .send({ message: "Failed to create document", error });
      }
    },
  );

  // 🟢 3. GET A SINGLE DOCUMENT (For the Editor)
  // Frontend Hook: apiClient.get(`/docs/${docId}`)
  fastify.get(
    "/docs/:docId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { docId } = request.params as { docId: string };

      // Guard against React sending "undefined" during initial render
      if (!docId || docId === "undefined") {
        return reply.code(400).send({ message: "Invalid document ID" });
      }

      try {
        const document = await prisma.document.findUnique({
          where: { id: docId },
          include: { author: { select: { name: true, image: true } } },
        });

        if (!document)
          return reply.code(404).send({ message: "Document not found" });
        return reply.code(200).send({ data: document });
      } catch (error) {
        return reply
          .code(500)
          .send({ message: "Failed to fetch document", error });
      }
    },
  );

  // 🟢 4. UPDATE DOCUMENT (Editor Auto-Save)
  // Frontend Hook: apiClient.patch(`/docs/${docId}`, updates)
  fastify.patch(
    "/docs/:docId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { docId } = request.params as { docId: string };
      const updates = request.body as any;

      if (!docId || docId === "undefined") {
        return reply.code(400).send({ message: "Invalid document ID" });
      }

      try {
        const updatedDoc = await prisma.document.update({
          where: { id: docId },
          data: updates,
        });
        return reply.code(200).send({ data: updatedDoc });
      } catch (error) {
        return reply
          .code(500)
          .send({ message: "Failed to update document", error });
      }
    },
  );

  // 🟢 5. ARCHIVE / SOFT-DELETE DOCUMENT
  // Frontend Hook: apiClient.patch(`/docs/${docId}/archive`, { isArchived: true })
  fastify.patch(
    "/docs/:docId/archive",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { docId } = request.params as { docId: string };
      const { isArchived } = request.body as { isArchived: boolean };

      try {
        const archivedDoc = await prisma.document.update({
          where: { id: docId },
          data: { isArchived },
        });
        return reply.code(200).send({ data: archivedDoc });
      } catch (error) {
        return reply
          .code(500)
          .send({ message: "Failed to archive document", error });
      }
    },
  );

  // 🟢 6. GET TRASHED DOCUMENTS
  // Frontend Hook: apiClient.get(`/docs/workspace/${workspaceId}/trash`)
  fastify.get(
    "/docs/workspace/:workspaceId/trash",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      try {
        const trashedDocs = await prisma.document.findMany({
          where: { workspaceId, isArchived: true },
          select: { id: true, title: true, emoji: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        });
        return reply.code(200).send({ data: trashedDocs });
      } catch (error) {
        return reply
          .code(500)
          .send({ message: "Failed to fetch trash", error });
      }
    },
  );

  // 🔴 7. PERMANENTLY DELETE DOCUMENT
  // Frontend Hook: apiClient.delete(`/docs/${docId}`)
  fastify.delete(
    "/docs/:docId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { docId } = request.params as { docId: string };

      try {
        await prisma.document.delete({
          where: { id: docId },
        });
        return reply
          .code(200)
          .send({ message: "Document permanently deleted" });
      } catch (error) {
        return reply
          .code(500)
          .send({ message: "Failed to delete document", error });
      }
    },
  );

  // 🟢 8. INVITE COLLABORATOR
  fastify.post(
    "/docs/:docId/invite",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { docId } = request.params as { docId: string };
      const { email, accessLevel } = request.body as { email: string; accessLevel: string };
      const inviterId = (request as any).user.id;

      try {
        // 1. Get the data needed for the email
        const document = await prisma.document.findUnique({ where: { id: docId } });
        const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

        if (!document || !inviter) {
          return reply.code(404).send({ message: "Document or User not found" });
        }

        // 2. Check if the user exists
        const invitedUser = await prisma.user.findUnique({ where: { email } });

        if (invitedUser) {
          // 🟢 USER EXISTS: Save access to Postgres and send the standard email
          await prisma.documentAccess.upsert({
            where: { documentId_userId: { documentId: docId, userId: invitedUser.id } },
            update: { accessLevel },
            create: { documentId: docId, userId: invitedUser.id, accessLevel }
          });

          await sendDocumentInviteEmail(
            email, inviter.name!, document.title, document.workspaceId, docId, accessLevel, false
          );

          return reply.code(200).send({ message: "Access granted and email sent!" });
        } else {
          // 🟡 USER DOES NOT EXIST: Send the "Join TaskFlow" email
          await sendDocumentInviteEmail(
            email, inviter.name!, document.title, document.workspaceId, docId, accessLevel, true
          );

          return reply.code(200).send({ message: "Invite email sent to new user!" });
        }

      } catch (error) {
        console.error("Invite Error:", error);
        return reply.code(500).send({ message: "Failed to send invite", error });
      }
    }
  );

  
};

export default documentRoutes;
