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
// ---------------------------------------------------------
function CollaborativeEditor({ roomId, workspaceId, boardId }: { roomId: string, workspaceId: string, boardId: string }) {
  const room = useRoom();

  // 🔴 FIX #1: MEMOIZE THE CUSTOM UI
  // This stops Tldraw from infinitely re-rendering and crashing the toolbars.
  const customComponents = useMemo(() => ({
    SharePanel: () => (
      <div className="flex items-center gap-2 pointer-events-none">
        
        {/* Our Thumbnail Button */}
        <ThumbnailGenerator workspaceId={workspaceId} boardId={boardId} />
        
        {/* Multiplayer Badge */}
        <div className="bg-background border rounded-md px-3 py-1.5 text-xs font-bold shadow-sm flex items-center gap-2 pointer-events-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Room Active
        </div>
      </div>
    ),
  }), [workspaceId, boardId]);

  return (
    <div className="absolute inset-0">
      <Tldraw
        autoFocus
        inferDarkMode
        components={customComponents} // 👈 Passed the memoized object here
      />
    </div>
  );
}

// ---------------------------------------------------------
// 3. THE AUTH PROVIDER WRAPPER
// ---------------------------------------------------------
export function Whiteboard({ roomId, workspaceId, boardId }: { roomId: string, workspaceId: string, boardId: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  
  return (
    <LiveblocksProvider 
      authEndpoint={async (room) => {
        try {
          const response = await apiClient.post(
            `${apiUrl}/api/canvas/liveblocks-auth`,
            { room },
            { withCredentials: true } 
          );
          
          return response.data;
        } catch (error) {
          console.error("Liveblocks Auth Error:", error);
          throw error;
        }
      }}
    >
      <RoomProvider id={roomId} initialPresence={{ cursor: null }}>
        {/* 🔴 FIX #2: CLIENT-SIDE SUSPENSE */}
        {/* This forces the UI to show a loader until Liveblocks actually finishes connecting. */}
        <ClientSideSuspense fallback={
          <div className="flex h-full w-full items-center justify-center absolute inset-0 bg-background z-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <CollaborativeEditor roomId={roomId} workspaceId={workspaceId} boardId={boardId} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}