import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useMyPriorityTasks(workspaceId: string) {
  return useQuery({
    queryKey: ["priority-tasks", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/workspaces/${workspaceId}/tasks/me`);
      return data.data;
    },
    enabled: !!workspaceId,
  });
}

export function useRecentDocuments(workspaceId: string) {
  return useQuery({
    queryKey: ["recent-documents", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/documents/recent`);
      return data.data;
    },
    enabled: !!workspaceId,
  });
}