"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@repo/validators";
import { useTasks } from "@/hooks/api/use-tasks";
import { useUIStore } from "../../app/lib/stores/use-ui-store"; 
import { useBoardSocket } from "@/hooks/use-board-socket"; 

import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@repo/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
// 🟢 1. Import Shadcn Form Components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";

export function CreateTaskDialog({ projectId, workspaceId }: { projectId: string, workspaceId: string }) {
  const { isCreateTaskModalOpen, setCreateTaskModalOpen } = useUIStore();
  const { createTask, isCreating } = useTasks(projectId);
  const { broadcastUpdate } = useBoardSocket(projectId);

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

  const onSubmit = (data: CreateTaskInput) => {
    // Optimistically close modal and clear form
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

    // INSTANT BROADCAST
    broadcastUpdate({
      type: "TASK_OPTIMISTIC",
      payload: optimisticTask
    });

    // Background Database Call
    createTask(data, {
      onSuccess: (newlyCreatedTask) => {
        broadcastUpdate({
          type: "TASK_CONFIRMED",
          payload: { tempId: tempId, realTask: newlyCreatedTask }
        });
      }
    });
  };

  // Reset form if modal is closed manually
  const handleOpenChange = (open: boolean) => {
    if (!open) form.reset();
    setCreateTaskModalOpen(open);
  };

  return (
    <Dialog open={isCreateTaskModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new issue to your project board.
          </DialogDescription>
        </DialogHeader>

        {/* 🟢 2. Wrap the form in the Shadcn <Form> provider */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
            
            {/* TITLE FIELD */}
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

            {/* DESCRIPTION FIELD */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details, acceptance criteria, or notes..." 
                      className="min-h-[100px] resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 🟢 3. Grid for Selectors (Priority & Status side-by-side) */}
            <div className="grid grid-cols-2 gap-4">
              {/* STATUS FIELD */}
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

              {/* PRIORITY FIELD */}
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
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}