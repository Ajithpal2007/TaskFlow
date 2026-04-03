import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useTrash(workspaceId?: string) {
  return useQuery({
    queryKey: ["documents", "trash", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/docs/trash`);
      return data.data;
    },
    enabled: !!workspaceId,
  });
}