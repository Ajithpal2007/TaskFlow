"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { ChatInput } from "./chat-input";
import { useParams } from "next/navigation";
import { X, MessageSquareReply, FileText, Download, FileImage } from "lucide-react";
import { useThread } from "@/hooks/api/use-thread"; // 🟢 Import the new hook
import Image from "next/image";
import { authClient } from "@/app/lib/auth/client"; // Adjust path to your auth!






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

export function ThreadDrawer() {
  const activeThreadId = useUIStore((state) => state.activeThreadId);
  const setActiveThreadId = useUIStore((state) => state.setActiveThreadId);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const channelId = params.channelId as string;

  const { data: session } = authClient.useSession(); // 🟢 Grab the user
  const currentUser = session?.user;


  // 🟢 Hook up the backend!
  const { thread, isLoading, sendReply } = useThread(activeThreadId, channelId, currentUser);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveThreadId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveThreadId]);

  if (!activeThreadId) return null;

  return (
    <div className="w-[350px] border-l bg-background h-full flex flex-col shrink-0 shadow-xl relative z-50 pt-14">

      {/* HEADER & CLOSE BUTTON */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-muted/95 backdrop-blur border-b flex items-center justify-between px-4 z-[100]">
        <span className="text-sm font-semibold flex items-center gap-2">
          <MessageSquareReply size={16} /> Thread
        </span>
        <button onClick={() => setActiveThreadId(null)} className="text-xs font-bold bg-background border shadow-sm px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground transition-all flex items-center gap-2">
          Close <kbd className="font-mono text-[10px] bg-muted px-1 rounded border">Esc</kbd>
        </button>
      </div>

      {/* --- REAL THREAD FEED --- */}
      <div className="flex-1 overflow-y-auto p-4 pt-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
        ) : thread ? (
          <>
            {/* 1. Parent Message */}
            <div className="flex gap-3 pb-6 border-b">
              <Image src={thread.parent.sender.image || "/default-avatar.png"} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover border" />
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-sm">{thread.parent.sender.name}</span>
                </div>
                {thread.parent.content && (
                  <p className="text-sm text-foreground/90">{thread.parent.content}</p>
                )}

                {/* 🟢 Parent Message Attachment */}
                {thread.parent.fileUrls && thread.parent.fileUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {thread.parent.fileUrls.map((url: string, index: number) => (
                      <AttachmentItem key={index} url={url} onImageClick={setSelectedImage} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Replies List */}
            <div className="space-y-4 pt-2">
              {thread.replies.length === 0 && (
                <p className="text-center text-xs text-muted-foreground pt-4">No replies yet. Start the conversation!</p>
              )}
              {thread.replies.map((reply: any) => (
                <div
                  key={reply.id}
                  className={`flex gap-3 transition-all duration-300 ${reply.isOptimistic ? "opacity-60 pointer-events-none scale-[0.99]" : "opacity-100"
                    }`}
                >
                  <Image src={reply.sender.image || "/default-avatar.png"} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover border" />
                  <div>
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-bold text-sm">{reply.sender.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {reply.isOptimistic && <span className="italic text-primary ml-1">Sending...</span>}
                      </span>
                    </div>
                    {reply.content && (
                      <p className="text-sm text-foreground/90">{reply.content}</p>
                    )}

                    {/* 🟢 THE MULTIPLE ATTACHMENT RENDERER */}
                    {reply.fileUrls && reply.fileUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {reply.fileUrls.map((url: string, index: number) => (
                          <AttachmentItem key={index} url={url} onImageClick={setSelectedImage} />
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* --- REAL THREAD INPUT --- */}
      <div className="shrink-0 flex flex-col bg-background border-t">

        {/* 🟢 THE ESC HINT: Moved just above the ChatInput with matching padding */}
        <div className="px-4 pt-3 pb-1 flex justify-end">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <kbd className="font-mono font-semibold text-[9px] bg-muted px-1.5 py-0.5 rounded border border-border shadow-sm uppercase tracking-wider">
              Esc
            </kbd>
            to close
          </span>
        </div>

        <ChatInput
          workspaceId={workspaceId}
          onSendMessage={async (content, fileUrls) => {
            // 🟢 Wrap them in an object so React Query reads it as ONE variable!
            await sendReply({ content, fileUrls });
          }}
          onTyping={() => { }}
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