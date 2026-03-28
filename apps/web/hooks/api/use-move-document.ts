import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export const useMoveDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ docId, parentId }: { docId: string; parentId: string | null }) => {
      // We reuse the existing PATCH route, just sending the new parentId!
      const response = await apiClient.patch(`/docs/${docId}`, { parentId });
      return response.data.data;
    },
    onSuccess: (data) => {
      // Instantly refresh the sidebar tree to show the new hierarchy
      queryClient.invalidateQueries({ queryKey: ["documents", "tree", data.workspaceId] });
      toast.success("Document moved!");
    },
    onError: () => {
      toast.error("Failed to move document.");
    }
  });
};