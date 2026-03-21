import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useTaskSearch(projectId?: string, currentTaskId?: string, searchQuery: string = "") {
  return useQuery({
    // The query key includes the search string so it refetches when you type
    queryKey: ["task-search", projectId, currentTaskId, searchQuery],
    queryFn: async () => {
      if (!projectId || !currentTaskId) return [];
      
      const response = await apiClient.get(
        `/tasks/project/${projectId}/search?exclude=${currentTaskId}&q=${encodeURIComponent(searchQuery)}`
      );
      return response.data.data;
    },
    // Only run the query if we know what project we are in
    enabled: !!projectId && !!currentTaskId,
  });
}