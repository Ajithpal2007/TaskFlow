import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useDeleteChannel(workspaceId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (channelId: string) => {
      await apiClient.delete(`/workspaces/${workspaceId}/chat/channels/${channelId}`);
    },
    onSuccess: (_, channelId) => {
      toast.success("Channel deleted");
      
      // 1. Instantly remove it from the sidebar list
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] });
      
      // 2. Redirect the user back to the main chat hub
      router.push(`/dashboard/${workspaceId}/chat`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete channel");
    }
  });
}