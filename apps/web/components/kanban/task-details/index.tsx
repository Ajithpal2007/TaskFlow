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
      // 🟢 The Ironclad Layout: flex-nowrap ensures it never drops to the bottom!
      <div className="flex flex-col md:flex-row md:flex-nowrap w-full h-full overflow-hidden bg-background">
        
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
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
        {/* 🟢 shrink-0 ensures the sidebar stays firmly on the right side */}
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
      {/* 🟢 max-w-4xl keeps it medium-sized, no more full-screen blowouts! */}
      <DialogContent className="w-[95vw] max-w-4xl h-[85vh] p-0 flex flex-col overflow-hidden gap-0 border-none outline-none">
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}