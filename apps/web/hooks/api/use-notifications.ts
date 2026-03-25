import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export const useNotifications = () => {
  const queryClient = useQueryClient();

  // 1. Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await apiClient.get("/notifications");
      return data.data;
    },
    // 🟢 MAGIC: Automatically check for new notifications every 30 seconds!
    refetchInterval: 30000, 
  });

  // 2. Mark Single Notification as Read (with Optimistic UI!)
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      // Instantly remove the red badge in the UI
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => n.id === id ? { ...n, isRead: true } : n);
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  // 3. Mark All as Read (with Optimistic UI!)
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/notifications/read-all`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      
      // Instantly clear all unread statuses
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        return old.map((n: any) => ({ ...n, isRead: true }));
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  return {
    notifications,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};