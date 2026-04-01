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
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [{ slug: slug }, { id: slug }],
        members: { some: { userId } },
      },
      include: {
        members: { include: { user: true } },
        _count: { select: { projects: true } },
      },
    });

    if (!workspace) return null;

    // 🟢 THE FIX: Find the current user in the members array
    const myMembership = workspace.members.find(m => m.userId === userId);

    // 🟢 Inject their specific role at the top level of the object
    return {
      ...workspace,
      role: myMembership?.role || null, 
    };
  },

  /**
   * Fetch all workspaces a user is a member of
   */
  getUserWorkspaces: async (userId: string) => {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId: userId } }
      },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: "desc" }
    });

    // 🟢 THE FIX: Loop through all the workspaces and attach the role
    return workspaces.map((workspace) => {
      // Find the membership for this specific user
      const myMembership = workspace.members.find(m => m.userId === userId);

      return {
        ...workspace,
        role: myMembership?.role || null, // Inject it at the top level
      };
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

