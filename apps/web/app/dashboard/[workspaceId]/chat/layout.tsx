import { ReactNode } from "react";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <ChatSidebar />
      {/* 🟢 Add flex and flex-col here so children can use flex-1 */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}