"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Wand2, SpellCheck, WrapText, Languages, ArrowUpCircle,X } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface AiChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
  onQuickAction: (action: string) => void;
}

export function AiChatWidget({ isOpen, onClose, onSubmitPrompt, onQuickAction }: AiChatWidgetProps) {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the widget opens, and close on Escape
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmitPrompt(prompt);
      setPrompt(""); // Clear after submitting
    }
  };

  return (
    <div className="absolute z-50 bottom-4 right-4 w-[350px] rounded-xl border bg-background shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-500">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">Ask AI</span>
        </div>
        
        {/* The new Close Button */}
        <button  
          title="Close"
          onClick={onClose} 
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions List */}
      <div className="flex flex-col p-2 text-sm">
        <button 
          onClick={() => onQuickAction("improve")}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
        >
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          Improve writing
        </button>
        <button 
          onClick={() => onQuickAction("fix_grammar")}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
        >
          <SpellCheck className="h-4 w-4 text-muted-foreground" />
          Fix spelling & grammar
        </button>
        <button 
          onClick={() => onQuickAction("summarize")}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
        >
          <WrapText className="h-4 w-4 text-muted-foreground" />
          Summarize text
        </button>
        <button 
          onClick={() => onQuickAction("translate")}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
        >
          <Languages className="h-4 w-4 text-muted-foreground" />
          Translate...
        </button>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t bg-muted/10 p-2">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tell AI what to do..."
            className="w-full rounded-lg border border-transparent bg-muted/50 px-3 py-2.5 pr-10 text-sm focus:border-indigo-500/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <button  
            title="Send message"
            type="submit"
            disabled={!prompt.trim()}
            className="absolute right-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-indigo-500 disabled:opacity-50 transition-colors"
          >
            <ArrowUpCircle className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}