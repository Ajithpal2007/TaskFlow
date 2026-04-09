"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";

// 🟢 1. Add workspaceId to the props definition!
export function DeleteBoardButton({ roomId, workspaceId }: { roomId: string; workspaceId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this whiteboard? This cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      // 🟢 2. Now workspaceId is available to use in the URL
      await apiClient.delete(`/canvas/workspaces/${workspaceId}/boards/${roomId}`);
      
      router.refresh(); 
    } catch (error) {
      console.error("Failed to delete board:", error);
      alert("Failed to delete whiteboard");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="h-8 w-8 flex items-center justify-center rounded-md bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive disabled:opacity-50"
      title="Delete Whiteboard"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}