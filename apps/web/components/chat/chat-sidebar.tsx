"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  MessageSquare, Activity, Send, Hash,
  Plus, ChevronDown
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { apiClient } from "@/app/lib/api-client";
import { authClient } from "@/app/lib/auth/client";
import { NewChatModal } from "./new-chat-modal";




export function ChatSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const workspaceId = params.workspaceId as string;
  const { data: session } = authClient.useSession();

  const [channels, setChannels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🟢 1. FETCH REAL DATA ON LOAD
  // 🟢 1. DEFINE IT OUTSIDE (Using useCallback so React doesn't complain)
  const fetchChannels = useCallback(async () => {
    try {
      const res = await apiClient.get(`/chat/channels?workspaceId=${workspaceId}`);
      setChannels(res.data.data);
    } catch (error) {
      console.error("Failed to load sidebar channels", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // 🟢 2. CALL IT ON PAGE LOAD
  useEffect(() => {
    if (workspaceId) fetchChannels();
  }, [workspaceId, fetchChannels]);

  // 🟢 2. SPLIT THEM INTO GROUPS VS DMS
  const groupChannels = channels.filter(c => c.type === "GROUP");
  const directMessages = channels.filter(c => c.type === "DIRECT");

  return (
    <div className="w-64 border-r bg-background/50 flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen">
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="font-semibold text-lg">Chat</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsModalOpen(true)} // 🟢 Open the modal
          className="h-8 w-8 rounded-full bg-blue-500 text-white hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* STATIC LINKS */}
        <div className="space-y-0.5">
          <Link href={`/dashboard/${workspaceId}/chat/replies`} className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
            <MessageSquare className="h-4 w-4" /> Threads
          </Link>
          <Link href={`/dashboard/${workspaceId}/chat/activity`} className="flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
            <Activity className="h-4 w-4" /> Mentions & Reactions
          </Link>
        </div>

        {isLoading ? (
          <div className="px-4 text-xs text-muted-foreground animate-pulse">Loading channels...</div>
        ) : (
          <>
            {/* 🟢 3. RENDER REAL GROUP CHANNELS */}
            <div>
              <div className="flex items-center gap-1 px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ChevronDown className="h-3 w-3" /> Channels
              </div>
              <div className="space-y-0.5">
                {groupChannels.map((c) => {
                  const isActive = pathname.includes(`/chat/${c.id}`);
                  return (
                    <Link key={c.id} href={`/dashboard/${workspaceId}/chat/${c.id}`} className={`flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                      <Hash className="h-4 w-4 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 🟢 4. RENDER REAL DIRECT MESSAGES */}
            <div>
              <div className="flex items-center gap-1 px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ChevronDown className="h-3 w-3" /> Direct Messages
              </div>
              <div className="space-y-0.5">
                {directMessages.map((dm) => {
                  const isActive = pathname.includes(`/chat/${dm.id}`);
                  // Find the OTHER user in the chat
                  const otherMember = dm.members[0]?.user;
                  const displayName = otherMember?.name || "Unknown User";

                  return (
                    <Link key={dm.id} href={`/dashboard/${workspaceId}/chat/${dm.id}`} className={`flex items-center gap-3 px-2 py-1.5 text-sm rounded-md transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                      {otherMember?.image ? (
                        <img src={otherMember.image} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                          <span className="text-[10px] text-blue-700 font-bold">{displayName.charAt(0)}</span>
                        </div>
                      )}
                      <span className="truncate">{displayName}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      {/* At the very bottom, right before the closing </div> */}
      <NewChatModal
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchChannels} // 🟢 Refreshes the sidebar instantly!
      />
    </div>
  );
}