import { FastifyRequest, FastifyReply } from "fastify";
import { prisma ,WorkspaceRole,ProjectRole} from "@repo/database"; 

// This is a "Higher Order Function" - it returns a middleware function!
export const requireWorkspaceRole = (allowedRoles: WorkspaceRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Get the logged-in user and the workspace ID from the URL
      const userId = (request as any).user.id;
      const { workspaceId } = request.params as { workspaceId: string };

      if (!workspaceId) {
        return reply.status(400).send({ error: "Workspace ID is required in the URL parameters" });
      }

      // 2. Look up the user's membership in this specific workspace
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspaceId,
          userId: userId,
        },
      });

      // 3. If they aren't in the workspace, or their role isn't in the allowed list: Kick them out!
      if (!membership || !allowedRoles.includes(membership.role as WorkspaceRole)) {
        return reply.status(403).send({ 
          error: "Forbidden", 
          message: "You do not have permission to perform this action." 
        });
      }

      // 4. (Optional but awesome) Attach the role to the request so the route can use it later!
      (request as any).userRole = membership.role;

    } catch (error) {
      return reply.status(500).send({ error: "Failed to verify permissions" });
    }
  };
};

export const requireProjectRole = (allowedRoles: ProjectRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { projectId } = request.params as { projectId: string };

      if (!projectId) {
        return reply.status(400).send({ error: "Project ID is required" });
      }

      // 🟢 1. INHERITANCE CHECK: Find the project to get its Workspace ID
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true }
      });

      if (!project) return reply.status(404).send({ error: "Project not found" });

      // 🟢 2. See if they are an Admin/Owner of the parent workspace
      const workspaceMembership = await prisma.workspaceMember.findFirst({
        where: { workspaceId: project.workspaceId, userId: userId },
      });

      // 🟢 3. GOD MODE: If they are Workspace Owner or Admin, instantly allow them!
      if (workspaceMembership && ["OWNER", "ADMIN"].includes(workspaceMembership.role)) {
        return; // Success! Exit the middleware and let the route run.
      }

      // 🔴 4. STANDARD CHECK: If not a Workspace Admin, check their specific Project Role
      const projectMembership = await prisma.projectMember.findFirst({
        where: { projectId: projectId, userId: userId },
      });

      if (!projectMembership || !allowedRoles.includes(projectMembership.role as ProjectRole)) {
        return reply.status(403).send({ 
          error: "Forbidden", 
          message: "You must be a Project Manager or Workspace Admin to change these settings." 
        });
      }

    } catch (error) {
      return reply.status(500).send({ error: "Failed to verify project permissions" });
    }
  };
};