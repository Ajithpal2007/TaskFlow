"use client";

import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useTask } from "@/hooks/api/use-task";
import { Dialog, DialogContent } from "@repo/ui/components/dialog";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Import your modular components
import { TaskHeader } from "./task-header";
import { TaskTitle } from "./task-title";
import { TaskDescription } from "./task-description";
import { TaskSubtasks } from "./task-subtasks";
import { TaskActivity } from "./task-activity";
import { TaskSidebar } from "./task-sidebar";

export function TaskDetailsDialog() {
  // 1. Get Zustand state
  const { activeTaskId, closeTaskDetails, selectedTaskId } = useUIStore();

  // 2. Get URL state
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("taskId");

  // 🟢 3. THE FIX: Merge the states! If either exists, we have a task to load.
  const resolvedTaskId = activeTaskId || urlTaskId;

  // 🟢 4. UNIFIED CLOSE: Clear Zustand AND remove the URL parameter
  const handleClose = () => {
    closeTaskDetails(); // Clears Zustand
    if (urlTaskId) {
      router.push(pathname, { scroll: false }); // Clears the URL without refreshing
    }
  };

  // 5. Pass the RESOLVED ID to your hook, and pass handleClose so the hook can close it on delete
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
  } = useTask(resolvedTaskId, handleClose, selectedTaskId); // <--- Use resolvedTaskId here!

  // 🟢 6. Use resolvedTaskId to determine if we render
  if (!resolvedTaskId) return null;

  return (
    // 🟢 7. Use resolvedTaskId for the open state, and handleClose for the close action
    <Dialog open={!!resolvedTaskId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[95vw] md:max-w-5xl flex flex-col h-[85vh] p-0 overflow-hidden gap-0">

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : task ? (

          /* THE MASTER GRID LAYOUT */
          <div className="flex-1 overflow-y-auto overflow-x-hidden grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] h-full">

            {/* --- LEFT COLUMN: MAIN CONTENT --- */}
            <div className="flex flex-col overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">

              <TaskHeader task={task} updateTask={updateTask} />
              <TaskTitle task={task} updateTask={updateTask} />
              <TaskDescription task={task} updateTask={updateTask} />

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

        ) : (
          /* NOT FOUND / ERROR STATE */
          <div className="flex h-full w-full items-center justify-center p-8 text-center text-muted-foreground">
            Task not found or has been deleted.
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}