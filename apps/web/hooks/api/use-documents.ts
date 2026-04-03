import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useDocuments(workspaceId?: string) {
  return useQuery({
    // We use a different query key so it doesn't conflict with the Editor data
    queryKey: ["documents", "tree", workspaceId],
    queryFn: async () => {
      // This hits the Recursive Fastify route we just built!
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/docs?t=${Date.now()}`);
      return data.data; // This returns the nested tree structure
    },
    // Only fetch if we actually have a workspace selected
    enabled: !!workspaceId,
    // Keep the tree in cache for 5 minutes to make sidebar navigation instant
    staleTime: 1000 * 60 * 5, 
  });
}