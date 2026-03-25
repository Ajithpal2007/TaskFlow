"use client";

import { Bell, Check, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@repo/ui/components/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { formatDistanceToNow } from "date-fns"; // npm install date-fns
import Link from "next/link";
import { useSession } from "@/app/lib/auth/client";

export function NotificationBell({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // 1. Fetch Notifications (Auto-refreshes every 30 seconds)
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get("/notifications");
      return res.data.data;
    },
    enabled: !!session?.user,
    refetchInterval: 30000,
  });

  // 2. Mark ALL as Read Mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notifications/read-all");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // 3. Mark ONE as Read Mutation
  const markOneReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete("/notifications/clear-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />

          {/* THE RED BADGE */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg z-[100]">
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
          <span className="text-sm font-semibold">Notifications</span>

          {/* Action Buttons Group */}
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.preventDefault();
                  markAllReadMutation.mutate();
                }}
                disabled={markAllReadMutation.isPending}
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Read
              </Button>
            )}

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.preventDefault();
                  clearAllMutation.mutate();
                }}
                disabled={clearAllMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
              You're all caught up!
            </div>
          ) : (
            notifications.map((notification: any) => (
              <div key={notification.id}>
                <DropdownMenuItem
                  asChild
                  className="p-4 cursor-pointer focus:bg-muted/50 rounded-none data-[state=open]:bg-muted/50"
                  onClick={() => {
                    // If they click an unread notification, mark it as read!
                    if (!notification.isRead) {
                      markOneReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  {/* Generate the exact URL using your new task.projectId relation! */}
                  {notification.taskId && notification.task?.projectId ? (
                    <Link
                      href={`/dashboard/${workspaceId}/projects/${notification.task.projectId}?taskId=${notification.taskId}`}
                      className="flex flex-col gap-1 w-full outline-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm ${!notification.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {notification.content}
                        </span>
                        {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-1 w-full outline-none">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm ${!notification.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {notification.content}
                        </span>
                        {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}