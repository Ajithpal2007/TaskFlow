import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export const useSearch = (workspaceId: string | null, query: string) => {
  return useQuery({
    queryKey: ["search", workspaceId, query],
    queryFn: async () => {
      if (!query || query.length < 2) return { tasks: [], projects: [] };
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/search?q=${encodeURIComponent(query)}`);
      return data.data;
    },
    // Only fire the query if we have a workspace, and the user typed at least 2 characters!
    enabled: !!workspaceId && query.length > 1, 
  });
};