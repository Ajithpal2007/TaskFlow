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
  // 2. MAIN TASK MUTATIONS
  const updateTaskMutation = useMutation({
    // 🟢 BULLETPROOF UNWRAPPER: Safely extracts the data whether it's nested or flat!
    mutationFn: async (payload: any) => {
      const actualUpdates = payload.updates ? payload.updates : payload;
      const idToUpdate = payload.taskId ? payload.taskId : taskId;

      // Now the backend receives exactly { description: "<p>hello...</p>" }
      const { data } = await apiClient.patch(`/tasks/${idToUpdate}`, actualUpdates);
      return data.data;
    },
    onMutate: async (payload) => {
      const actualUpdates = payload.updates ? payload.updates : payload;
      const idToUpdate = payload.taskId ? payload.taskId : taskId;
      
      const previousSingleTask: any = queryClient.getQueryData(["task", idToUpdate]);
      const projectId = previousSingleTask?.projectId;

      await queryClient.cancelQueries({ queryKey: ["task", idToUpdate] });
      if (projectId) await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      const previousTasks = projectId ? queryClient.getQueryData(["tasks", projectId]) : [];

      queryClient.setQueryData(["task", idToUpdate], (oldTask: any) => {
        if (!oldTask) return oldTask;
        return { ...oldTask, ...actualUpdates }; 
      });

      if (projectId) {
        queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
          if (!oldTasks) return [];
          const currentList = Array.isArray(oldTasks) ? oldTasks : oldTasks?.data || [];
          return currentList.map((t: any) => 
            t.id === idToUpdate ? { ...t, ...actualUpdates } : t
          );
        });
      }

      return { previousTasks, previousSingleTask, projectId, idToUpdate };
    },
    onError: (err, variables, context) => {
      console.error("❌ Update Task Failed:", err);
      if (context?.idToUpdate) queryClient.setQueryData(["task", context.idToUpdate], context?.previousSingleTask);
      if (context?.projectId) queryClient.setQueryData(["tasks", context.projectId], context?.previousTasks);
    },
    onSettled: (data, error, variables, context) => {
      if (context?.idToUpdate) queryClient.invalidateQueries({ queryKey: ["task", context.idToUpdate] });
      if (context?.projectId) queryClient.invalidateQueries({ queryKey: ["tasks", context.projectId] });
    },
  });




  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      // 1. Grab the projectId from the current task before we clear it
      const taskData: any = queryClient.getQueryData(["task", taskId]);
      const projectId = taskData?.projectId;

      // 2. Clear the individual task cache
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      
      // 3. 🟢 THE FIX: Tell the Kanban board to refresh its list!
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      } else {
        // Fallback just in case projectId isn't loaded: refresh ALL tasks
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }

      // 4. Close the modal
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
      console.log("🚀 1. FRONTEND SENDING:", { content });
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
    onError: (err, newComment, context) => {
      console.error("❌ 2. BACKEND REJECTED IT:", err);
       if (context?.previousTask) queryClient.setQueryData(context.QUERY_KEY, context.previousTask); },
    onSettled: (data, error, variables, context) => { if (context?.QUERY_KEY) queryClient.invalidateQueries({ queryKey: context.QUERY_KEY }); },
  });

  // 5. LINK MUTATIONS
  const linkIssueMutation = useMutation({
   mutationFn: async ({ targetTaskId, linkType }: { targetTaskId: string; linkType: string; targetTaskData: any }) => {
      
      // 🟢 THE SHOTGUN PAYLOAD: Send the string under multiple keys! 
      // This guarantees your Fastify backend finds it, no matter what req.body expects.
      await apiClient.post(`/tasks/${taskId}/links`, { 
        targetTaskId: targetTaskId, 
        linkType: linkType, 
        type: linkType,
        dependencyType: linkType
      });
    },
    onMutate: async ({ linkType, targetTaskData }) => {
      await queryClient.cancelQueries({ queryKey: ["task", taskId] });
      const previousTask = queryClient.getQueryData(["task", taskId]);

      queryClient.setQueryData(["task", taskId], (oldTask: any) => {
        if (!oldTask) return oldTask;
        const tempId = `temp-${Date.now()}`;
        const newTask = { ...oldTask };
        
        // 🟢 FIX 2: Correctly sort IS_BLOCKED_BY vs everything else
        if (linkType === "IS_BLOCKED_BY") {
          newTask.blockedBy = [
            ...(newTask.blockedBy || []), 
            // 🟢 FIX 3: Inject the `type` property here so the UI doesn't hide it for 4 seconds!
            { id: tempId, type: linkType, blocking: targetTaskData }
          ];
        } else {
          newTask.blocking = [
            ...(newTask.blocking || []), 
            // 🟢 Inject the `type` property here too!
            { id: tempId, type: linkType, blockedBy: targetTaskData }
          ];
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