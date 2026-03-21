import { prisma } from "@repo/database";

export const tagService = {
  /** Fetch all tags for a specific workspace */
  async getTagsByWorkspace(workspaceId: string) {
    return await prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  },

  /** Create a new tag */
  async createTag(workspaceId: string, name: string, color: string) {
    return await prisma.tag.create({
      data: { workspaceId, name, color },
    });
  }
};