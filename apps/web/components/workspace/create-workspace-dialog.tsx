"use client";

import { useForm } from "react-hook-form";
// We temporarily remove the zodResolver here so it doesn't block the form asking for a slug
import { apiClient } from "../../app/lib/api-client";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useQueryClient } from "@tanstack/react-query";



import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";





// 1. Create a UI-only schema (only expects 'name')
const uiSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters"),
});

type FormData = z.infer<typeof uiSchema>;

export function CreateWorkspaceDialog({ isFirstWorkspace }: { isFirstWorkspace?: boolean }) {
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    resolver: zodResolver(uiSchema),
    defaultValues: { name: "" }
  });

  const onSubmit = async (data: FormData) => {
    console.log("1. Button Clicked! Form Data:", data); // DEBUG LOG

    try {
      // 2. Safely generate slug
      let generatedSlug = data.name
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\w-]+/g, '');
      
      generatedSlug = `${generatedSlug}-${Math.floor(Math.random() * 1000)}`;

      const payload = {
        name: data.name,
        slug: generatedSlug,
      };

      console.log("2. Sending payload to API:", payload); // DEBUG LOG

      // 3. Send to Fastify
      const response = await apiClient.post("/workspaces", payload);
      
      console.log("3. API Success!", response.data); // DEBUG LOG
      
      // 4. Trigger the Dashboard refresh
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      
    } catch (error: any) {
      console.error("API Error creating workspace:", error.response?.data || error.message);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div className="space-y-2">
          <label className="text-sm font-medium">Workspace Name</label>
          <Input 
            {...form.register("name")} 
            placeholder="e.g. Ajith's Team" 
            autoFocus
          />
          {/* SHOW ERRORS IF VALIDATION FAILS */}
          {form.formState.errors.name && (
            <p className="text-xs text-red-500 font-medium">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Workspace"}
        </Button>
      </form>
    </div>
  );
}