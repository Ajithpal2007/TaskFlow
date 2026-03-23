import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";



export const useProjects = (workspaceId?: string)=>{
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () =>{

      const { data } = await apiClient.get(`/projects/workspace/${workspaceId}`);
      return data.data; // Returning the project objects
    },
    enabled: !!workspaceId, // Only fetch if the workspaceId exists in the URL
  })
} 



export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: any }) => {
      // 🟢 This will fire the network request!
      const { data } = await apiClient.patch(`/projects/${projectId}`, updates);
      return data.data;
    },
    onSuccess: (_, variables) => {
      // Instantly refresh the UI
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}