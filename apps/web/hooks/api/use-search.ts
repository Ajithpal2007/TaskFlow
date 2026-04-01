import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export const useSearch = (workspaceId: string | null, query: string) => {
  return useQuery({
    // 🟢 Changed the queryKey to be specific to global search caching
    queryKey: ["global-search", workspaceId, query], 
    queryFn: async () => {
      // 🟢 1. Updated the fallback to match our new 3 categories
      if (!query || query.length < 2) return { tasks: [], documents: [], whiteboards: [] };
      
      // 🟢 2. Point to the new backend route! 
      // (Assuming your search routes are mounted at /api/search)
      const { data } = await apiClient.get(
        `/search/global?workspaceId=${workspaceId}&q=${encodeURIComponent(query)}`
      );
      
      return data.data;
    },
    // Only fire the query if we have a workspace, and the user typed at least 2 characters!
    enabled: !!workspaceId && query.length > 1, 
  });
};