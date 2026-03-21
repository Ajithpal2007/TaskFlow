import { prisma } from "@repo/database";
import { CreateProjectInput } from "@repo/validators";

export const projectService = {
  async createProject(data: CreateProjectInput, userId: string) {
    return await prisma.project.create({
      data: {
        name: data.name,
        identifier: data.identifier,
        workspaceId: data.workspaceId,
        members: {
          create: {
            userId: userId,
            role: "MANAGER",
          },
        },
      },
    });
  },

  async getWorkspaceProjects(workspaceId: string) {
    return await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" }
    });
  }
};