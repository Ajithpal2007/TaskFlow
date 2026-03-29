"use client";
//import ChatRoom  from "@/components/chat/ChatRoom";
import ChatRoom from "@/components/chat/ChatRoom";
import { ThreadDrawer } from "@/components/chat/thread-drawer";

export default function DynamicChatPage({ params }: { params: { channelId: string } }) {
  // Pass the dynamic channelId from the URL directly into your ChatRoom component
  return (
    // 🟢 The flex-row layout makes them sit side-by-side perfectly
    <div className="h-full w-full flex overflow-hidden bg-background">

      {/* 🟢 2. The chat room takes up all remaining space (flex-1) */}
      <div className="flex-1 min-w-0 h-full relative">
        <ChatRoom channelId={params.channelId} />
      </div>

      {/* 🟢 3. The Thread Drawer (will pop in on the right when active) */}
      <ThreadDrawer />

    </div>
  );
}