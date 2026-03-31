"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client"; 

export function CreateBoardButton({ workspaceId }: { workspaceId: string }) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Hit your Fastify backend to create a new board in Prisma
      // It should generate a unique Liveblocks Room ID and return it
      const response = await apiClient.post(`/canvas/workspaces/${workspaceId}`, {
        title: "Untitled Canvas"
      });
      
      const newBoard = response.data.data;
      
      // Instantly redirect the user into the newly created whiteboard room!
      router.push(`/dashboard/${workspaceId}/canvas/${newBoard.id}`);
      
    } catch (error) {
      console.error("Failed to create whiteboard", error);
      setIsCreating(false);
    }
  };

  return (
    <button 
      onClick={handleCreate}
      disabled={isCreating}
      className="flex flex-col border-2 border-dashed rounded-xl overflow-hidden bg-background hover:bg-muted/30 transition-all hover:border-primary/50 items-center justify-center min-h-[220px] gap-3 text-muted-foreground hover:text-foreground"
    >
      {isCreating ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Plus className="h-6 w-6" />
        </div>
      )}
      <span className="font-semibold text-sm">
        {isCreating ? "Creating Room..." : "New Whiteboard"}
      </span>
    </button>
  );
}