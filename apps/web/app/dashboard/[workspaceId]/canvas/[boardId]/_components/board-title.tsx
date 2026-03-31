"use client";

import { useState, useRef, useEffect } from "react";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export function BoardTitle({
  initialTitle,
  boardId,
  workspaceId,
}: {
  initialTitle: string;
  boardId: string;
  workspaceId: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically focus the input when the user clicks the title
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Highlights the text for quick overwriting
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    
    const newTitle = title.trim();
    if (newTitle === "" || newTitle === initialTitle) {
      setTitle(initialTitle); // Revert if they emptied it or didn't change anything
      return;
    }

    try {
      // 🚀 Hit your new Fastify route!
      await apiClient.patch(
        `/canvas/workspaces/${workspaceId}/boards/${boardId}`,
        { title: newTitle }
      );
      // We don't need a success toast here; silent saves feel much more native.
    } catch (error) {
      toast.error("Failed to save title");
      setTitle(initialTitle); // Revert UI on failure
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setTitle(initialTitle); // Cancel edits
    }
  };

  if (isEditing) {
    return (
      <input 
        type="text"
        placeholder="Edit title"
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave} // Saves when the user clicks anywhere else on the screen
        onKeyDown={handleKeyDown}
        className="font-bold text-lg bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 -ml-2 w-64"
      />
    );
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className="font-bold text-lg cursor-pointer hover:bg-muted px-2 -ml-2 rounded transition-colors truncate max-w-sm"
      title="Click to edit"
    >
      {title}
    </h1>
  );
}