"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Hash, User, CheckSquare, Loader2, X, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { apiClient } from "@/app/lib/api-client";
import { useParams } from "next/navigation";
import { useUploadThing } from "@/app/lib/uploadthing";

interface ChatInputProps {
  workspaceId: string;
  // 🟢 1. Note the fileUrls array to support multiple files!
  onSendMessage: (content: string, fileUrls?: string[]) => Promise<void> | void; 
  onTyping: () => void;
}

export function ChatInput({ workspaceId, onSendMessage, onTyping }: ChatInputProps) {
  // --- MASTER STATE ---
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const params = useParams();
  const channelId = params.channelId as string;

  // --- MENTION STATE ---
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const menuRef = useRef<HTMLDivElement>(null);

  // --- ATTACHMENT STATE ---
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("messageAttachment");


  // 🟢 2. DRAFTS HOOK
  useEffect(() => {
    if (!channelId) return;
    const savedDraft = localStorage.getItem(`draft-${channelId}`);
    if (savedDraft) {
      setText(savedDraft);
    } else {
      setText(""); 
    }
    inputRef.current?.focus();
  }, [channelId]);


  // 🟢 3. MENTIONS LOGIC
  useEffect(() => {
    if (mentionQuery === null) return;
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get(`/search/mentions?workspaceId=${workspaceId}&q=${mentionQuery}`);
        setMentionResults(res.data.data);
        setSelectedIndex(0); 
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    };
    const delayDebounceFn = setTimeout(() => fetchResults(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [mentionQuery, workspaceId]);

  const handleSelectMention = (item: any) => {
    const words = text.split(" ");
    words.pop();
    const mentionString = `@[${item.title}](${item.type}:${item.id}) `;
    setText(words.join(" ") + (words.length > 0 ? " " : "") + mentionString);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, mentionResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectMention(mentionResults[selectedIndex]);
      } else if (e.key === "Escape") {
        setMentionQuery(null);
      }
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onTyping();
    
    // Save draft instantly
    if (val.trim()) {
      localStorage.setItem(`draft-${channelId}`, val);
    } else {
      localStorage.removeItem(`draft-${channelId}`);
    }

    // Auto-resize magic
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;

    // Mention trigger detection
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const words = textBeforeCursor.split(" ");
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery(null);
    }
  };


  // 🟢 4. ATTACHMENT LOGIC (Local Preview Only)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setPendingFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };


  // 🟢 5. THE MASTER SUBMIT FUNCTION
  // 🟢 5. THE MASTER SUBMIT FUNCTION (Optimistic UI Upgraded)
  const handleMasterSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Block sending if empty or already uploading
    if ((!text.trim() && pendingFiles.length === 0) || isSending || isUploading) return;

    // 🟢 STEP 1: CAPTURE THE CURRENT STATE
    const textToSend = text.trim();
    const filesToSend = [...pendingFiles];

    // 🟢 STEP 2: CLEAR THE UI INSTANTLY (0-Latency Feel)
    setText(""); 
    setPendingFiles([]); 
    localStorage.removeItem(`draft-${channelId}`); 
    if (inputRef.current) inputRef.current.style.height = "auto"; 
    setMentionQuery(null); // Just in case a menu was open

    // 🟢 STEP 3: PROCESS THE UPLOAD & SEND IN THE BACKGROUND
    setIsSending(true);
    try {
      let uploadedUrls: string[] = [];

      // If they attached files, upload them first
      if (filesToSend.length > 0) {
        const uploadResponse = await startUpload(filesToSend);
        if (uploadResponse) {
          uploadedUrls = uploadResponse.map((file) => file.url);
        }
      }

      // Send the captured text and URLs to the backend
      await onSendMessage(textToSend, uploadedUrls.length > 0 ? uploadedUrls : undefined);

    } catch (error) {
      console.error("Failed to send message:", error);
      // 🟢 STEP 4: ROLLBACK ON ERROR (If it fails, give them their text back!)
      setText(textToSend);
      setPendingFiles(filesToSend);
    } finally {
      setIsSending(false);
    }
  };
  
  // ... YOUR RETURN STATEMENT STARTS HERE ...
  return (
    <div className="relative px-6 pt-4 pb-0 bg-background border-t shrink-0">
      
      {/* 🟢 THE FLOATING MENTION MENU */}
      {mentionQuery !== null && (
        <div ref={menuRef} className="absolute bottom-full left-4 mb-2 w-80 max-h-64 overflow-y-auto bg-popover border rounded-lg shadow-2xl z-50 animate-in slide-in-from-bottom-2">
          <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase bg-muted/50 border-b sticky top-0">
            Mention User, Project, or Task
          </div>
          {isSearching ? (
            <div className="p-4 text-sm text-center text-muted-foreground animate-pulse">Searching...</div>
          ) : mentionResults.length === 0 ? (
            <div className="p-4 text-sm text-center text-muted-foreground">No results found</div>
          ) : (
            <div className="flex flex-col p-1">
              {mentionResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectMention(item)}
                  onMouseEnter={() => setSelectedIndex(idx)} 
                  className={`flex items-center gap-3 p-2 text-left rounded-md transition-colors ${idx === selectedIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <div className={`h-6 w-6 shrink-0 rounded border flex items-center justify-center overflow-hidden ${idx === selectedIndex ? "bg-primary-foreground/20 border-transparent" : "bg-background"}`}>
                    {item.type === "user" && item.avatar ? (
                      <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                    ) : item.type === "task" ? (
                      <CheckSquare className="h-3 w-3" />
                    ) : item.type === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Hash className="h-3 w-3" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{item.title}</span>
                    <span className={`text-[10px] uppercase tracking-wide ${idx === selectedIndex ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {item.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🟢 THE NEW MULTI-FILE FORM */}
      <form onSubmit={handleMasterSubmit} className="flex flex-col gap-2 relative">
        
        {/* 🟢 MULTIPLE FILE PREVIEW ROW */}
        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 p-3 bg-muted/40 border rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-1 w-max max-w-full overflow-x-auto">
            {pendingFiles.map((file, idx) => {
              // Create a temporary local URL for instant preview!
              const objectUrl = URL.createObjectURL(file);
              const isImage = file.type.startsWith("image/");

              return (
                <div key={idx} className="relative h-16 w-16 bg-background rounded-md border flex items-center justify-center overflow-hidden shrink-0 group">
                  {isImage ? (
                    <img src={objectUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                  
                  {/* Remove Button (Hides while uploading) */}
                  {!isUploading && (
                    <button  
                      title="Remove file"
                      type="button" 
                      onClick={() => removeFile(idx)} 
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={12} />
                    </button>
                  )}
                  
                  {/* Loading overlay for each image */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                      <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🟢 THE INPUT ROW */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef as any}
            value={text}
            onChange={handleTextareaInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleMasterSubmit(e);
              }
              handleKeyDown(e as any); 
            }}
            placeholder="Type a message... (Use @ to mention tasks or people)"
            className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none overflow-y-auto min-h-[44px] max-h-[150px]"
            rows={1}
            disabled={isUploading}
          />

          {/* 🟢 HIDDEN FILE INPUT (Notice the 'multiple' attribute!) */}
          <input  
            title="Attach files"
            type="file" 
            multiple 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden" 
            accept="image/*,application/pdf"
          />
          <Button 
            type="button"
            variant="ghost" 
            className="rounded-lg h-11 w-11 shrink-0 p-0 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Attach files"
          >
            <Paperclip size={18} />
          </Button>

          {/* 🟢 SEND BUTTON */}
          <Button 
            type="submit" 
            disabled={(!text.trim() && pendingFiles.length === 0) || mentionQuery !== null || isUploading || isSending} 
            className="rounded-lg h-11 w-11 shrink-0 p-0"
          >
            {isUploading || isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </form>
    </div>
  );
}