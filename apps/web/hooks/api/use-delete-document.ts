import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      await apiClient.delete(`/docs/${docId}`);
    },
    onSuccess: (_, docId) => {
      queryClient.invalidateQueries({ queryKey: ["documents", "trash"] });
      toast.success("Document permanently deleted");
    },
  });
};