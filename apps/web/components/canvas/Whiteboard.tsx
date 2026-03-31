"use client";

import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { LiveblocksProvider, RoomProvider, useRoom } from "@liveblocks/react/suspense";
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// --- THE ACTUAL CANVAS ---
function CollaborativeEditor() {
  const room = useRoom();
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    // Note: tldraw v2 uses a specific sync pattern with Liveblocks/Yjs.
    // We will initialize the tldraw store here and bind it to the Liveblocks room.
    // (We will write the exact sync logic in the next step!)
  }, [room]);

  return (
    <div className="w-full h-full relative">
      <Tldraw 
        autoFocus 
        inferDarkMode 
        // store={store} // We will pass the multiplayer store here soon
      />
    </div>
  );
}

// --- THE PROVIDER WRAPPER ---
export function Whiteboard({ roomId }: { roomId: string }) {
  return (
    // 1. Connect to your Fastify Auth Endpoint
    <LiveblocksProvider authEndpoint="/api/canvas/liveblocks-auth">
      
      // 2. Join the specific room
      <RoomProvider 
        id={roomId} 
        initialPresence={{ cursor: null }}
      >
        <div className="h-full w-full bg-background overflow-hidden flex flex-col">
          
          {/* Header Area */}
          <div className="h-14 border-b flex items-center px-4 shrink-0 bg-background z-10">
            <h2 className="font-bold text-lg">Brainstorming Canvas</h2>
            <div className="ml-auto flex items-center gap-2">
               {/* We will add Live Avatars here later! */}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 min-h-0 relative">
             {/* Use React Suspense while Liveblocks connects */}
             <React.Suspense fallback={
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="animate-spin text-muted-foreground" />
               </div>
             }>
               <CollaborativeEditor />
             </React.Suspense>
          </div>

        </div>
      </RoomProvider>
    </LiveblocksProvider>
  );
}