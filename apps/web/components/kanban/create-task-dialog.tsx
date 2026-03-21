"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, type CreateTaskInput } from "@repo/validators";
import { useTasks } from "@/hooks/api/use-tasks";
import { useUIStore } from "../../app/lib/stores/use-ui-store"; // NOTE 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@repo/ui/components/dialog";

import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";

export function CreateTaskDialog({ projectId, workspaceId }: { projectId: string, workspaceId: string }) {
  const { isCreateTaskModalOpen, setCreateTaskModalOpen } = useUIStore();
  const { createTask, isCreating } = useTasks(projectId);

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

  const onSubmit = async (data: CreateTaskInput) => {
    await createTask(data);
    form.reset();
    setCreateTaskModalOpen(false);
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