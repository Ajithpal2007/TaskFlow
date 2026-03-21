import { prisma } from "@repo/database";
import { CreateWorkspaceInput } from "@repo/validators";

export const workspaceService = {
  async createWorkspace(data: CreateWorkspaceInput, userId: string) {
    return await prisma.workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: {
            userId: userId,
            role: "OWNER",
          },
        },
      },
    });
  },

  async getWorkspaceBySlug(slug: string, userId: string) {
    return await prisma.workspace.findFirst({
      where: {
        slug,
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: {
            projects: true,
            members: true,
          },
        },
      },
    });
  },

  /**
   * Fetch all workspaces a user is a member of
   */
  getUserWorkspaces: async (userId: string) => {
    // We query the Workspace table, but filter it by checking if the 
    // connected 'members' array contains this specific user.
    return await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      orderBy: {
        createdAt: "desc" // Shows the newest workspaces first
      }
    });
  }

};
