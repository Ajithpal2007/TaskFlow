"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";

export function DeleteBoardButton({ roomId }: { roomId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    // 1. Stop the click from bubbling up to any other elements
    e.preventDefault();
    e.stopPropagation();

    // 2. Add a quick confirmation so users don't accidentally delete their work!
    if (!confirm("Are you sure you want to delete this whiteboard? This cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      // 3. Call the Fastify route we just built
      await apiClient.delete(`/canvas/${roomId}`); 
      
      // 4. Tell Next.js to re-fetch the Server Component data instantly
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