"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "../../app/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/app/lib/stores/use-ui-store"; // Check your path


import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";

// Validation: Identifier must be short and uppercase
const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  identifier: z.string()
    .min(2, "Min 2 characters")
    .max(6, "Max 6 characters")
    .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers allowed"),
});

type FormData = z.infer<typeof projectSchema>;

export function CreateProjectDialog({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const { isCreateProjectModalOpen, setCreateProjectModalOpen } = useUIStore();
  
  const form = useForm<FormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", identifier: "" }
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Send to Fastify API
      await apiClient.post("/projects", {
        name: data.name,
        identifier: data.identifier,
        workspaceId: workspaceId,
      });
      
      // Refresh the projects list to trigger the Kanban board render
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
      
      // Close modal and reset form
      setCreateProjectModalOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("API Error creating project:", error);
    }
  };

  return (
    <Dialog open={isCreateProjectModalOpen} onOpenChange={setCreateProjectModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Name</label>
            <Input 
              {...form.register("name")} 
              placeholder="e.g. Frontend Redesign" 
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project Identifier</label>
            <Input 
              {...form.register("identifier")} 
              placeholder="e.g. FRD, ENG, TASK" 
              onChange={(e) => {
                // Auto-uppercase as the user types
                e.target.value = e.target.value.toUpperCase();
                form.setValue("identifier", e.target.value);
              }}
            />
            <p className="text-[10px] text-muted-foreground">
              This is used to generate task numbers (e.g., ENG-1).
            </p>
            {form.formState.errors.identifier && (
              <p className="text-xs text-red-500">{form.formState.errors.identifier.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}