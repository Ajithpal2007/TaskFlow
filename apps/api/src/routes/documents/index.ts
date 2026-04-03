import { FastifyPluginAsync } from "fastify";
import { prisma } from "@repo/database";
import { requireAuth } from "../../middleware/require-auth.js";
import { emailQueue,cleanupQueue } from "../../lib/queue";
 import { requireWorkspaceRole } from "../../middleware/require-role";

const documentRoutes: FastifyPluginAsync = async (fastify) => {
  // 🟢 1. GET ALL DOCS FOR SIDEBAR (The Recursive Tree)
  // Frontend Hook: apiClient.get(`/docs/workspace/${workspaceId}`)
  fastify.get(
     "/workspaces/:workspaceId/docs",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"])] },

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
    "/workspaces/:workspaceId/docs",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"])] },
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
  
  fastify.get(
    "/workspaces/:workspaceId/docs/:docId",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"])] },
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
    "/workspaces/:workspaceId/docs/:docId",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"])] },
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
  
  fastify.patch(
    "/workspaces/:workspaceId/docs/:docId/archive",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"])] },
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
    "/workspaces/:workspaceId/docs/trash",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", ])] },
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
  fastify.delete(
    "/workspaces/:workspaceId/docs/:docId",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", ])] },
    async (request, reply) => {
      const { docId } = request.params as { docId: string };

      try {
        // 1. Fetch the document BEFORE deleting it so we don't lose the file URLs!
        const document = await prisma.document.findUnique({
          where: { id: docId },
          select: { coverImage: true, content: true } // Grab anything that might contain an image URL
        });

        if (!document) {
          return reply.code(404).send({ message: "Document not found" });
        }

        let fileUrlsToDelete: string[] = [];

        // 2. Extract the Cover Image URL (if it exists)
        if (document.coverImage && document.coverImage.includes("uploadthing.com")) {
          fileUrlsToDelete.push(document.coverImage);
        }

        // (Optional) 3. If you store image URLs inside the JSON `content`, 
        // you could write a quick regex here to extract them too!

        // 4. Delete the database row (Instantly removes it from the user's UI)
        await prisma.document.delete({
          where: { id: docId },
        });

        // 🟢 5. FIRE AND FORGET! Tell BullMQ to hunt down and delete the physical files
        if (fileUrlsToDelete.length > 0) {
          await cleanupQueue.add('delete-uploadthing-files', {
            fileUrls: fileUrlsToDelete
          });
        }

        return reply.code(200).send({ message: "Document permanently deleted" });
      } catch (error) {
        console.error("Delete Error:", error);
        return reply.code(500).send({ message: "Failed to delete document", error });
      }
    },
  );
  // 🟢 8. INVITE COLLABORATOR
  fastify.post(
    "/workspaces/:workspaceId/docs/:docId/invite",
    { preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"])] },
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
        const isNewUser = !invitedUser;

        // 3. Do the fast Database work
        if (!isNewUser) {
          // 🟢 USER EXISTS: Save access to Postgres instantly
          await prisma.documentAccess.upsert({
            where: { documentId_userId: { documentId: docId, userId: invitedUser.id } },
            update: { accessLevel },
            create: { documentId: docId, userId: invitedUser.id, accessLevel }
          });
        }

        // 4. FIRE AND FORGET! Push the email job to Redis
        await emailQueue.add(
          'document-invite', // The job name
          {
            email: email,
            inviterName: inviter.name || "A teammate",
            documentTitle: document.title,
            workspaceId: document.workspaceId,
            docId: docId,
            accessLevel: accessLevel,
            isNewUser: isNewUser // Pass the boolean so the worker knows which template to use
          },
          {
            attempts: 3, // Retry if Nodemailer fails
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
          }
        );

        // 5. Instantly return success to the UI
        if (!isNewUser) {
          return reply.code(200).send({ message: "Access granted and email queued!" });
        } else {
          return reply.code(200).send({ message: "Invite email queued for new user!" });
        }

      } catch (error) {
        console.error("Invite Error:", error);
        return reply.code(500).send({ message: "Failed to process invite", error });
      }
    }
  );

  
};

export default documentRoutes;
