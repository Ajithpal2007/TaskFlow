import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";

export const useWorkspace = (slug: string) => {
  return useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      // Hits your Fastify GET /api/workspaces/:slug
      const { data } = await apiClient.get(`/workspaces/${slug}`);
      return data.data; // Returning the workspace object
    },
    enabled: !!slug, // Only fetch if the slug exists in the URL
  });
};