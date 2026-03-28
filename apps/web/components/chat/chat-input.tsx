"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Hash, User, CheckSquare } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { apiClient } from "@/app/lib/api-client";

interface ChatInputProps {
  workspaceId: string;
  onSendMessage: (content: string) => void;
  onTyping: () => void;
}

export function ChatInput({ workspaceId, onSendMessage, onTyping }: ChatInputProps) {
  const [text, setText] = useState("");
  
  // Mention Menu State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0); // 🟢 NEW: Tracks keyboard selection
  
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null); // For auto-scrolling the menu

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    onTyping();

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const words = textBeforeCursor.split(" ");
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery(null);
    }
  };

  useEffect(() => {
    if (mentionQuery === null) return;

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await apiClient.get(`/search/mentions?workspaceId=${workspaceId}&q=${mentionQuery}`);
        setMentionResults(res.data.data);
        setSelectedIndex(0); // 🟢 Reset selection to top when results change
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

  // 🟢 NEW: THE KEYBOARD INTERCEPTOR
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only hijack the keys IF the mention menu is open
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
        setMentionQuery(null); // Let them cancel out of the menu
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent sending if they are just trying to select a mention with Enter!
    if (mentionQuery !== null) return; 
    
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
    setMentionQuery(null);
  };

  return (
    <div className="relative p-4 bg-background border-t">
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
                  onMouseEnter={() => setSelectedIndex(idx)} // Allow mouse to override keyboard state
                  className={`flex items-center gap-3 p-2 text-left rounded-md transition-colors ${
                    idx === selectedIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
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

      {/* 🟢 THE CHAT INPUT BOX */}
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown} // 🟢 Added the listener here!
          placeholder="Type a message... (Use @ to mention tasks or people)"
          className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm outline-none border border-transparent focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          autoComplete="off"
        />
        <Button type="submit" disabled={!text.trim() || mentionQuery !== null} className="rounded-lg h-auto py-3">
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}