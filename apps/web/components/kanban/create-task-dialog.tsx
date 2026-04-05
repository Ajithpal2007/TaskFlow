"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@repo/validators";
import { useTasks } from "@/hooks/api/use-tasks";
import { useUIStore } from "../../app/lib/stores/use-ui-store";
import { useBoardSocket } from "@/hooks/use-board-socket";

// 🟢 1. Import the AI Hook and Icons

import { Sparkles, Loader2 } from "lucide-react";

import { Input } from "@repo/ui/components/input";
import { RichTextEditor } from "@/components/kanban/rich-text-editor";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@repo/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import {  useState } from "react";

export function CreateTaskDialog({ projectId, workspaceId }: { projectId: string, workspaceId: string }) {
  const { isCreateTaskModalOpen, setCreateTaskModalOpen } = useUIStore();
  const { createTask, isCreating } = useTasks(projectId);
  const { broadcastUpdate } = useBoardSocket(projectId);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      projectId,
      workspaceId,
      status: "TODO",
      priority: "NONE",
    },
  });


  // 🟢 1. Use standard React state instead of Vercel's hook
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 2. The Bulletproof Vanilla JS Stream Reader
  const handleAutoDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    const title = form.getValues("title");
    if (!title) return;

    setIsLoading(true);
    setCompletion(""); // Clear the box

    try {
      const response = await fetch(`${apiUrl}/api/ai/generate-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Draft a technical ticket for this title: ${title}` }),
        credentials: "include",
      });

      if (!response.body) throw new Error("No response body");

      // This reads the raw text chunks exactly as they arrive from Fastify
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulatedText += decoder.decode(value, { stream: true });

        // Update the screen instantly
        setCompletion(accumulatedText);
        // Save it to the form so you can submit it
        form.setValue("description", accumulatedText, { shouldDirty: true, shouldValidate: true });
      }
    } catch (error) {
      console.error("Stream failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: CreateTaskInput) => {
    setCreateTaskModalOpen(false);
    form.reset();

    const tempId = crypto.randomUUID();

    const optimisticTask = {
      ...data,
      id: tempId,
      sequenceId: "...",
      isPending: true,
      assignee: null,
      createdAt: new Date().toISOString()
    };

    broadcastUpdate({
      type: "TASK_OPTIMISTIC",
      payload: optimisticTask
    });

    createTask(data, {
      onSuccess: (newlyCreatedTask) => {
        broadcastUpdate({
          type: "TASK_CONFIRMED",
          payload: { tempId: tempId, realTask: newlyCreatedTask }
        });
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) form.reset();
    setCreateTaskModalOpen(open);
  };

  
    
    
  
   

  return (
    <Dialog open={isCreateTaskModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new issue to your project board.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Update landing page hero image" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            
           {/* 🟢 The upgraded Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Description</FormLabel>
                    
                    {/* The Magic Button */}
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      // Use onMouseDown just like the other component to prevent focus issues!
                      onMouseDown={handleAutoDraft}
                      disabled={isLoading || !form.watch("title")}
                      className="h-7 text-xs bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20 transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {isLoading ? "Drafting..." : "Auto-Draft"}
                    </Button>
                  </div>

                  <FormControl>
                    {/* 🟢 The Illusion Swap for the Create Dialog */}
                    {isLoading ? (
                      /* 1. The Streaming HTML Viewer */
                      <div 
                        className="p-4 border rounded-md bg-muted/10 h-[200px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: completion }}
                      />
                    ) : (
                      /* 2. The Interactive Rich Text Editor */
                      <div className="border rounded-md h-[200px] overflow-y-auto">
                        <RichTextEditor 
                          value={field.value} 
                          onChange={field.onChange} 
                          
                          onBlur={() => {}}
                          
                          isEditing={true} 
                          setIsEditing={() => {}} 
                        />
                      </div>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BACKLOG">Backlog</SelectItem>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isLoading}>
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}