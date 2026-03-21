import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useEpics(projectId?: string, currentTaskId?: string) {
  return useQuery({
    queryKey: ["epics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await apiClient.get(`/tasks/project/${projectId}/epics?exclude=${currentTaskId}`);
      return response.data.data;
    },
    enabled: !!projectId,
  });
}