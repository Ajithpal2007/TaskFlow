"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/app/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store"; 

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Plus } from "lucide-react";

const workspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required"),
});

type FormData = z.infer<typeof workspaceSchema>;

// 🟢 1. Create the TypeScript Interface to accept the prop
interface CreateWorkspaceDialogProps {
  isFirstWorkspace?: boolean;
}

// 🟢 2. Destructure the prop and give it a default value of false
export function CreateWorkspaceDialog({ isFirstWorkspace = false }: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);
  
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "" }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await apiClient.post("/workspaces", { name: data.name });
      const newWorkspace = response.data?.data; 

      if (newWorkspace?.id) {
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        setActiveWorkspaceId(newWorkspace.id);
        
        setIsOpen(false);
        form.reset();
        
        router.push(`/dashboard/${newWorkspace.id}`);
      }
    } catch (error: any) {
      console.error("API Error creating workspace:", error);
      form.setError("root", {
        type: "manual",
        message: error.response?.data?.message || "Failed to create workspace. Please try again."
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) form.reset();
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* 🟢 3. Make the UI dynamic based on the prop! */}
        <Button size={isFirstWorkspace ? "lg" : "default"} className="gap-2 shadow-sm">
          <Plus className="h-5 w-5" />
          {isFirstWorkspace ? "Create Your First Workspace" : "New Workspace"}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            A workspace contains all your team's projects, tasks, and members.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corp" autoFocus {...field} />
                  </FormControl>
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
              {form.formState.isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}