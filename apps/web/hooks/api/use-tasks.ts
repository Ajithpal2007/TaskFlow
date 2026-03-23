import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";
import { CreateTaskInput, UpdateTaskInput } from "@repo/validators";
import { TaskStatus } from "@repo/database";

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
   mutationFn: async ({ title, status, projectId }: any) => {
      // 🟢 Changed URL to '/tasks' and added projectId to the body
      const { data } = await apiClient.post(`/tasks`, { 
        title, 
        status,
        projectId ,
       
      });
      return data.data;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);

      // 🟢 Build a "Fake" card instantly
      const optimisticTask = {
        id: `temp-${Date.now()}`,
        title: newTask.title,
        status: newTask.status,
        projectId: newTask.projectId,
        priority: "NONE", // Default styling fallbacks
        type: "TASK",
        sequenceId: "...",
        project: { identifier: "NEW" },
        createdAt: new Date().toISOString(),
      };

      // 🟢 Inject it straight into the board cache
      queryClient.setQueryData(["tasks", projectId], (old: any) => {
        return [...(old || []), optimisticTask];
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      console.error("Failed to create task", err);
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
    },
    onSettled: () => {
      // Swap the fake card for the real database card quietly in the background
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    }
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
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },


    
  });


const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.delete(`/tasks/${taskId}`);
      return data;
    },
    onSettled: () => {
      // Refresh the board/backlog
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      // Refresh the analytics dashboard instantly
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
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
    deleteTask: deleteTaskMutation.mutate,
    isDeleting: deleteTaskMutation.isPending,
  };
};