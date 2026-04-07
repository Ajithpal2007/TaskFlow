"use client";

import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useTask } from "@/hooks/api/use-task";
import { Dialog, DialogContent } from "@repo/ui/components/dialog";
import { Loader2 } from "lucide-react";

// 🟢 1. Added useParams so we can grab the workspace ID directly from the URL
import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";

// 🟢 2. Imported your workspace hook so we can fetch the users for the @mentions
import { useWorkspaces } from "@/hooks/api/use-workspaces";

// Import your modular components
import { TaskHeader } from "./task-header";
import { TaskTitle } from "./task-title";
import { TaskDescription } from "./task-description";
import { TaskSubtasks } from "./task-subtasks";
import { TaskActivity } from "./task-activity";
import { TaskSidebar } from "./task-sidebar";

export function TaskDetailsDialog() {
  const { activeTaskId, closeTaskDetails, selectedTaskId } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams(); // Gets { workspaceId: "..." } from the URL



  const urlTaskId = searchParams.get("taskId");
  const resolvedTaskId = activeTaskId || urlTaskId;

  const handleClose = () => {
    closeTaskDetails();
    if (urlTaskId) {
      router.push(pathname, { scroll: false });
    }
  };

  const {
    task,
    isLoading,
    updateTask,
    deleteTask,
    isDeleting,
    createSubtask,
    isCreatingSubtask,
    addComment,
    isAddingComment,
    linkIssue,
    unlinkIssue,
    deleteSubtask,
    updateSubtask,
  } = useTask(resolvedTaskId, handleClose, selectedTaskId);

  // 🟢 3. FIX THE 'activeWorkspace' ERROR: Fetch the workspace data here!
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w: any) => w.id === params.workspaceId);

  if (!resolvedTaskId) return null;

  // 🟢 4. FIX THE LINTER WARNING: Build the UI cleanly using an if/else block
  let dialogBody;

  if (isLoading) {
    dialogBody = (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  } else if (!task) {
    dialogBody = (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground">
        Task not found or has been deleted.
      </div>
    );
  } else {
    dialogBody = (
      // 🟢 1. md:flex-nowrap physically prevents the right column from wrapping to the bottom!
      <div className="flex flex-col md:flex-row md:flex-nowrap w-full h-full overflow-hidden bg-background">

        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        {/* 🟢 2. min-w-0 and flex-1 means it takes the remaining space but NEVER pushes the right column away */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <TaskHeader task={task} updateTask={updateTask} />
          <TaskTitle task={task} updateTask={updateTask} />

          <div className="w-full min-w-0 overflow-hidden">
            <TaskDescription
              task={task}
              updateTask={(data) => updateTask({ taskId: task.id, updates: data })}
            />
          </div>

          <div className="p-6 md:p-8 pt-0 space-y-10 w-full min-w-0 overflow-hidden">
            <TaskSubtasks
              task={task}
              createSubtask={createSubtask}
              isCreatingSubtask={isCreatingSubtask}
              updateSubtask={updateSubtask}
              deleteSubtask={deleteSubtask}
            />
            <TaskActivity
              task={task}
              workspaceUsers={activeWorkspace?.members || []}
              addComment={addComment}
              isAddingComment={isAddingComment}
              linkIssue={linkIssue}
              unlinkIssue={unlinkIssue}
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: SIDEBAR METADATA --- */}
        {/* 🟢 3. shrink-0 guarantees this stays EXACTLY 280px wide on the right side */}
        <div className="w-full md:w-[280px] shrink-0 h-full overflow-y-auto border-t md:border-t-0 md:border-l bg-muted/10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="p-6">
            <TaskSidebar
              task={task}
              updateTask={updateTask}
              deleteTask={deleteTask}
              isDeleting={isDeleting}
            />
          </div>
        </div>

      </div>
    );
  }

  return (
    <Dialog open={!!resolvedTaskId} onOpenChange={(open) => !open && handleClose()}>
      {/* 🟢 4. max-w-4xl makes the modal "Medium" sized (not huge!) */}
      {/* 🟢 5. gap-0 and border-0 stop Shadcn UI from injecting unwanted padding/grid rules */}
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] p-0 flex flex-col overflow-hidden gap-0 border-none outline-none">
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}