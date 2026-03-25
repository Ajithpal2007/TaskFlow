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
    // This is the main grid when the task exists!
    dialogBody = (
      <div className="flex-1 overflow-y-auto overflow-x-hidden grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] h-full">
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        <div className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <TaskHeader task={task} updateTask={updateTask} />
          <TaskTitle task={task} updateTask={updateTask} />
          <TaskDescription
            task={task}
            updateTask={(data) => updateTask({ taskId: task.id, updates: data })}
          />

          <div className="p-6 md:p-8 pt-0 space-y-10">
            <TaskSubtasks
              task={task}
              createSubtask={createSubtask}
              isCreatingSubtask={isCreatingSubtask}
              updateSubtask={updateSubtask}
              deleteSubtask={deleteSubtask}
            />
            <TaskActivity
              task={task}
              // It now has the exact array it needs!
              workspaceUsers={activeWorkspace?.members || []} 
              addComment={addComment}
              isAddingComment={isAddingComment}
              linkIssue={linkIssue}
              unlinkIssue={unlinkIssue}
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: SIDEBAR METADATA --- */}
        <div className="bg-muted/10 border-l p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <TaskSidebar
            task={task}
            updateTask={updateTask}
            deleteTask={deleteTask}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    );
  }

  return (
    <Dialog open={!!resolvedTaskId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-5xl flex flex-col h-[85vh] p-0 overflow-hidden gap-0">
        {/* 🟢 5. Drop the clean variable here instead of the messy nested ternaries */}
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}