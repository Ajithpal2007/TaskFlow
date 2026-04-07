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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  } else if (!task) {
    dialogBody = (
      <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground text-sm">
        Task not found or has been deleted.
      </div>
    );
  } else {
    dialogBody = (
      // Outer wrapper: full height, no overflow — children handle their own scroll
      <div className="flex flex-col md:flex-row w-full h-full overflow-hidden">

        {/* ── LEFT: Main content column ── */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

          {/* Breadcrumb / task header — fixed inside left column, never scrolls */}
          <div className="shrink-0 px-6 pt-5 pb-0 border-b border-border/60">
            <TaskHeader task={task} updateTask={updateTask} />
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-6
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-border
            [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Action bar (Create Subtask · Link Issue · Attach) */}
            <div className="flex items-center gap-1 -mx-1">
              <TaskTitle task={task} updateTask={updateTask} />
            </div>

            <TaskDescription
              task={task}
              updateTask={(data) => updateTask({ taskId: task.id, updates: data })}
            />

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

        {/* ── RIGHT: Sidebar metadata column ── */}
        <div className="
          w-full md:w-[300px] shrink-0
          h-full overflow-y-auto overflow-x-hidden
          border-t md:border-t-0 md:border-l border-border/60
          bg-muted/20
          px-5 py-5
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-border
          [&::-webkit-scrollbar-thumb]:rounded-full
        ">
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
      {/*
        - max-w-5xl  → wide enough for two columns
        - h-[85vh]   → tall but not full-screen
        - p-0        → we handle all internal padding ourselves
        - overflow-hidden → children use their own scroll, dialog never grows
      */}
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col overflow-hidden gap-0 rounded-xl">
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}