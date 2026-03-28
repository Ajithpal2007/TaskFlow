import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

import { useRouter } from "next/navigation";

export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: { 
      title: string; 
      workspaceId: string; 
      parentId?: string; 
      authorId: string 
    }) => {
      const response = await apiClient.post("/docs", payload);
      return response.data.data;
    },
    onSuccess: (newDoc) => {
      // 🟢 THE KEY: This force-refreshes the sidebar tree instantly!
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      router.push(`/dashboard/${newDoc.workspaceId}/docs/${newDoc.id}`);
      toast.success("Sub-document created!");
    },
    onError: () => {
      toast.error("Failed to create document.");
    }
  });
};