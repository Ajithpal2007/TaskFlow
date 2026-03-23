"use client";

import { useState, useEffect } from "react"; 
import { AlignLeft } from "lucide-react";
import { Textarea } from "@repo/ui/components/textarea"; 

interface TaskDescriptionProps {
  task: any;
  updateTask: (updates: any) => void;
}

export function TaskDescription({ task, updateTask }: TaskDescriptionProps) {
  // 1. Initialize with the actual task description, not just ""
  const [description, setDescription] = useState(task?.description || "");
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  // 2. Keep it in sync if another user updates the task or you switch tasks
  useEffect(() => {
    if (task?.description !== undefined) {
      setDescription(task.description || "");
    }
  }, [task?.description]);

  if (!task) return null;

  const handleDescriptionBlur = () => {
    // Only save to the database if the text ACTUALLY changed
    if (description !== (task.description || "")) {
      setIsSavingDesc(true);
      
      updateTask({ description });
      
      // Flash the "Saving..." text for a quick UX confirmation
      setTimeout(() => setIsSavingDesc(false), 1500); 
    }
  };

  // 3. Removed the Sticky Header wrappers. It's just a clean content block now!
  return (
    <div className="space-y-4 px-8 pt-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <AlignLeft className="h-5 w-5 text-muted-foreground" />
          Description
        </div>
        
        {isSavingDesc && (
          <span className="text-xs font-medium text-muted-foreground animate-pulse">
            Saving...
          </span>
        )}
      </div>

      <div className="ml-7">
        <Textarea
          placeholder="Add a more detailed description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          className="min-h-[140px] resize-none border-transparent bg-muted/10 hover:bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
        />
      </div>
      
    </div>
  );
}