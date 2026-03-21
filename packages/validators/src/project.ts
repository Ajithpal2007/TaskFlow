import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(50, "Project name is too long"),
  
  // The 'Identifier' is used for task keys (e.g., TFK-1, TFK-2)
  // It should be short, uppercase, and alphanumeric
  identifier: z
    .string()
    .min(2, "Identifier must be at least 2 characters")
    .max(10, "Identifier must be 10 characters or less")
    .regex(/^[A-Z0-9]+$/, "Identifier must be uppercase alphanumeric (e.g., 'PROJ')"),
  
  description: z
    .string()
    .max(500, "Description is too long")
    .optional(),
    
  workspaceId: z
    .string()
    .cuid("Invalid Workspace ID"),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().cuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;