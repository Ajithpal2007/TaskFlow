"use client";

import { useState, useRef, useEffect } from "react";
import { useChatSocket } from "@/hooks/api/use-chat-socket";
import { authClient } from "@/app/lib/auth/client"; // Your auth client
import { Download, FileImage, FileText, Send, X } from "lucide-react";
import Image from "next/image";

import { ChatInput } from "./chat-input";
import { MessageRenderer } from "./message-renderer";
import { useParams } from "next/navigation"; // To grab workspaceId

import { MessageSquareReply } from "lucide-react"; // 🟢 Import this icon
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { Button } from "@repo/ui/components/button";


const groupReactions = (reactions: any[] = []) => {
  const grouped = new Map<string, { count: number; hasReacted: boolean }>();
  // Assuming you have access to currentUser.id via session
  const currentUserId = "YOUR_CURRENT_USER_ID_HERE"; 

  reactions.forEach((r) => {
    const existing = grouped.get(r.emoji) || { count: 0, hasReacted: false };
    grouped.set(r.emoji, {
      count: existing.count + 1,
      hasReacted: existing.hasReacted || r.userId === currentUserId,
    });
  });
  return Array.from(grouped.entries());
};




// 🟢 UPGRADED: The Smart Attachment Component
function AttachmentItem({ url, onImageClick }: { url: string; onImageClick: (url: string) => void }) {
  const [isError, setIsError] = useState(false);
  
  // 1. Check common document extensions
  const docExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".zip"];
  const isDocumentUrl = docExtensions.some(ext => url.toLowerCase().includes(ext));

  // 2. Check if the URL string explicitly says it's a PDF from UploadThing's internal routing
  // Sometimes UT URLs look like utfs.io/f/xyz123-pdf... 
  const isLikelyPdf = url.toLowerCase().includes("-pdf");

  // If we suspect it's a document OR if the image tag crashed
  if (isDocumentUrl || isLikelyPdf || isError) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors w-max max-w-sm">
        <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex flex-col overflow-hidden pr-4">
          <span className="text-sm font-semibold truncate">Document Attachment</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">File</span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="h-8 w-8 rounded-full hover:bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border shadow-sm ml-auto"
          title="Open or Download"
        >
          <Download size={14} />
        </a>
      </div>
    );
  }

  // Otherwise, assume it's an image and try to render it
  return (
    <div 
      className="relative h-48 w-64 rounded-md border overflow-hidden bg-muted/10 shadow-sm shrink-0 group cursor-pointer"
      onClick={() => onImageClick(url)} 
    >
      <img 
        src={url} 
        alt="Attachment preview" 
        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
        onError={() => setIsError(true)} 
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
         {/* Optional: Add a subtle icon on hover to indicate it's clickable */}
         <FileImage className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" size={24} />
      </div>
    </div>
  );
}




// Helper to group reactions by emoji


export default function ChatRoom({ channelId }: { channelId: string }) {
  const { data: session } = authClient.useSession();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const setActiveThreadId = useUIStore((state) => state.setActiveThreadId);

  // 🟢 ALL THE HEAVY LIFTING IS DONE BY THIS ONE LINE
  const { messages, isConnected, typingUsers, sendMessage, notifyTyping, toggleReaction } = useChatSocket(
    channelId,
    session?.user
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      // Use 'auto' (instant) for the first load, 'smooth' for new messages
      behavior: isFirstLoad.current ? "auto" : "smooth" 
    });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      isFirstLoad.current = false; // After the first scroll, turn smooth scrolling back on!
    }
  }, [messages]);



 return (
    <div className="flex flex-col h-full w-full bg-background relative border-r">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10 shrink-0">
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
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            // 🟢 If it's optimistic, fade it slightly and prevent interactions
            className={`flex gap-4 group transition-all duration-300 ${msg.isOptimistic ? "opacity-60 pointer-events-none scale-[0.99]" : "opacity-100"
              }`}
          >
            <Image src={msg.sender.image || "/default-avatar.png"} alt={msg.sender.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover border mt-0.5" />
            <div className="flex-1 relative">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm">{msg.sender.name}</span>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {/* 🟢 Add a tiny "sending" indicator */}
                  {msg.isOptimistic && <span className="text-[10px] italic ml-1">Sending...</span>}
                </span>
              </div>

              {/* 🟢 Text Content Renderer */}
              <MessageRenderer content={msg.content} workspaceId={workspaceId} />

              {/* 🟢 NEW: RENDER EXISTING REACTIONS */}
              {msg.reactions && msg.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {groupReactions(msg.reactions).map(([emoji, { count, hasReacted }]) => (
                    <button
                      key={emoji}
                      onClick={() => toggleReaction(msg.id, emoji)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors ${
                        hasReacted 
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" 
                          : "bg-muted/50 border-transparent hover:border-border text-muted-foreground"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span className="font-semibold">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* 🟢 THE HOVER MENU (Updated to include quick reactions) */}
              {!msg.isOptimistic && (
                <div className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md shadow-sm flex items-center p-0.5 z-10">
                  
                  {/* Quick Reactions */}
                  <div className="flex items-center border-r pr-1 mr-1">
                    {["👍", "❤️", "😂"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(msg.id, emoji)}
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded text-sm transition-transform hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Existing Reply Button */}
                  <Button variant="ghost" size="icon" className="h-7 w-7..." onClick={() => setActiveThreadId(msg.id)}>
                    <MessageSquareReply size={14} />
                  </Button>
                </div>
              )}

              {/* 🟢 THE NEW ATTACHMENT RENDERER */}
             {/* 🟢 THE NEW SMART ATTACHMENT MAP */}
              {msg.fileUrls && msg.fileUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.fileUrls.map((url: string, index: number) => (
                    <AttachmentItem 
                      key={index} 
                      url={url} 
                      onImageClick={setSelectedImage} 
                    />
                  ))}
                </div>
              )}

              {/* 🟢 3. THE HOVER MENU (Only shows when hovering the message) */}
              {!msg.isOptimistic && (
                <div className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md shadow-sm flex items-center p-0.5 z-10">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground" 
                    onClick={() => setActiveThreadId(msg.id)}
                  >
                    <MessageSquareReply size={14} />
                  </Button>
                </div>
              )}

            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
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

      {/* 🟢 4. THE CHAT INPUT */}
      <div className="shrink-0">
        <ChatInput
          workspaceId={workspaceId}
          onSendMessage={sendMessage}
          onTyping={notifyTyping}
        />
      </div>
      {/* 🟢 FULL-SCREEN IMAGE LIGHTBOX */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} // Click anywhere to close
        >
          {/* Close Button */}
          <button  
            title="Close"
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>

          {/* The Full Image */}
          <img 
            src={selectedImage} 
            alt="Full size preview" 
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl ring-1 ring-white/10" 
            onClick={(e) => e.stopPropagation()} // Prevent clicking the image from closing the modal
          />
        </div>
      )}
    </div>
  );
}