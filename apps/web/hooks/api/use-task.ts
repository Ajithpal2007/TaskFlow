import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

import { authClient } from "@/app/lib/auth/client";

export function useTask(taskId: string | null, onClose?: () => void) {
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();

  const { data: task, ...taskQuery } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data.data;
    },
    enabled: !!taskId,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiClient.patch(`/tasks/${taskId}`, updates);
      return response.data.data;
    },
    onMutate: async (newUpdates) => {
      // 1. Cancel background fetches so they don't overwrite our instant updates
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });

      // 2. Get the current task so we know which Project Board it belongs to
      const previousTask: any = queryClient.getQueryData(["task", taskId]);
      const projectId = previousTask?.projectId;

      // 3. Cancel board fetches
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      }

      // 4. Save previous states for rollback if the API fails
      const previousTasks = projectId
        ? queryClient.getQueryData(["tasks", projectId])
        : null;

      // --- OPTIMISTIC UPDATE 1: THE MODAL ---
      queryClient.setQueryData(["task", taskId], (old: any) => ({
        ...old,
        ...newUpdates,
      }));

      // --- OPTIMISTIC UPDATE 2: THE KANBAN BOARD ---
      if (projectId) {
        queryClient.setQueryData(["tasks", projectId], (old: any) => {
          if (!old) return old;
          // Find the specific task in the board array and update its status/priority
          return old.map((t: any) =>
            t.id === taskId ? { ...t, ...newUpdates } : t,
          );
        });
      }

      return { previousTask, previousTasks, projectId };
    },
    onError: (err, newUpdates, context) => {
      // If the API fails, roll BOTH the modal and the board back to how they were
      queryClient.setQueryData(["task", taskId], context?.previousTask);
      queryClient.invalidateQueries({ queryKey: ["task-activity", taskId] });
      if (context?.projectId) {
        queryClient.setQueryData(
          ["tasks", context.projectId],
          context?.previousTasks,
        );
      }
    },
    onSettled: (data, error, variables, context) => {
      // Background sync to ensure the server and UI are perfectly aligned
     
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      if (context?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ["tasks", context.projectId],
        });
      }
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const userId = session?.user?.id;

      if (!userId) {
        throw new Error("You must be logged in to comment");
      }
      const payload = { content, authorId: userId };
      const response = await apiClient.post(
        `/tasks/${taskId}/comments`,
        payload,
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Instantly refresh the task data to show the new comment
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      // Instantly refresh the task data to show the new comment
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      if (onClose) onClose();
    },
  });

  // apps/web/hooks/api/use-task.ts

  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!task?.id || !session?.user?.id) {
        throw new Error("Missing task or session data");
      }
      const payload = {
        title,
        projectId: task?.projectId,
        creatorId: session?.user?.id, // Get this from BetterAuth session
      };
      const response = await apiClient.post(
        `/tasks/${taskId}/subtasks`,
        payload,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  const linkTaskMutation = useMutation({
    mutationFn: async ({
      targetTaskId,
      type,
    }: {
      targetTaskId: string;
      type: "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES";
    }) => {
      const payload = { targetTaskId, type };
      const response = await apiClient.post(
        `/tasks/${taskId}/dependencies`,
        payload,
      );
      return response.data.data;
    },
    onSuccess: () => {
      // Refresh the task so the new linked issue appears instantly
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });
  return {
    ...taskQuery,
    task,
    updateTask: updateTaskMutation.mutate,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    deleteTask: deleteTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
    createSubtask: createSubtaskMutation.mutate,
    isCreatingSubtask: createSubtaskMutation.isPending,
    linkTask: linkTaskMutation.mutate,
    isLinkingTask: linkTaskMutation.isPending,
  };
}
