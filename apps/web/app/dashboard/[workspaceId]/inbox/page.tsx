"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/api/use-notifications";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";

// 🟢 1. Import useMutation, useQueryClient, and your apiClient for the Clear action
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

import { Button } from "@repo/ui/components/button";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  MessageSquare, 
  UserPlus, 
  Activity, 
  Inbox as InboxIcon,
  Trash2 // 🟢 2. Import Trash icon
} from "lucide-react";

export default function InboxPage() {
  const router = useRouter();
  const queryClient = useQueryClient(); // 🟢 Used to refresh the list after clearing
  
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // 🟢 3. The Clear All Mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete("/notifications/clear-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Icon Mapper
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "ASSIGNED":
        return { icon: <UserPlus className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/10" };
      case "COMMENT_ADDED":
        return { icon: <MessageSquare className="h-4 w-4 text-purple-500" />, bg: "bg-purple-500/10" };
      case "STATUS_CHANGED":
        return { icon: <Activity className="h-4 w-4 text-orange-500" />, bg: "bg-orange-500/10" };
      case "MENTIONED":
        return { icon: <Bell className="h-4 w-4 text-pink-500" />, bg: "bg-pink-500/10" };
      default:
        return { icon: <Bell className="h-4 w-4 text-muted-foreground" />, bg: "bg-muted" };
    }
  };

  // Routing Helper (Perfectly configured to open the modal!)
  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.task && activeWorkspaceId) {
      // Because this appends ?taskId=..., your TaskDetailsDialog will catch it and open!
      router.push(`/dashboard/${activeWorkspaceId}/projects/${notification.task.projectId}?taskId=${notification.task.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 h-full flex flex-col">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <InboxIcon className="h-6 w-6 text-primary" />
            Inbox
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catch up on updates across your workspace.
          </p>
        </div>

        {/* 🟢 4. BUTTON GROUP: Read & Clear */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => clearAllMutation.mutate()}
            disabled={notifications.length === 0 || clearAllMutation.isPending}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent hover:border-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        </div>
      </div>

      {/* --- NOTIFICATION LIST --- */}
      <div className="flex-1 bg-background border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            Loading inbox...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center h-full">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">You're all caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">No new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => {
              const { icon, bg } = getNotificationStyle(notification.type);
              
              return (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors relative group ${
                    !notification.isRead ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  {/* UNREAD BLUE DOT */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}

                  {/* ICON */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                    {icon}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {notification.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        {notification.task?.title || "Workspace Update"}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* MARK READ BUTTON (Only visible on hover if unread) */}
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents the row click event from firing
                        markAsRead(notification.id);
                      }}
                    >
                      <Check className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}