import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useTrash(workspaceId?: string) {
  return useQuery({
    queryKey: ["documents", "trash", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/docs/workspace/${workspaceId}/trash`);
      return data.data;
    },
    enabled: !!workspaceId,
  });
}