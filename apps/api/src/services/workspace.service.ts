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
      // 🟢 1. Search by EITHER slug OR id
      OR: [
        { slug: slug },
        { id: slug }
      ],
      members: {
        some: { userId },
      },
    },
    include: {
      // 🟢 2. Fetch the members AND their user data (names/emails)
      members: {
        include: {
          user: true 
        }
      },
      _count: {
        select: {
          projects: true,
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
  },

  async updateWorkspace(workspaceId: string, name: string) {
    return await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  },

  // 🟢 2. Invite/Add a Member by Email
  async inviteMember(workspaceId: string, email: string) {
    // Check if the user exists in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User with this email does not exist.");
    }

    // Check if they are already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new Error("User is already a member of this workspace.");
    }

    // Add them to the workspace
    return await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: "MEMBER", // Default role from your schema
      },
    });
  },


};
