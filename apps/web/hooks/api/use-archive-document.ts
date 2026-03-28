import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export const useArchiveDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ docId, isArchived }: { docId: string; isArchived: boolean }) => {
      const response = await apiClient.patch(`/docs/${docId}/archive`, { isArchived });
      return response.data.data;
    },
    onSuccess: () => {
      // 🟢 Refresh the sidebar tree so the archived doc vanishes!
      queryClient.invalidateQueries({ queryKey: ["documents", "tree"] });
      toast.success("Document moved to trash");
    },
    onError: () => {
      toast.error("Failed to archive document.");
    }
  });
};