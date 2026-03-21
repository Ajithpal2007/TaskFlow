import { prisma } from "@repo/database";

export const userService = {
  async updateUser(userId: string, data: { name?: string; image?: string }) {
    return prisma.user.update({
      where: { id: userId },
      
      data: {
        ...(data.name && { name: data.name }),
        ...(data.image && { image: data.image }),
      },
    });
  },
};