"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@repo/validators";
import { useTasks } from "@/hooks/api/use-tasks";
import { useUIStore } from "../../app/lib/stores/use-ui-store"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@repo/ui/components/dialog";

import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";

// 🟢 1. Import the WebSocket Hook
import { useBoardSocket } from "@/hooks/use-board-socket"; 

export function CreateTaskDialog({ projectId, workspaceId }: { projectId: string, workspaceId: string }) {
  const { isCreateTaskModalOpen, setCreateTaskModalOpen } = useUIStore();
  const { createTask, isCreating } = useTasks(projectId);
  
  // 🟢 2. Initialize the Hook
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
    setCreateTaskModalOpen(false);
    form.reset();

    // 🟢 1. Create a temporary ID
    const tempId = crypto.randomUUID();

    // 🟢 2. Build the "Ghost Task"
    const optimisticTask = {
      ...data,
      id: tempId,
      sequenceId: "...", // Placeholder until DB generates it
      isPending: true, // We can use this to make the card slightly transparent in the UI!
      assignee: null,
      createdAt: new Date().toISOString()
    };

    // 🟢 3. INSTANT BROADCAST (0ms delay to Tab 2)
    broadcastUpdate({
      type: "TASK_OPTIMISTIC",
      payload: optimisticTask
    });

    // 🟢 4. Background Database Call
    createTask(data, {
      onSuccess: (newlyCreatedTask) => {
        // Once the DB finishes 4 seconds later, tell Tab 2 to swap the Ghost for the Real task
        broadcastUpdate({
          type: "TASK_CONFIRMED",
          payload: { tempId: tempId, realTask: newlyCreatedTask }
        });
      }
    });
  };

  return (
    <Dialog open={isCreateTaskModalOpen} onOpenChange={setCreateTaskModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Input {...form.register("title")} placeholder="Task title..." />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <Textarea {...form.register("description")} placeholder="Add a description..." />
          <DialogFooter>
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}