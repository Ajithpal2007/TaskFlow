import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store"; 

export function useTags() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const response = await apiClient.get(`/workspaces/${activeWorkspaceId}/tags`);
      return response.data.data;
    },
    enabled: !!activeWorkspaceId,
  });

  const createTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const payload = { name, color };
      const response = await apiClient.post(`/workspaces/${activeWorkspaceId}/tags`, payload);
      return response.data.data;
    },
    onSuccess: () => {
      // Instantly refresh the tags list when a new one is created
      queryClient.invalidateQueries({ queryKey: ["tags", activeWorkspaceId] });
    },
  });

  return {
    tags: tagsQuery.data || [],
    isLoadingTags: tagsQuery.isLoading,
    createTag: createTagMutation.mutate, 
    isCreatingTag: createTagMutation.isPending,
  };
}