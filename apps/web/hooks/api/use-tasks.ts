import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { UpdateTaskInput } from "@repo/validators";

export const useTasks = (projectId?: string) => {
  const queryClient = useQueryClient();

  // 1. READ: Fetch all tasks for the Board/Backlog
  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/project/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });

  // 2. CREATE: Mutation to add a new task to the BOARD
  const createTaskMutation = useMutation({
    mutationFn: async (newTaskData: any) => {
      const { data } = await apiClient.post(`/tasks`, newTaskData);
      return data.data;
    },
    onMutate: async (newTask) => {
      const QUERY_KEY = ["tasks", projectId];
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousTasks = queryClient.getQueryData(QUERY_KEY);

      const optimisticTask = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        status: newTask.status || "TODO",
        projectId,
        priority: "NONE",
        project: { identifier: "NEW" },
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(QUERY_KEY, (old: any) => {
        const currentList = Array.isArray(old) ? old : old?.data || [];
        return [...currentList, optimisticTask];
      });
      return { previousTasks, QUERY_KEY };
    },
    onError: (err, vars, context) => {
      if (context?.QUERY_KEY)
        queryClient.setQueryData(context.QUERY_KEY, context.previousTasks);
    },
    onSettled: (data, err, vars, context) => {
      if (context?.QUERY_KEY)
        queryClient.invalidateQueries({ queryKey: context.QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
  });

  // 3. UPDATE: Mutation for Drag-and-Drop (Status/Priority changes)
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: UpdateTaskInput;
    }) => {
      const { data } = await apiClient.patch(`/tasks/${taskId}`, updates);
      return data.data;
    },
    onMutate: async ({ taskId, updates }) => {
      const QUERY_KEY = ["tasks", projectId];
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousTasks = queryClient.getQueryData(QUERY_KEY);

      queryClient.setQueryData(QUERY_KEY, (oldTasks: any) => {
        if (!oldTasks) return [];
        return oldTasks.map((task: any) =>
          task.id === taskId ? { ...task, ...updates } : task,
        );
      });
      return { previousTasks, QUERY_KEY };
    },
    onError: (err, newTodo, context) => {
      if (context?.QUERY_KEY)
        queryClient.setQueryData(context.QUERY_KEY, context.previousTasks);
    },
    onSettled: (data, err, vars, context) => {
      if (context?.QUERY_KEY)
        queryClient.invalidateQueries({ queryKey: context.QUERY_KEY });
    },
  });

  // 4. DELETE: From Board
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.delete(`/tasks/${taskId}`);
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutate, // Using standard mutate!
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};
