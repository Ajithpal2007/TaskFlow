import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useTaskActivity(taskId?: string) {
  return useQuery({
    queryKey: ["task-activity", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const response = await apiClient.get(`/tasks/${taskId}/activity`);
      return response.data.data;
    },
    enabled: !!taskId,
  });
}


export function useWorkspaceActivity(workspaceId?: string) {
  return useQuery({
    queryKey: ["workspace-activity", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const response = await apiClient.get(`/workspaces/${workspaceId}/activity`);
      return response.data.data;
    },
    enabled: !!workspaceId,
    refetchInterval: 10000, // Auto-refresh the global feed every 10s
  });
}