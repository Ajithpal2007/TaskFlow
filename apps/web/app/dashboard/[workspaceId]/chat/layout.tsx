import { ReactNode } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
   <div className="flex h-full w-full overflow-hidden">
  <ChatSidebar />
  <main className="flex-1 min-w-0 h-full">
    {children} {/* Or <ChatRoom /> */}
  </main>
</div>
  );
}