import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;