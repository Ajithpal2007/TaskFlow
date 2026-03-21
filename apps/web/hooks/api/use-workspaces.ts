import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export const useWorkspaces = () => {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      // Hits your Fastify API to get ALL workspaces for the logged-in user
      const { data } = await apiClient.get("/workspaces");
      return data.data; 
    },
  });
};