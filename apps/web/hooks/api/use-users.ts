import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";

export function useUsers() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  return useQuery({
    queryKey: ["users", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      // Fetch users belonging to this workspace
      const response = await apiClient.get(`/workspaces/${activeWorkspaceId}/users`);
      return response.data.data;
    },
    enabled: !!activeWorkspaceId,
  });
}