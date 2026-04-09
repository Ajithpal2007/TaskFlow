"use client";

// 🟢 1. Added useMemo here!
import { useEffect, useState, useMemo } from "react";
import { Tldraw, createTLStore, defaultShapeUtils, useEditor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/app/lib/api-client"; 
import { uploadFiles } from "@/app/lib/uploadthing"; 

// 🟢 2. Added ClientSideSuspense here!
import { LiveblocksProvider, RoomProvider, useRoom, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";

// ---------------------------------------------------------
// 1. THUMBNAIL GENERATOR COMPONENT (Unchanged)
// ---------------------------------------------------------
function ThumbnailGenerator({ workspaceId, boardId }: { workspaceId: string, boardId: string }) {
  const editor = useEditor();
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveThumbnail = async () => {
    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    if (shapeIds.length === 0) {
      return toast.error("Canvas is empty! Draw something first.");
    }

    setIsUploading(true);
    toast.loading("Snapping thumbnail...");

    try {
      const result = await editor.toImage(shapeIds, {
        format: 'png',
        background: true,
        padding: 32 
      });

      if (!result) throw new Error("Canvas export failed to generate an image.");

      const file = new File([result.blob], `thumbnail-${boardId}.png`, { type: "image/png" });
      const uploadRes = await uploadFiles("imageUploader", { files: [file] });
      const uploadedUrl = uploadRes[0].url;

      await apiClient.patch(`/canvas/workspaces/${workspaceId}/boards/${boardId}`, { 
        imageUrl: uploadedUrl 
      });

      toast.success("Dashboard thumbnail updated!");
    } catch (error) {
      console.error("Thumbnail error:", error);
      toast.error("Failed to save thumbnail");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <button 
      onClick={handleSaveThumbnail}
      disabled={isUploading}
      className="bg-background border rounded-md px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-muted transition-colors pointer-events-auto"
    >
      {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "📸"}
      {isUploading ? "Saving..." : "Save Thumbnail"}
    </button>
  );
}

// ---------------------------------------------------------
// 2. THE MULTIPLAYER CANVAS

function CollaborativeEditor({ roomId, workspaceId, boardId }: { roomId: string, workspaceId: string, boardId: string }) {
  // All Liveblocks and custom UI are temporarily removed for the test.
  
  return (
    <div className="absolute inset-0">
      <Tldraw autoFocus inferDarkMode />
    </div>
  );
}

// ---------------------------------------------------------
// 3. THE AUTH PROVIDER WRAPPER
// ---------------------------------------------------------
// 🔴 ULTRA SAFE MODE: No Liveblocks, No Suspense, No Auth. Just the Canvas.
export function Whiteboard({ roomId, workspaceId, boardId }: { roomId: string, workspaceId: string, boardId: string }) {
  
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 50 }}>
      <Tldraw autoFocus inferDarkMode />
    </div>
  );
}