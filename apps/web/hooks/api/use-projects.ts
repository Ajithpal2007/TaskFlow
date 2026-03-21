import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";
import { CreateProjectInput } from "@repo/validators";


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



