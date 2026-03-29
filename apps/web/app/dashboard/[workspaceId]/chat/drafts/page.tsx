"use client";

import { useEffect, useState } from "react";
import { Send, Edit3, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { useParams } from "next/navigation";

interface DraftItem {
  channelId: string;
  content: string;
}

export default function DraftsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  // 🟢 SCAN LOCAL STORAGE FOR DRAFTS
  useEffect(() => {
    const loadDrafts = () => {
      const foundDrafts: DraftItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("draft-")) {
          const channelId = key.replace("draft-", "");
          const content = localStorage.getItem(key);
          if (content) {
            foundDrafts.push({ channelId, content });
          }
        }
      }
      setDrafts(foundDrafts);
    };

    loadDrafts();
    
    // Listen for changes in case a draft is deleted in another tab
    window.addEventListener("storage", loadDrafts);
    return () => window.removeEventListener("storage", loadDrafts);
  }, []);

  const deleteDraft = (channelId: string) => {
    localStorage.removeItem(`draft-${channelId}`);
    setDrafts((prev) => prev.filter((d) => d.channelId !== channelId));
  };

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-background">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Send className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No pending drafts</h3>
        <p className="text-sm max-w-sm text-center">
          Any messages you start typing but don't send will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10 shrink-0">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-muted-foreground" />
          Your Drafts
        </h3>
        <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full">
          {drafts.length} Active
        </span>
      </div>

      {/* Drafts Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
        {drafts.map((draft) => (
          <div key={draft.channelId} className="bg-background border rounded-xl shadow-sm p-4 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Unfinished Message
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteDraft(draft.channelId)}
                title="Discard draft"
              >
                <Trash2 size={14} />
              </Button>
            </div>
            
            <p className="text-sm text-foreground/90 line-clamp-3 mb-4 bg-muted/30 p-3 rounded-md border border-dashed">
              "{draft.content}"
            </p>

            <div className="flex justify-end">
              <Link href={`/dashboard/${workspaceId}/chat/${draft.channelId}`}>
                <Button size="sm" className="gap-2">
                  Resume Typing <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}