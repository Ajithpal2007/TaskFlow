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

  wipLimits: z
    .object({
      backlog: z.number().min(0, "Backlog limit must be at least 0"),
      todo: z.number().min(0, "To-Do limit must be at least 0"),
      inProgress: z.number().min(0, "In Progress limit must be at least 0"),
      inReview: z.number().min(0, "In Review limit must be at least 0"),
      done: z.number().min(0, "Done limit must be at least 0"),
      canceled: z.number().min(0, "Canceled limit must be at least 0"),
    })
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().cuid(),
  
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;