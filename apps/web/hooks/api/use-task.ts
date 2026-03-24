import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { authClient } from "@/app/lib/auth/client";

export function useTask(taskId: string | null, onClose?: () => void, selectedTaskId?: string | null) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();

  // 1. FETCH SINGLE TASK
  const { data: task, ...taskQuery } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, 
    initialDataUpdatedAt: 0,
    initialData: () => {
      const allQueries = queryClient.getQueriesData({ queryKey: ["tasks"] });
      for (const [queryKey, tasksArray] of allQueries) {
        if (Array.isArray(tasksArray)) {
          const foundTask = tasksArray.find((t: any) => t.id === taskId);
          if (foundTask) return foundTask;
        }
      }
      return undefined; 
    },
    enabled: !!taskId,
  });

  // 2. MAIN TASK MUTATIONS
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data } = await apiClient.patch(`/tasks/${taskId}`, updates);
      return data.data;
    },
    onMutate: async (updates) => {
      const previousSingleTask: any = queryClient.getQueryData(["task", taskId]);
      const projectId = previousSingleTask?.projectId;

      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      if (projectId) await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      const previousTasks = projectId ? queryClient.getQueryData(["tasks", projectId]) : [];

      queryClient.setQueryData(["task", taskId], (oldTask: any) => ({ ...oldTask, ...updates }));

      if (projectId) {
        queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
          if (!oldTasks) return [];
          return oldTasks.map((t: any) => t.id === taskId ? { ...t, ...updates } : t);
        });
      }

      return { previousTasks, previousSingleTask, projectId };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["task", taskId], context?.previousSingleTask);
      if (context?.projectId) queryClient.setQueryData(["tasks", context.projectId], context?.previousTasks);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      if (context?.projectId) queryClient.invalidateQueries({ queryKey: ["tasks", context.projectId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      if (onClose) onClose();
    },
  });

  // 3. SUBTASK MUTATIONS
  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const payload = { title, projectId: task?.projectId, creatorId: session?.user?.id };
      const response = await apiClient.post(`/tasks/${taskId}/subtasks`, payload);
      return response.data.data;
    },
    onMutate: async (newTitle) => {
      const QUERY_KEY = ["task", taskId];
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousTask = queryClient.getQueryData(QUERY_KEY);

      const optimisticSubtask = { id: `temp-${Date.now()}`, title: newTitle, status: "TODO", createdAt: new Date().toISOString() };

      queryClient.setQueryData(QUERY_KEY, (old: any) => {
        if (!old) return old;
        return { ...old, subtasks: [...(old.subtasks || []), optimisticSubtask] };
      });

      return { previousTask, QUERY_KEY };
    },
    onError: (err, vars, context) => { if (context?.QUERY_KEY) queryClient.setQueryData(context.QUERY_KEY, context.previousTask); },
    onSettled: (data, error, vars, context) => { if (context?.QUERY_KEY) queryClient.invalidateQueries({ queryKey: context.QUERY_KEY }); },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, status, title }: { id: string; status?: string; title?: string }) => {
      await apiClient.patch(`/tasks/${id}`, { status, title });
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);
      queryClient.setQueryData(["task", taskId], (old: any) => {
        if (!old) return old;
        return { ...old, subtasks: old.subtasks?.map((st: any) => st.id === updates.id ? { ...st, ...updates } : st) };
      });
      return { previousTask };
    },
    onError: (err, vars, context) => queryClient.setQueryData(["task", taskId], context?.previousTask),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      await apiClient.delete(`/tasks/${subtaskId}`);
    },
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);
      queryClient.setQueryData(["task", taskId], (old: any) => {
        if (!old) return old;
        return { ...old, subtasks: old.subtasks?.filter((st: any) => st.id !== subtaskId) };
      });
      return { previousTask };
    },
    onError: (err, vars, context) => queryClient.setQueryData(["task", taskId], context?.previousTask),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  // 4. COMMENT MUTATIONS
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await apiClient.post(`/tasks/${taskId}/comments`, { content });
      return data.data;
    },
    onMutate: async (content) => {
      const QUERY_KEY = ["task", taskId];
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousTask: any = queryClient.getQueryData(QUERY_KEY);

      const optimisticComment = { id: `temp-${Date.now()}`, content, createdAt: new Date().toISOString(), author: { name: "Sending..." } };

      queryClient.setQueryData(QUERY_KEY, (oldTask: any) => {
        if (!oldTask) return { id: taskId, comments: [optimisticComment] };
        if (oldTask.data) {
          return { ...oldTask, data: { ...oldTask.data, comments: [...(oldTask.data.comments || []), optimisticComment] } };
        }
        return { ...oldTask, comments: [...(oldTask.comments || []), optimisticComment] };
      });
      return { previousTask, QUERY_KEY };
    },
    onError: (err, newComment, context) => { if (context?.previousTask) queryClient.setQueryData(context.QUERY_KEY, context.previousTask); },
    onSettled: (data, error, variables, context) => { if (context?.QUERY_KEY) queryClient.invalidateQueries({ queryKey: context.QUERY_KEY }); },
  });

  // 5. LINK MUTATIONS
  const linkIssueMutation = useMutation({
    mutationFn: async ({ targetTaskId, linkType }: { targetTaskId: string; linkType: string; targetTaskData: any }) => {
      await apiClient.post(`/tasks/${taskId}/links`, { targetTaskId, linkType });
    },
    onMutate: async ({ linkType, targetTaskData }) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);

      queryClient.setQueryData(["task", taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;
        const tempId = `temp-${Date.now()}`;
        const newTask = { ...oldTask };
        if (linkType === "BLOCKS") {
          newTask.blocking = [...(newTask.blocking || []), { id: tempId, blockedBy: targetTaskData }];
        } else {
          newTask.blockedBy = [...(newTask.blockedBy || []), { id: tempId, blocking: targetTaskData }];
        }
        return newTask;
      });
      return { previousTask };
    },
    onError: (err, variables, context) => queryClient.setQueryData(["task", taskId], context?.previousTask),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  const unlinkIssueMutation = useMutation({
    mutationFn: async (targetTaskId: string) => {
      await apiClient.delete(`/tasks/${taskId}/links/${targetTaskId}`);
    },
    onMutate: async (targetTaskId) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);

      queryClient.setQueryData(["task", taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;
        return {
          ...oldTask,
          blocking: oldTask.blocking?.filter((dep: any) => dep.blockedBy?.id !== targetTaskId),
          blockedBy: oldTask.blockedBy?.filter((dep: any) => dep.blocking?.id !== targetTaskId),
        };
      });
      return { previousTask };
    },
    onError: (err, variables, context) => queryClient.setQueryData(["task", taskId], context?.previousTask),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["task", taskId] }),
  });

  return {
    ...taskQuery,
    task,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
    createSubtask: createSubtaskMutation.mutate,
    isCreatingSubtask: createSubtaskMutation.isPending,
    updateSubtask: updateSubtaskMutation.mutate,
    isUpdatingSubtask: updateSubtaskMutation.isPending,
    deleteSubtask: deleteSubtaskMutation.mutate,
    isDeletingSubtask: deleteSubtaskMutation.isPending,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    linkIssue: linkIssueMutation.mutate,
    isLinkingIssue: linkIssueMutation.isPending,
    unlinkIssue: unlinkIssueMutation.mutate,
    isUnlinkingIssue: unlinkIssueMutation.isPending,
  };
}