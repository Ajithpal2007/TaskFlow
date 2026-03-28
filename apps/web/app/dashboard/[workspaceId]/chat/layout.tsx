import { ReactNode } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 1. The Secondary Chat Sidebar */}
      <ChatSidebar />
      
      {/* 2. The Main Chat Room Area */}
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
}