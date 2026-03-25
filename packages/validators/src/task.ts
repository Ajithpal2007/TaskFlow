import { z } from "zod";

 


export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().optional().nullable(),
  

  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELED"]).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  projectId: z.string().cuid(),
  workspaceId: z.string().cuid().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  
  type: z.enum(["EPIC", "STORY", "TASK", "BUG", "SUBTASK"]).optional(),
  storyPoints: z.number().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
});


export const updateTaskSchema = createTaskSchema.partial().extend({
  sequenceId: z.number().optional(),
  description: z.string().optional().nullable(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;