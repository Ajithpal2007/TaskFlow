import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is too short").max(50),
  slug: z.string().min(2).max(20).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;