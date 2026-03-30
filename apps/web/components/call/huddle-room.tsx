"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles"; // 🟢 Required for the default Zoom-like UI!
import { Loader2 } from "lucide-react";
import { apiClient } from "@/app/lib/api-client"; // Adjust path as needed
import { toast } from "sonner";

interface HuddleRoomProps {
  channelId: string;
  onLeave: () => void;
}

export function HuddleRoom({ channelId, onLeave }: HuddleRoomProps) {
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    const joinHuddle = async () => {
      try {
        // Hit your new Fastify route!
        const { data } = await apiClient.post(`/calls/channels/${channelId}/huddle`);
        
        if (isMounted) {
          setToken(data.data.token);
          // Using the wsUrl returned from your backend (LIVEKIT_URL)
          setWsUrl(data.data.wsUrl); 
        }
      } catch (error) {
        toast.error("Failed to join the huddle");
        onLeave();
      }
    };

    joinHuddle();

    return () => {
      isMounted = false;
    };
  }, [channelId, onLeave]);

  if (token === "" || wsUrl === "") {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-background border-b w-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">Connecting to secure room...</p>
      </div>
    );
  }

  return (
    // 🟢 The LiveKit container. We limit the height so it sits nicely above the chat.
    <div className="h-full w-full flex flex-col bg-background">
      <LiveKitRoom
        video={false} // Default to audio-only for Huddles, user can turn video on
        audio={true}
        token={token}
        serverUrl={wsUrl}
        // This triggers when the user clicks the red "Leave" button
        onDisconnected={onLeave} 
        // This allows LiveKit to handle browser permissions automatically
        data-lk-theme="default" 
       className="h-full w-full flex-1 flex flex-col"
      >
        {/* The pre-built Zoom-style grid and control bar */}
        <VideoConference />
        {/* Renders audio from other participants */}
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}