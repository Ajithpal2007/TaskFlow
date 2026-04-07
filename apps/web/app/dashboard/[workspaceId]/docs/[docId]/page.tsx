"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useDocument } from "@/hooks/api/use-document";
import { useTheme } from "next-themes";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Button } from "@repo/ui/components/button";
import { Smile, Image as ImageIcon, X, Lock, Unlock } from "lucide-react";

import { Theme } from "emoji-picker-react";
import { UploadButton } from "@/app/lib/uploadthing";
import { toast } from "sonner";

import { DocumentBreadcrumbs } from "@/components/editor/document-breadcrumbs";
import { ShareDocumentModal } from "@/components/editor/share-document-modal";

// 🟢 Dynamically import both the Editor AND the Emoji Picker to prevent SSR crashes
const BlockEditor = dynamic(() => import("@/components/editor/block-editor"), { ssr: false });
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function DocumentPage({ params }: { params: { docId: string; workspaceId: string; projectId?: string } }) {
  const { resolvedTheme } = useTheme();
  const { document, isLoading, updateDocument } = useDocument(params.workspaceId, params.docId);
  const [title, setTitle] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (document?.title) setTitle(document.title);
  }, [document?.title]);

  const handleTitleBlur = () => {
    if (title !== document?.title) updateDocument({ title });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-8 space-y-6">
        <Skeleton className="h-[30vh] w-full mb-12 rounded-none" />
        <Skeleton className="h-16 w-3/4" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-background pb-36 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">

      {/* 🟢 1. THE COVER IMAGE AREA */}
      {document?.coverImage && (
        <div className="relative w-full h-[30vh] bg-muted group/cover">
          <img
            src={document.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 opacity-0 group-hover/cover:opacity-100 transition-opacity flex gap-2 bg-background/50 backdrop-blur-sm p-1.5 rounded-lg border">
            <Button variant="secondary" size="sm" onClick={() => updateDocument({ coverImage: null })}>
              Remove
            </Button>

            <UploadButton
              endpoint="attachmentUploader" 
              onClientUploadComplete={(res) => {
                if (res && res[0]) {
                  updateDocument({ coverImage: res[0].url });
                  toast.success("Cover updated!");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload failed: ${error.message}`);
              }}
              appearance={{
                button: "bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 rounded-md text-sm font-medium focus-within:ring-0 after:hidden",
                allowedContent: "hidden"
              }}
              content={{
                button({ ready, isUploading }) {
                  if (isUploading) return <div>Uploading... ⏳</div>; 
                  if (ready) return <div>Change Cover</div>;
                  return <div>Loading...</div>;
                },
              }}
            />
          </div>
        </div>
      )}

      {/* 🟢 2. THE MAIN CONTENT GROUP */}
      <main className="max-w-4xl mx-auto pt-12 px-8 sm:px-12 group">

        {/* Breadcrumbs */}
        <DocumentBreadcrumbs 
          workspaceId={params.workspaceId} 
          docId={params.docId} 
        />

        {/* Emoji Icon Display */}
        {document?.emoji && (
          <div className="relative mb-4 w-fit group/icon">
            <div className="text-7xl -mt-12 bg-background p-1 rounded-xl shadow-sm z-10 relative">
              {document.emoji}
            </div>
            <button
              title="Remove Icon"
              onClick={() => updateDocument({ emoji: null })}
              className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full p-1 opacity-0 group-hover/icon:opacity-100 transition-opacity z-20 hover:bg-destructive hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* 🟢 3. THE INVISIBLE TOOLBAR (Refactored for perfect layout) */}
        <div className="flex items-center justify-between mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
          
          {/* LEFT SIDE: Add Icon & Add Cover */}
          <div className="flex items-center gap-2">
            {!document?.emoji && (
              <div className="relative">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile className="h-4 w-4 mr-2" /> Add Icon
                </Button>

                {showEmojiPicker && (
                  <div className="absolute top-10 left-0 z-50 shadow-xl rounded-lg border bg-background">
                    <EmojiPicker
                      theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                      onEmojiClick={(e) => {
                        updateDocument({ emoji: e.emoji });
                        setShowEmojiPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {!document?.coverImage && (
              <div className="relative flex items-center h-8">
                <ImageIcon className="h-4 w-4 mr-2 text-muted-foreground absolute left-3 pointer-events-none z-10" />
                <UploadButton
                  endpoint="attachmentUploader" 
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      updateDocument({ coverImage: res[0].url });
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(error.message);
                  }}
                  appearance={{
                    button: "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 px-3 pl-8 rounded-md text-sm font-medium shadow-none focus-within:ring-0 after:hidden",
                    allowedContent: "hidden"
                  }}
                  content={{
                    button({ ready, isUploading }) {
                      if (isUploading) return <div>Uploading... ⏳</div>;
                      if (ready) return <div>Add Cover</div>; // 🟢 Fixed text here
                      return <div>Loading...</div>;
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Lock & Share */}
          <div className="flex items-center gap-2">
            {/* 🟢 Moved the Lock Button here! */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 ${document?.isLocked ? "text-amber-500 opacity-100" : "text-muted-foreground"}`}
              onClick={() => updateDocument({ isLocked: !document?.isLocked })}
            >
              {document?.isLocked ? (
                <><Lock className="h-4 w-4 mr-2" /> Locked</>
              ) : (
                <><Unlock className="h-4 w-4 mr-2" /> Lock</>
              )}
            </Button>

            {document && (
              <ShareDocumentModal 
                documentId={document.id}
                visibility={document.visibility || "PUBLIC"}
                updateDocument={updateDocument}
              />
            )}
          </div>

        </div>

        {/* -- THE TITLE BLOCK -- */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          className="w-full text-5xl font-bold bg-transparent outline-none border-none placeholder:text-muted-foreground/50 text-foreground mb-8 resize-none"
        />

        {/* -- THE BLOCKNOTE CANVAS -- */}
        {document && (
          <BlockEditor
            documentId={document.id}
            initialContent={document.content}
            workspaceId={params.workspaceId}
            projectId={document.projectId}
            isLocked={document.isLocked}
          />
        )}

      </main>
    </div>
  );
}