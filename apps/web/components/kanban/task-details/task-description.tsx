"use client";

import { useState, useEffect } from "react";
import { AlignLeft } from "lucide-react";
import { RichTextEditor } from "@/components/kanban/rich-text-editor"; 

interface TaskDescriptionProps {
  task: any;
  // 🟢 1. Update the type to match your React Query mutation exactly
  updateTask: (payload: { taskId: string; updates: any }) => void;
}

export function TaskDescription({ task, updateTask }: TaskDescriptionProps) {
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDescription(task?.description || "");
  }, [task?.description]);

  const handleSave = () => {
    // Only save if the text actually changed
    if (description !== (task?.description || "")) {
      
      // 🟢 2. THE FIX: Wrap the payload correctly!
      // We must pass the taskId, and put the description inside the 'updates' object
      updateTask({ 
        taskId: task.id, 
        updates: { description } 
      });
      
    }
  };

  const isEmpty = !description || description === "<p></p>" || description === "";

  return (
    <div className="px-6 md:px-8 pt-4 pb-6 space-y-3">
      <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
        <AlignLeft className="h-5 w-5 text-muted-foreground" />
        Description
      </div>
      
      <div className="ml-7">
        {!isEditing && isEmpty && (
          <div
            onClick={() => setIsEditing(true)}
            className="py-6 px-4 text-sm text-muted-foreground bg-muted/20 hover:bg-muted/50 border border-dashed rounded-lg cursor-text transition-all text-center"
          >
            No description provided. Click to add one.
          </div>
        )}

        <div className={!isEditing && isEmpty ? "hidden" : "block"}>
          <RichTextEditor 
            value={description} 
            onChange={setDescription} 
            onBlur={handleSave}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </div>
      </div>
    </div>
  );
}