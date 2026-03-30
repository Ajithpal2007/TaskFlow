"use client";

import { HuddleRoom } from "@/components/call/huddle-room";

export default function FullScreenHuddlePage({ params }: { params: { channelId: string } }) {
  return (
    // 🟢 This wrapper forces the Huddle to take up 100% of the entire browser tab
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      <div className="p-4 flex justify-between items-center bg-zinc-900 border-b border-zinc-800 shrink-0">
        <h1 className="text-white font-bold">Huddle Room</h1>
        <button 
          onClick={() => window.close()} 
          className="text-red-400 hover:text-red-300 text-sm font-medium"
        >
          Close Tab
        </button>
      </div>
      
      {/* 🟢 Render the exact same component, just in a bigger space! */}
      <div className="flex-1 min-h-0">
        <HuddleRoom 
          channelId={params.channelId} 
          onLeave={() => window.close()} 
        />
      </div>
    </div>
  );
}