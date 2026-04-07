"use client";

import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useTask } from "@/hooks/api/use-task";
import { Dialog, DialogContent } from "@repo/ui/components/dialog";
import { Loader2 } from "lucide-react";

import { useSearchParams, useRouter, usePathname, useParams } from "next/navigation";
import { useWorkspaces } from "@/hooks/api/use-workspaces"; 

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
  const params = useParams(); 

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

  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w: any) => w.id === params.workspaceId);

  if (!resolvedTaskId) return null;

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
      // 🟢 1. STANDARD FLEX: No more grid. We use standard flex-row which Tailwind guarantees will compile.
      <div className="flex flex-col md:flex-row w-full h-full bg-background overflow-hidden">
        
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        {/* 🟢 2. STANDARD PADDING: px-6 py-6 guarantees the header won't touch the ceiling. flex-1 takes the remaining space. */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden px-6 py-6 md:px-8 md:py-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          <TaskHeader task={task} updateTask={updateTask} />
          <TaskTitle task={task} updateTask={updateTask} />
          
          <TaskDescription
            task={task}
            updateTask={(data) => updateTask({ taskId: task.id, updates: data })}
          />

          <div className="space-y-10 pt-8">
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
        {/* 🟢 3. STANDARD WIDTH: 'md:w-80' is exactly 320px. It is built into Tailwind, so it cannot be ignored! */}
        <div className="w-full md:w-80 shrink-0 h-full overflow-y-auto bg-muted/10 border-t md:border-t-0 md:border-l px-6 py-6 md:px-8 md:py-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
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
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden gap-0 border-none outline-none">
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}