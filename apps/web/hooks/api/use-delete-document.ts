import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 🟢 Added workspaceId
    mutationFn: async ({ workspaceId, docId }: { workspaceId: string; docId: string }) => {
      await apiClient.delete(`/workspaces/${workspaceId}/docs/${docId}`);
    },
    onSuccess: (_, variables) => {
      // 🟢 Refresh that specific workspace's trash
      queryClient.invalidateQueries({ queryKey: ["documents", "trash", variables.workspaceId] });
      toast.success("Document permanently deleted");
    },
  });
};