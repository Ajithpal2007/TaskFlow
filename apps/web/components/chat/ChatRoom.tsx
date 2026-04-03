"use client";

import { useState, useRef, useEffect } from "react";
import { useChatSocket } from "@/hooks/api/use-chat-socket";
import { authClient } from "@/app/lib/auth/client"; // Your auth client
import { Download, FileImage, FileText, Send, X, Headphones, MessageSquareReply, ExternalLink, Info } from "lucide-react";
import Image from "next/image";

import { ChatInput } from "./chat-input";
import { MessageRenderer } from "./message-renderer";
import { useParams } from "next/navigation"; // To grab workspaceId

import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { Button } from "@repo/ui/components/button";

import { HuddleRoom } from "@/components/call/huddle-room";
import { apiClient } from "@/app/lib/api-client";

import { ChannelSettingsPanel } from "./ChannelSettingsPanel";
import { useChannelDetails } from "@/hooks/api/use-channel-details";
import { useDeleteChannel } from "@/hooks/api/use-delete-channel";
import { useEditChannel } from "@/hooks/api/use-edit-channel";

// Reaction Helper
const groupReactions = (reactions: any[] = [], currentUserId?: string) => {
  const grouped = new Map<string, { count: number; hasReacted: boolean }>();

  reactions.forEach((r) => {
    const existing = grouped.get(r.emoji) || { count: 0, hasReacted: false };
    grouped.set(r.emoji, {
      count: existing.count + 1,
      // 🟢 Now checks against the actual logged-in user!
      hasReacted: existing.hasReacted || r.userId === currentUserId,
    });
  });
  return Array.from(grouped.entries());
};

// 🟢 RESTORED: Your exact original Attachment Component
function AttachmentItem({ url, onImageClick }: { url: string; onImageClick: (url: string) => void }) {
  const [isError, setIsError] = useState(false);

  // 1. Check common document extensions
  const docExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".zip"];
  const isDocumentUrl = docExtensions.some(ext => url.toLowerCase().includes(ext));

  // 2. Check if the URL string explicitly says it's a PDF from UploadThing
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

  // Otherwise, assume it's an image and try to render it!
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
        <FileImage className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" size={24} />
      </div>
    </div>
  );
}

