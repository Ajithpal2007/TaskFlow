"use client";

import ChatRoom from "@/components/chat/ChatRoom";
import { ThreadDrawer } from "@/components/chat/thread-drawer";

export default function DynamicChatPage({ params }: { params: { channelId: string } }) {
  return (
    // 🟢 Changed to flex-1 and min-h-0. This prevents the page from growing vertically.
   <div className="h-full w-full flex overflow-hidden bg-background">
   <div className="flex-1 flex flex-col min-w-0 h-full">
      <ChatRoom channelId={params.channelId} />
   </div>
   <ThreadDrawer />
</div>
  );
}