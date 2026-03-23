"use client";

import { useState, useEffect, useRef } from "react";
import { DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button"; // <-- Added Button
import { Pencil } from "lucide-react"; // <-- Added Pencil Icon

interface TaskTitleProps {
  task: any; 
  updateTask: (updates: any) => void;
}

export function TaskTitle({ task, updateTask }: TaskTitleProps) {
  // Local state to handle the edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(task?.title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync if the task updates from the server
  useEffect(() => {
    if (task?.title) {
      setTitleValue(task.title);
    }
  }, [task?.title]);

  if (!task) return null;

  const handleSave = () => {
    setIsEditing(false);
    // Only fire the API mutation if the title actually changed and isn't empty
    if (titleValue.trim() !== task.title && titleValue.trim() !== "") {
      updateTask({ title: titleValue.trim() });
    } else {
      // Revert to original if they deleted everything
      setTitleValue(task.title); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setIsEditing(false);
      setTitleValue(task.title); // Cancel and revert
    }
  };

  return (
    // 🟢 Added 'group flex items-start gap-2' to the wrapper
    <div className="px-8 pt-2 pb-6 group flex items-start gap-2">
      {isEditing ? (
        <Input
          ref={inputRef}
          autoFocus
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          // Added 'flex-1' so the input stretches to fill the space
          className="flex-1 w-full text-2xl font-semibold leading-tight text-foreground bg-transparent border-2 border-primary rounded-md px-2 py-1 outline-none"
        />
      ) : (
        <>
          <DialogTitle 
            onClick={() => setIsEditing(true)}
            // Added 'flex-1' to push the pencil button to the right side of the title if needed
            className="flex-1 text-2xl font-semibold leading-tight text-foreground hover:bg-muted/50 cursor-text rounded-md px-2 py-1 -ml-2 transition-colors border-2 border-transparent"
          >
            {task.title}
          </DialogTitle>
          
          {/* 🟢 The Hover-Reveal Pencil Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 mt-1 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit title</span>
          </Button>
        </>
      )}
    </div>
  );
}