export default function ChatRoom({ channelId }: { channelId: string }) {
  const { data: session } = authClient.useSession();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const setActiveThreadId = useUIStore((state) => state.setActiveThreadId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHuddleActive, setIsHuddleActive] = useState(false);


  const messagesEndRef = useRef<HTMLDivElement>(null);


  // 🟢 PANEL STATE & HOOKS
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: channelDetails } = useChannelDetails(workspaceId, channelId);
  const { mutate: deleteChannel } = useDeleteChannel(workspaceId);
  const { mutate: editChannel } = useEditChannel(workspaceId, channelId);

  const handleEditName = () => {
    if (!channelDetails) return;
    const newName = prompt("Enter new channel name:", channelDetails.name);
    if (newName && newName.trim() !== "") {
      editChannel(newName.trim());
    }
  };


  const { messages, isConnected, typingUsers, sendMessage, notifyTyping, toggleReaction } = useChatSocket(
    channelId,
    session?.user
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to Bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);



  return (
    <div className="flex flex-row h-full w-full bg-background overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">

        {/* HEADER: Locked to the top */}
        <div className="h-14 px-6 border-b flex justify-between items-center bg-background shrink-0 z-20">
          <h3 className="font-bold text-lg flex items-center gap-2">
            {/* 🟢 Change `channel` to `channelDetails` in your header logic */}
            {!channelDetails ? (
              <span className="animate-pulse">Loading...</span>
            ) : channelDetails.type === "DIRECT" || !channelDetails.name ? (
              <>
                <span className="text-muted-foreground">@</span>
                {channelDetails.name || "Direct Message"}
              </>
            ) : (
              <>
                <span className="text-muted-foreground">#</span>
                {channelDetails.name}
              </>
            )}
          </h3>

          <div className="flex items-center gap-4">
            {/* 🟢 NEW: Pop-out Button (Only shows if Huddle is active) */}
            {isHuddleActive && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Opens the new full-screen route in a new browser tab
                  window.open(`/huddle/${channelId}`, '_blank');
                  // Optionally close the mini-huddle in this view, or leave it running
                  setIsHuddleActive(false);
                }}
              >
                <ExternalLink size={16} />
                Open In New Tab
              </Button>
            )}

            <Button
              variant={isHuddleActive ? "secondary" : "outline"}
              size="sm"
              className={`gap-2 ${isHuddleActive ? "bg-green-500/10 text-green-600 border-green-200" : ""}`}
              onClick={() => setIsHuddleActive(!isHuddleActive)}
            >
              <Headphones size={16} />
              {isHuddleActive ? "Leave Huddle" : "Start Huddle"}
            </Button>

            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Status</span>
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
            </div>
          </div>
          {/* 🟢 ADD THE INFO BUTTON HERE */}
          <button
            title="Channel Settings"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-2 rounded-md transition-colors ml-2 ${isSettingsOpen ? "bg-indigo-500/10 text-indigo-500" : "text-muted-foreground hover:bg-muted text-foreground"
              }`}
          >
            <Info size={20} />
          </button>

        </div>

        {/* HUDDLE AREA */}
        {isHuddleActive && <HuddleRoom channelId={channelId} onLeave={() => setIsHuddleActive(false)} />}

        {/* MESSAGE FEED: Scrollable area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background"
        >
          <div className="flex flex-col gap-y-6">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`flex gap-3 group relative items-start transition-all duration-300 ${msg.isOptimistic ? "opacity-60 pointer-events-none scale-[0.99]" : "opacity-100"
                  }`}
              >
                <div className="h-9 w-9 shrink-0 mt-0.5">
                  <Image
                    src={msg.sender.image || "/default-avatar.png"}
                    alt="" width={36} height={36}
                    className="rounded-full object-cover border shadow-sm"
                  />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-[13px] text-foreground leading-none">{msg.sender.name}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

                      {msg.isOptimistic && <span className="italic ml-1 text-[9px]">(Sending...)</span>}
                    </span>
                  </div>

                  <div className="text-sm leading-relaxed text-foreground/90">
                    <MessageRenderer content={msg.content} workspaceId={workspaceId} />
                  </div>



                  {/* 🟢 RESTORED: Calling your original AttachmentItem */}
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

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {groupReactions(msg.reactions).map(([emoji, { count, hasReacted }]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border transition-colors ${hasReacted
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
                </div>

                {/* Hover Menu */}
                {!msg.isOptimistic && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md shadow-sm p-0.5">

                    {/* 🟢 RESTORED: Quick Reactions */}
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


                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setActiveThreadId(msg.id)}>
                      <MessageSquareReply size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="px-6 py-2 bg-background flex items-center gap-2 text-xs text-muted-foreground z-10 animate-in slide-in-from-bottom-2">
            <span className="flex gap-0.5 h-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span className="font-medium">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
            </span>
          </div>
        )}


        {/* INPUT AREA */}
        <div className="p-4 bg-background border-t shrink-0">
          <ChatInput
            workspaceId={workspaceId}
            onSendMessage={sendMessage}
            onTyping={notifyTyping}
          />
        </div>
      </div>

      {/* 3. ADDED THIS WRAPPER for the right side (Settings Panel) */}
      {isSettingsOpen && channelDetails && session?.user && (
        <div className="w-80 shrink-0 border-l bg-background shadow-xl z-30">
          <ChannelSettingsPanel
            channel={channelDetails}
            currentUser={session.user}
            onClose={() => setIsSettingsOpen(false)}
            onEditName={handleEditName}
            onDelete={() => deleteChannel(channelId)}
          />
        </div>
      )}

      {/* FULL-SCREEN IMAGE LIGHTBOX */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            title="Close"
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <Image
            fill
            src={selectedImage}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-md shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}