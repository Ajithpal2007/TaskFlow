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
      // 🔴 BYPASSING TAILWIND ENTIRELY: Forcing side-by-side layout with raw CSS
      <div style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%", overflow: "hidden", backgroundColor: "var(--background)" }}>
        
        {/* --- LEFT COLUMN: MAIN CONTENT --- */}
        {/* 🔴 Forcing 32px padding so the header CANNOT stick to the top */}
        <div style={{ flex: "1 1 0%", minWidth: 0, overflowY: "auto", overflowX: "hidden", padding: "32px" }}>
          
          <TaskHeader task={task} updateTask={updateTask} />
          <TaskTitle task={task} updateTask={updateTask} />
          
          <div style={{ width: "100%", overflow: "hidden", marginTop: "16px" }}>
            <TaskDescription
              task={task}
              updateTask={(data) => updateTask({ taskId: task.id, updates: data })}
            />
          </div>

          <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "40px" }}>
            <div style={{ width: "100%", overflow: "hidden" }}>
              <TaskSubtasks
                task={task}
                createSubtask={createSubtask}
                isCreatingSubtask={isCreatingSubtask}
                updateSubtask={updateSubtask}
                deleteSubtask={deleteSubtask}
              />
            </div>
            <div style={{ width: "100%", overflow: "hidden" }}>
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
        </div>

        {/* --- RIGHT COLUMN: SIDEBAR METADATA --- */}
        {/* 🔴 Forcing EXACTLY 320px width. It mathematically cannot wrap to the bottom. */}
        <div style={{ width: "320px", flexShrink: 0, overflowY: "auto", padding: "32px", borderLeft: "1px solid rgba(150,150,150,0.2)", backgroundColor: "rgba(150,150,150,0.05)" }}>
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
      {/* 🔴 Bypassing Tailwind to force a perfect 1000px medium-sized modal */}
      <DialogContent 
        style={{ maxWidth: "1000px", width: "95vw", height: "85vh", padding: 0, overflow: "hidden" }}
        className="border-none outline-none"
      >
        {dialogBody}
      </DialogContent>
    </Dialog>
  );
}