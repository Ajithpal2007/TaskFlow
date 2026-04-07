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
      // 1. The Master Wrapper: Forces exactly 100% height and width of the modal, no taller, no wider.
      <div className="flex w-full h-full flex-col md:flex-row overflow-hidden bg-background">
        
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        {/* 2. min-w-0: THIS IS THE MAGIC KEY. It forces the left side to wrap long text instead of pushing the sidebar away. */}
        <div className="flex-1 min-w-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
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
              workspaceUsers={activeWorkspace?.members || []} 
              addComment={addComment}
              isAddingComment={isAddingComment}
              linkIssue={linkIssue}
              unlinkIssue={unlinkIssue}
            />
          </div>
        </div>

        {/* --- RIGHT COLUMN: SIDEBAR METADATA --- */}
        {/* 3. shrink-0: This tells the browser "NEVER squish this sidebar, and NEVER wrap it to the bottom on desktop." */}
        <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l bg-muted/10 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="p-6 md:p-8">
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
      {/* 4. The Modal Frame: Fixed width, fixed height (85vh), no internal layout rules fighting us. */}
      <DialogContent className="w-[95vw] max-w-5xl h-[85vh] p-0 overflow-hidden">
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}