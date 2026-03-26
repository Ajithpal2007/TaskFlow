"use client";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "../../app/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { useUIStore } from "@/app/lib/stores/use-ui-store"; 
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store"; 

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@repo/ui/components/form";

const projectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  identifier: z.string()
    .min(2, "Min 2 characters")
    .max(6, "Max 6 characters")
    .regex(/^[A-Z0-9]+$/, "Only uppercase letters and numbers allowed"),
});

type FormData = z.infer<typeof projectSchema>;

export function CreateProjectDialog() {
  const queryClient = useQueryClient();
  const { isCreateProjectModalOpen, setCreateProjectModalOpen } = useUIStore();

  const params = useParams();
  const urlWorkspaceId = params?.workspaceId as string;
  const storeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  
  // 🟢 Always prioritize the URL, fallback to the store
  const activeWorkspaceId = urlWorkspaceId || storeWorkspaceId;
  
  const form = useForm<FormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", identifier: "" }
  });

  const onSubmit = async (data: FormData) => {
    if (!activeWorkspaceId) {
      form.setError("root", { type: "manual", message: "No active workspace selected!" });
      return;
    }

    try {
      await apiClient.post("/projects", {
        name: data.name,
        identifier: data.identifier,
        workspaceId: activeWorkspaceId, 
      });
      
      // Refresh the projects list to trigger the sidebar update
      queryClient.invalidateQueries({ queryKey: ["projects", activeWorkspaceId] });
      
      // Close modal and reset form
      setCreateProjectModalOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("API Error creating project:", error);
      
      // 🟢 THE FIX: Perfectly matches your Fastify JSON payload
      const errData = error.response?.data;
      
      if (errData?.code === "P2002" || errData?.message?.includes("Unique constraint")) {
        form.setError("identifier", { 
          type: "manual", 
          message: `The identifier "${form.getValues("identifier")}" is already used in this workspace.` 
        });
      } else {
        form.setError("root", { 
          type: "manual", 
          message: errData?.message || "Failed to create project. Please try again." 
        });
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) form.reset();
    setCreateProjectModalOpen(open);
  };

  return (
    <Dialog open={isCreateProjectModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Group your tasks and issues into a new project board.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Frontend Redesign" 
                      autoFocus
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        // Auto-generate the identifier based on the name!
                        const nameVal = e.target.value;
                        if (!form.formState.dirtyFields.identifier && nameVal.length > 0) {
                          const initials = nameVal.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
                          const fallback = nameVal.substring(0, 3).toUpperCase();
                          const cleanSuggestion = (initials.length > 1 ? initials : fallback).replace(/[^A-Z0-9]/g, '');
                          form.setValue("identifier", cleanSuggestion);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Identifier</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. FRD, ENG, TASK" 
                      {...field} 
                      onChange={(e) => {
                        // Force uppercase instantly
                        const upperVal = e.target.value.toUpperCase();
                        field.onChange(upperVal);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    This is used to generate task numbers (e.g., ENG-1).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {form.formState.errors.root && (
              <div className="p-2 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}