import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useChannelDetails(workspaceId: string, channelId: string) {
  return useQuery({
    // Unique cache key for this specific channel's details
    queryKey: ["channel-details", workspaceId, channelId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `chat/workspaces/${workspaceId}/channels/${channelId}`
      );
      return data.data;
    },
    // Don't fetch if we don't have a channel ID yet
    enabled: !!channelId && !!workspaceId,
    // Keep the data fresh, but don't spam the server
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}