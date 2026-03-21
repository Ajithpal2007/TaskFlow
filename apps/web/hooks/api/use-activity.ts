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