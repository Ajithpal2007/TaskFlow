"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus, AlertTriangle, AlertTriangleIcon } from "lucide-react";

import { TaskCard } from "./task-card";
import { useTasks } from "@/hooks/api/use-tasks";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";

// 🟢 1. Update the interface
interface KanbanColumnProps {
  status: string;
  label: string;
  tasks: any[];
  projectId: string;
  workspaceId: string;
  wipLimit?: number; // 👈 Add the optional limit
}

export function KanbanColumn({
  status,
  label,
  tasks,
  projectId,
  workspaceId,
  wipLimit
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const { createTask } = useTasks(projectId);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (title.trim()) {
      createTask({ title: title.trim(), status, projectId, workspaceId });
    }
    setTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setTitle(""); setIsAdding(false); }
  };

  // 🟢 2. Calculate if the column is overwhelmed
  const isOverLimit = wipLimit !== undefined && tasks.length > wipLimit;

  return (
    <div
      className={`flex flex-col w-80 shrink-0 rounded-xl p-3 border transition-colors ${isOverLimit
          ? "bg-red-500/5 border-red-500/20" // 🚨 Warning state background
          : "bg-muted/30 border-transparent hover:border-border/50" // Normal state
        }`}
    >
      {/* COLUMN HEADER */}
      <div className="font-semibold text-sm mb-4 px-1 flex justify-between items-center">

        <div className="flex items-center gap-2">
          <span className={`uppercase tracking-wider text-[11px] ${isOverLimit ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
            {label}
          </span>
          {/* 🚨 Show a warning icon if over limit */}
          {isOverLimit && (
            <span title={`WIP Limit exceeded! Max ${wipLimit}`}>
              <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            </span>
          )}
        </div>

        {/* Counter Badge */}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isOverLimit ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
          }`}>
          {tasks.length} {wipLimit ? `/ ${wipLimit}` : ""}
        </span>
      </div>

      {/* DROPPABLE AREA */}
      <div ref={setNodeRef} className="flex-1 flex flex-col min-h-[150px]">
        {tasks.map(task => <TaskCard key={task.id} task={task} />)}

        {/* THE INLINE CREATOR */}
        {isAdding ? (
          <div className="mt-1 pb-2">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="h-10 text-sm shadow-sm border-primary focus-visible:ring-1"
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            className={`w-full justify-start mt-1 h-9 px-2 text-xs opacity-70 hover:opacity-100 hover:bg-muted/50 ${isOverLimit ? "text-red-600 hover:text-red-700 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground"
              }`}
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Issue
          </Button>
        )}
      </div>
    </div>
  );
}