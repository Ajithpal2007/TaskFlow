"use client";

import { useState } from "react";
import Image from "next/image";
import { useTasks } from "@/hooks/api/use-tasks";
import { useUIStore } from "@/app/lib/stores/use-ui-store";

import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { 
  Plus, CheckCircle2, Bug, Sparkles, AlertCircle, ArrowUp, ArrowRight, ArrowDown, Minus, ArrowUpRight,Bookmark, Hexagon, Layers
} from "lucide-react";

// Reuse the configurations so the icons match the board
const typeConfig = {
  BUG: { icon: Bug, color: "text-red-500" },
  FEATURE: { icon: Sparkles, color: "text-blue-500" },
  TASK: { icon: CheckCircle2, color: "text-green-500" },
  EPIC: { icon: Hexagon, color: "text-purple-500" },
  STORY: { icon: Bookmark, color: "text-yellow-500" },
  SUBTASK: { icon: Layers, color: "text-blue-400" },
} as const;

const priorityConfig = {
  NONE: { icon: Minus, color: "text-gray-500" },
  LOW: { icon: ArrowDown, color: "text-blue-500" },
  MEDIUM: { icon: ArrowRight, color: "text-yellow-500" },
  HIGH: { icon: ArrowUp, color: "text-orange-500" },
  URGENT: { icon: AlertCircle, color: "text-red-500" },
} as const;

export function BacklogView({ projectId, workspaceId }: { projectId: string; workspaceId: string }) {
  const { tasks, isLoading, createTask, updateTask } = useTasks(projectId);
  const openTaskDetails = useUIStore((state) => state.openTaskDetails);
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  if (isLoading) return <div className="text-muted-foreground p-4">Loading backlog...</div>;

  // 🟢 Filter out everything except the Backlog tasks
  const backlogTasks = tasks?.filter((t: any) => t.status === "BACKLOG") || [];

  const handleSave = () => {
    if (title.trim()) {
      createTask({ 
        title: title.trim(), 
        status: "BACKLOG", // 🟢 Forces it into the backlog!
        projectId, 
        workspaceId 
      });
    }
    setTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setTitle(""); setIsAdding(false); }
  };

  // 🟢 Move to Board function
  const moveToBoard = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Prevents opening the modal
    updateTask({ taskId, updates: { status: "TODO" } }); // Sends it to the board!
  };

  return (
    <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
      
      {/* List Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b text-sm font-semibold text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Backlog</span>
          <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{backlogTasks.length} issues</span>
        </div>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-border/50">
        {backlogTasks.length === 0 && !isAdding && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Your backlog is empty. Time to plan some work!
          </div>
        )}

        {backlogTasks.map((task: any) => {

          const safeType = typeConfig[task.type as keyof typeof typeConfig] || typeConfig.TASK;
          const safePriority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.NONE;


          const TypeIcon = safeType.icon;
          const typeColor = safeType.color;
          const PriorityIcon = safePriority.icon;

          return (
            <div 
              key={task.id}
              onClick={() => openTaskDetails(task.id)}
              className="group flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <TypeIcon className={`h-4 w-4 shrink-0 ${typeColor}`} />
                <span className="text-xs font-medium text-muted-foreground shrink-0 w-16">
                  {task.project?.identifier}-{task.sequenceId}
                </span>
                <span className="text-sm font-medium truncate">{task.title}</span>
              </div>

              <div className="flex items-center gap-4 shrink-0 pl-4">
                {/* Send to Board Button (Hidden until hover) */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => moveToBoard(e, task.id)}
                  className="opacity-0 group-hover:opacity-100 h-7 px-2 text-xs transition-opacity"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Send to Board
                </Button>

                <PriorityIcon className="h-4 w-4 text-muted-foreground opacity-50" />
                
                <div className="h-6 w-6 rounded-full bg-secondary overflow-hidden border flex items-center justify-center shrink-0">
                  {task.assignee?.image ? (
                    <Image src={task.assignee.image} alt="Avatar" fill className="object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase">
                      {task.assignee?.name?.charAt(0) || "-"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Inline Creator */}
        {isAdding ? (
          <div className="p-2 bg-muted/10">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="h-9 text-sm border-primary focus-visible:ring-1 bg-background"
            />
          </div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Issue
          </button>
        )}
      </div>
    </div>
  );
}