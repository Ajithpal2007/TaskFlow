import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner";

export function useEditChannel(workspaceId: string, channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newName: string) => {
      const { data } = await apiClient.patch(
        `/workspaces/${workspaceId}/channels/${channelId}`,
        { name: newName }
      );
      return data.data;
    },
    onSuccess: () => {
      toast.success("Channel renamed!");
      // Instantly update the sidebar AND the settings panel with the new name
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["channel-details", workspaceId, channelId] });
    },
    onError: () => {
      toast.error("Failed to rename channel");
    }
  });
}