import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

import { authClient } from "@/app/lib/auth/client";

export function useTask(
  taskId: string | null,
  onClose?: () => void,
  selectedTaskId?: string | null,
) {
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();

  const { data: task, ...taskQuery } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialDataUpdatedAt: 0,
    initialData: () => {
      // Find all the project board queries in the cache
      const allQueries = queryClient.getQueriesData({ queryKey: ["tasks"] });

      for (const [queryKey, tasksArray] of allQueries) {
        if (Array.isArray(tasksArray)) {
          // Look for the specific task we just clicked on
          const foundTask = tasksArray.find((t: any) => t.id === taskId);
          if (foundTask) {
            // Instantly return it so the modal opens with 0 latency!
            return foundTask;
          }
        }
      }
      return undefined; // If not found, show the spinner and fetch it normally
    },
    enabled: !!taskId,
  });
  // Inside use-task.ts (or wherever your task hooks live)

  const updateTaskMutation = useMutation({
    // 1. The API Call
    mutationFn: async (updates: any) => {
      const { data } = await apiClient.patch(`/tasks/${taskId}`, updates);
      return data.data; // Adjust based on your Axios response structure
    },

    // 2. The Instant "Optimistic" Cache Update
    onMutate: async (updates) => {
      // Get the current task so we know what Project Board it belongs to
      const previousSingleTask: any = queryClient.getQueryData([
        "task",
        taskId,
      ]);
      const projectId = previousSingleTask?.projectId;

      // Cancel outgoing fetches so they don't overwrite our instant UI changes
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      }

      // Snapshot the old data for rollbacks
      const previousTasks = projectId
        ? queryClient.getQueryData(["tasks", projectId])
        : [];

      // 🟢 INSTANT UPDATE 1: The Modal (This fixes your Sidebar Dropdowns!)
      queryClient.setQueryData(["task", taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;
        return { ...oldTask, ...updates }; // Instantly merge the new status/priority/etc.
      });

      // 🟢 INSTANT UPDATE 2: The Kanban Board (This keeps the board in sync!)
      if (projectId) {
        queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
          if (!oldTasks) return [];
          return oldTasks.map((task: any) =>
            task.id === taskId ? { ...task, ...updates } : task,
          );
        });
      }

      return { previousTasks, previousSingleTask, projectId };
    },

    // 3. Rollback if the backend throws an error
    onError: (err, variables, context) => {
      console.error("Optimistic update failed, rolling back...", err);
      queryClient.setQueryData(["task", taskId], context?.previousSingleTask);
      if (context?.projectId) {
        queryClient.setQueryData(
          ["tasks", context.projectId],
          context?.previousTasks,
        );
      }
    },

    // 4. Always fetch the final truth from the DB silently in the background
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-activity", taskId] });
      if (context?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ["tasks", context.projectId],
        });
      }
    },
  });

  // 👇 CRITICAL: Ensure your exposed function just calls .mutate() directly!
  const updateTask = (updates: any) => {
    updateTaskMutation.mutate(updates);
  };

  // 2. ADD THIS NEW MUTATION FOR THE CHECKBOXES
  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/tasks/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);

      // Instantly flip the subtask checkbox in the UI
      queryClient.setQueryData(["task", taskId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          subtasks: old.subtasks?.map((st: any) =>
            st.id === id ? { ...st, status } : st,
          ),
        };
      });
      return { previousTask };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(["task", taskId], context?.previousTask);
    },
    onSettled: () => {
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

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/comments`, {
        content,
      });
      return data.data;
    },

    onMutate: async (content) => {
      // 🟢 1. DEFINE THE EXACT KEY (Make sure this matches your useQuery at the top of the file!)
      const QUERY_KEY = ["task", taskId];

      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousTask: any = queryClient.getQueryData(QUERY_KEY);

      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        author: { name: "Sending..." },
      };

      queryClient.setQueryData(QUERY_KEY, (oldTask: any) => {
        // SCENARIO 1: The cache is completely empty right now
        if (!oldTask) {
          return { id: taskId, comments: [optimisticComment] };
        }

        // SCENARIO 2: The data is wrapped in an Axios 'data' object
        if (oldTask.data) {
          return {
            ...oldTask,
            data: {
              ...oldTask.data,
              // Force the array to exist even if it was completely missing
              comments: [...(oldTask.data.comments || []), optimisticComment],
            },
          };
        }

        // SCENARIO 3: The standard flat task object (Most likely scenario)
        return {
          ...oldTask,
          // Force the array to exist even if the Kanban board didn't provide it
          comments: [...(oldTask.comments || []), optimisticComment],
        };
      });
      return { previousTask, QUERY_KEY };
    },

    onError: (err, newComment, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(context.QUERY_KEY, context.previousTask);
      }
    },

    onSettled: (data, error, variables, context) => {
      // 🟢 3. Force the exact key to refresh in the background
      if (context?.QUERY_KEY) {
        queryClient.invalidateQueries({ queryKey: context.QUERY_KEY });
      }
    },
  });

  // 1. Add the Link Creation Mutation
  const linkIssueMutation = useMutation({
    // 1. The API call (We only send the ID and Type to the backend)
    mutationFn: async ({
      targetTaskId,
      linkType,
    }: {
      targetTaskId: string;
      linkType: string;
      targetTaskData: any;
    }) => {
      await apiClient.post(`/tasks/${taskId}/links`, {
        targetTaskId,
        linkType,
      });
    },

    // 2. The Instant UI Update
    onMutate: async ({ linkType, targetTaskData }) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);

      queryClient.setQueryData(["task", taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;

        // Create a temporary ID for the optimistic badge
        const tempId = `temp-${Date.now()}`;
        const newTask = { ...oldTask };

        // Inject the search result directly into the correct array
        if (linkType === "BLOCKS") {
          newTask.blocking = [
            ...(newTask.blocking || []),
            { id: tempId, blockedBy: targetTaskData },
          ];
        } else {
          newTask.blockedBy = [
            ...(newTask.blockedBy || []),
            { id: tempId, blocking: targetTaskData },
          ];
        }

        return newTask;
      });

      return { previousTask };
    },

    // 3. Rollback on failure
    onError: (err, variables, context) => {
      console.error("Backend failed to link issue. Rolling back...", err);
      queryClient.setQueryData(["task", taskId], context?.previousTask);
    },

    // 4. Silently replace our "fake" badge with the real database data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  // 2. Add the Unlink Mutation
  const unlinkIssueMutation = useMutation({
    mutationFn: async (targetTaskId: string) => {
      await apiClient.delete(`/tasks/${taskId}/links/${targetTaskId}`);
    },
    onMutate: async (targetTaskId) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);

      // 🟢 OPTIMISTIC UPDATE: Instantly remove the badge from the screen!
      queryClient.setQueryData(["task", taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;
        return {
          ...oldTask,
          // Filter out the deleted link from BOTH arrays just to be safe
          blocking: oldTask.blocking?.filter(
            (dep: any) => dep.blockedBy?.id !== targetTaskId,
          ),
          blockedBy: oldTask.blockedBy?.filter(
            (dep: any) => dep.blocking?.id !== targetTaskId,
          ),
        };
      });

      return { previousTask };
    },
    onError: (err, variables, context) => {
      console.error("Backend failed to unlink issue. Rolling back...", err);
      // If the database fails, pop the badge back onto the screen
      queryClient.setQueryData(["task", taskId], context?.previousTask);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    },
  });

  // return { ..., linkIssue: linkIssueMutation.mutate, unlinkIssue: unlinkIssueMutation.mutate }
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
    linkTask: linkIssueMutation.mutate,
    isLinkingTask: linkIssueMutation.isPending,
    updateSubtask: updateSubtaskMutation.mutate,
    isUpdatingSubtask: updateSubtaskMutation.isPending,
    isLoadingTask: taskQuery.isLoading,
    linkIssue: linkIssueMutation.mutate,
    isLinkingIssue: linkIssueMutation.isPending,
    unlinkIssue: unlinkIssueMutation.mutate,
    isUnlinkingIssue: unlinkIssueMutation.isPending,
  };
}

