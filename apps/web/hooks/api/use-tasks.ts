import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";
import { CreateTaskInput, UpdateTaskInput } from "@repo/validators";

export const useTasks = (projectId?: string) => {
  const queryClient = useQueryClient();

  // 1. READ: Fetch all tasks for this project
  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/tasks/project/${projectId}`);
      return data.data; // Matches your { data: tasks } backend response
    },
    enabled: !!projectId, // Only run if we have a projectId
  });

  // 2. CREATE: Mutation to add a new task
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: CreateTaskInput) => {
      const { data } = await apiClient.post("/tasks", newTask);
      return data.data;
    },
    onSuccess: () => {
      // Refresh the task list automatically
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  // 3. UPDATE: Mutation for Drag-and-Drop (Status/Priority changes)
    const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: UpdateTaskInput }) => {
      const { data } = await apiClient.patch(`/tasks/${taskId}`, updates);
      return data.data;
    },

    onMutate: async ({ taskId, updates }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] }) ;

      const previousTasks = queryClient.getQueryData(["tasks", projectId]);

      queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
        if (!oldTasks) return [];
        return oldTasks.map((task: any) =>
          task.id === taskId ? { ...task, ...updates } : task
        );
      });

      // Return a context object with the snapshotted value
      return { previousTasks };
    },

    onError: (err, newTodo, context) => {
      console.error("Optimistic update failed, rolling back...", err);
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

    
  

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
  };
};