"use client";

import { useState } from "react";
import { useChatSocket } from "@/hooks/api/use-chat-socket";
import { authClient } from "@/app/lib/auth/client"; // Your auth client
import { Send } from "lucide-react";
import Image from "next/image";

import { ChatInput } from "./chat-input"; 
import { MessageRenderer } from "./message-renderer"; 
import { useParams } from "next/navigation"; // To grab workspaceId

export default function ChatRoom({ channelId }: { channelId: string }) {
  const { data: session } = authClient.useSession();
  const [inputValue, setInputValue] = useState("");

  const params = useParams();
  const workspaceId = params.workspaceId as string;
  
  // 🟢 ALL THE HEAVY LIFTING IS DONE BY THIS ONE LINE
  const { messages, isConnected, typingUsers, sendMessage, notifyTyping } = useChatSocket(
    channelId, 
    session?.user
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(inputValue);
    setInputValue(""); // Clear input after sending
  };

  return (
   <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="text-muted-foreground">#</span> Channel 
        </h3>
        <div className="flex items-center gap-2">
           <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
           <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
       {/* Inside ChatRoom.tsx message feed */}
        {messages.map((msg: any) => (
          <div 
            key={msg.id} 
            // 🟢 If it's optimistic, fade it slightly and prevent interactions
            className={`flex gap-4 group transition-all duration-300 ${
              msg.isOptimistic ? "opacity-60 pointer-events-none scale-[0.99]" : "opacity-100"
            }`}
          >
            <Image src={msg.sender.image || "/default-avatar.png"} alt={msg.sender.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover border mt-0.5" />
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm">{msg.sender.name}</span>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {/* 🟢 Add a tiny "sending" indicator */}
                  {msg.isOptimistic && <span className="text-[10px] italic ml-1">Sending...</span>}
                </span>
              </div>
              
              <MessageRenderer content={msg.content} workspaceId={workspaceId} />
              
            </div>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="absolute bottom-20 left-6 text-xs text-muted-foreground font-medium flex items-center gap-2 bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm">
          <span className="flex gap-0.5 h-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* 🟢 4. THE OMNI-SEARCH INPUT */}
      <ChatInput 
        workspaceId={workspaceId}
        onSendMessage={sendMessage}
        onTyping={notifyTyping}
      />
    </div>
  );
}