"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Hash, User } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";
import Image from "next/image";

interface NewChatModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger sidebar refresh
}

export function NewChatModal({ workspaceId, isOpen, onClose, onSuccess }: NewChatModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"GROUP" | "DIRECT">("GROUP");

  // Form States
  const [channelName, setChannelName] = useState("");
  const [workspaceUsers, setWorkspaceUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users for the DM list when the modal opens
  useEffect(() => {
    if (isOpen && tab === "DIRECT" && workspaceUsers.length === 0) {
      const fetchUsers = async () => {
        try {
          // Assuming you have an endpoint that gets workspace members. 
          // If you don't, we can use the search endpoint we built earlier!
          const res = await apiClient.get(`/search/mentions?workspaceId=${workspaceId}&q=`);
          // Filter to only show users
          const users = res.data.data.filter((item: any) => item.type === "user");
          setWorkspaceUsers(users);
        } catch (error) {
          console.error("Failed to fetch users", error);
        }
      };
      fetchUsers();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post("/chat/channels", {
        workspaceId,
        type: "GROUP",
        name: channelName,
      });

      onSuccess(); // Refresh sidebar
      onClose();   // Close modal
      router.push(`/dashboard/${workspaceId}/chat/${res.data.data.id}`); // Navigate to new chat!
      toast.success("Channel created!");
    } catch (error) {
      toast.error("Failed to create channel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDM = async (targetUserId: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post("/chat/channels", {
        workspaceId,
        type: "DIRECT",
        targetUserId,
      });

      onSuccess();
      onClose();
      router.push(`/dashboard/${workspaceId}/chat/${res.data.data.id}`);
    } catch (error) {
      toast.error("Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background w-full max-w-md rounded-xl border shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">New Conversation</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* TABS */}
        <div className="flex p-2 gap-2 bg-muted/30">
          <Button
            variant={tab === "GROUP" ? "default" : "ghost"}
            className="flex-1 rounded-lg"
            onClick={() => setTab("GROUP")}
          >
            <Hash className="h-4 w-4 mr-2" /> Channel
          </Button>
          <Button
            variant={tab === "DIRECT" ? "default" : "ghost"}
            className="flex-1 rounded-lg"
            onClick={() => setTab("DIRECT")}
          >
            <User className="h-4 w-4 mr-2" /> Direct Message
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-4">

          {tab === "GROUP" ? (
            <form onSubmit={handleSubmitGroup} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Channel Name
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. frontend-team"
                    className="w-full bg-muted border-transparent focus:border-primary focus:ring-1 focus:ring-primary rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Channels are where your team communicates. They’re best when organized around a topic.
                </p>
              </div>
              <Button type="submit" disabled={isLoading || !channelName.trim()} className="w-full">
                {isLoading ? "Creating..." : "Create Channel"}
              </Button>
            </form>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Select Team Member
              </label>
              {workspaceUsers.length === 0 ? (
                <div className="text-center p-4 text-sm text-muted-foreground">Loading team...</div>
              ) : (
                workspaceUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleStartDM(user.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Image width={32}
                      height={32} src={user.avatar || "/default-avatar.png"} alt={user.title} className="h-8 w-8 rounded-full object-cover border" />
                    <span className="font-medium text-sm flex-1">{user.title}</span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}