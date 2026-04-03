import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { toast } from "sonner"; // Assuming you use sonner for toasts!
import { useUIStore } from "@/app/lib/stores/use-ui-store";

export function useThread(
  messageId: string | null,
  channelId: string,
  currentUser: any,
  workspaceId: string | null,
) {
  const queryClient = useQueryClient();

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", messageId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/chat/messages/${messageId}/thread`,
      );
      return data.data;
    },
    enabled: !!messageId,
    refetchInterval: 3000,
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({
      content,
      fileUrls,
    }: {
      content: string;
      fileUrls?: string[];
    }) => {
      const { data } = await apiClient.post(`/chat/messages`,  {
        channelId,
        content,
        parentId: messageId,
        fileUrls,
      });
      return data.data;
    },
    // 🟢 1. OPTIMISTIC UPDATE MAGIC
    onMutate: async (newReply) => {
      if (!currentUser) return;

      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["thread", messageId] });

      // Snapshot the previous thread state in case we need to roll back
      const previousThread = queryClient.getQueryData(["thread", messageId]);

      // Create the "fake" instant message
      const optimisticReply = {
        id: Date.now().toString(),
        content: newReply.content,
        fileUrls: newReply.fileUrls || [],
        parentId: messageId,
        createdAt: new Date().toISOString(),
        senderId: currentUser.id,

        isOptimistic: true,
        sender: currentUser,
       
      };

      // Manually inject it into the React Query cache instantly
      queryClient.setQueryData(["thread", messageId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          replies: [...old.replies, optimisticReply],
        };
      });

      // Return a context object with the snapshotted value
      return { previousThread };
    },
    // 🟢 2. IF IT FAILS, ROLL IT BACK
    onError: (err, newReply, context) => {
      queryClient.setQueryData(["thread", messageId], context?.previousThread);
      toast.error("Failed to send reply");
    },
    // 🟢 3. WHEN IT FINISHES (Success or Fail), FETCH THE REAL DATA
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", messageId] });
    },
  });

  return {
    thread,
    isLoading,
    sendReply: sendReplyMutation.mutateAsync,
  };
}
