import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export const useArchiveDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({workspaceId, docId, isArchived }: { workspaceId: string; docId: string; isArchived: boolean }) => {
      const response = await apiClient.patch(`/workspaces/${workspaceId}/docs/${docId}/archive`, { isArchived });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // 🟢 3. Invalidate the specific workspace's tree!
      queryClient.invalidateQueries({ queryKey: ["documents", "tree", variables.workspaceId] });
      toast.success(variables.isArchived ? "Document moved to trash" : "Document restored");
    },
    onError: () => {
      toast.error("Failed to update document status.");
    }
  });
};