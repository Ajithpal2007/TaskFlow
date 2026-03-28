import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export const useInviteCollaborator = () => {
  return useMutation({
    mutationFn: async ({ docId, email, accessLevel }: { docId: string; email: string; accessLevel: string }) => {
      const response = await apiClient.post(`/docs/${docId}/invite`, { email, accessLevel });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send invite.");
    }
  });
};