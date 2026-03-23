"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { TaskCard } from "./task-card";
import { useTasks } from "@/hooks/api/use-tasks";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";

interface KanbanColumnProps {
  status: string;
  label: string;
  tasks: any[];
  projectId: string; // 🟢 Make sure you pass this from the Board!
}

export function KanbanColumn({ status, label, tasks, projectId }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });
  const { createTask } = useTasks(projectId);

  // Local state for the inline input
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (title.trim()) {
      // Instantly fire the creation mutation
      createTask({ title: title.trim(), status, projectId });
    }
    // Reset and hide the input
    setTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTitle("");
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col w-80 shrink-0 bg-muted/30 rounded-xl p-3 border border-transparent hover:border-border/50 transition-colors">
      
      {/* COLUMN HEADER */}
      <div className="font-semibold text-sm mb-4 px-1 flex justify-between items-center text-muted-foreground">
        <span className="uppercase tracking-wider text-[11px]">{label}</span> 
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
      </div>

      {/* DROPPABLE AREA */}
      <div ref={setNodeRef} className="flex-1 flex flex-col min-h-[150px]">
        {tasks.map(task => <TaskCard key={task.id} task={task} />)}

        {/* 🟢 THE INLINE CREATOR */}
        {isAdding ? (
          <div className="mt-1 pb-2">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave} // Saves if they click outside the box!
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="h-10 text-sm shadow-sm border-primary focus-visible:ring-1"
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground mt-1 h-9 px-2 text-xs opacity-70 hover:opacity-100 hover:bg-muted/50"
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