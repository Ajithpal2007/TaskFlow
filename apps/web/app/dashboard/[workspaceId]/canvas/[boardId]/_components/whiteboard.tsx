"use client";

import { useEffect, useState } from "react";
import { Tldraw, createTLStore, defaultShapeUtils, useEditor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/app/lib/api-client"; 

// 🟢 MAKE SURE THIS IMPORT MATCHES YOUR UPLOADTHING HELPER PATH!
// If your uploadFiles function is somewhere else, adjust this path.
import { uploadFiles } from "@/app/lib/uploadthing"; 

import { LiveblocksProvider, RoomProvider, useRoom } from "@liveblocks/react/suspense";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";

// 🟢 1. THUMBNAIL GENERATOR COMPONENT
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
      // 🟢 1. Use the new built-in editor export method!
      const result = await editor.toImage(shapeIds, {
        format: 'png',
        background: true,
        padding: 32 
      });

      // tldraw returns undefined if the canvas crashes during export
      if (!result) {
        throw new Error("Canvas export failed to generate an image.");
      }

      // 🟢 2. Convert the result blob to a File object
      const file = new File([result.blob], `thumbnail-${boardId}.png`, { type: "image/png" });

      // 3. Upload via Uploadthing
      const uploadRes = await uploadFiles("imageUploader", { files: [file] });
      const uploadedUrl = uploadRes[0].url;

      // 4. Send the new URL to your Fastify backend
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

// 🟢 2. THE MULTIPLAYER CANVAS
// 🟢 2. THE CANVAS (Simplified to allow local persistence)
function CollaborativeEditor({ roomId, workspaceId, boardId }: { roomId: string, workspaceId: string, boardId: string }) {
  // We keep useRoom() here so Liveblocks knows you are in the room. 
  // This ensures your Webhooks still fire when you leave!
  const room = useRoom();

  return (
    <div className="absolute inset-0">
      <Tldraw
        // 🟢 THE FIX: Because we removed the 'store' prop, this persistenceKey will now actually work!
        persistenceKey={`canvas-${roomId}`}
        autoFocus
        inferDarkMode
        components={{
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
        }}
      />
    </div>
  );
}

// 🟢 3. THE AUTH PROVIDER WRAPPER
// Notice we added workspaceId and boardId here!
export function Whiteboard({ roomId, workspaceId, boardId }: { roomId: string, workspaceId: string, boardId: string }) {
  return (
    <LiveblocksProvider 
      authEndpoint={async (room) => {
        try {
          const response = await apiClient.post(
            "http://localhost:4000/api/canvas/liveblocks-auth", 
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
        <CollaborativeEditor roomId={roomId} workspaceId={workspaceId} boardId={boardId} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}