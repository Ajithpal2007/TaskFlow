import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";

// --- 1. EXISTING FETCH HOOK ---
export const useWorkspace = (slug: string) => {
  return useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      // Hits your Fastify GET /api/workspaces/:slug
      const { data } = await apiClient.get(`/workspaces/${slug}`);
      return data.data; // Returning the workspace object
    },
    enabled: !!slug, // Only fetch if the slug exists in the URL

    placeholderData: keepPreviousData,
  });
};

// --- 2. NEW MUTATION: UPDATE WORKSPACE ---
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, name }: { workspaceId: string; name: string }) => {
      const { data } = await apiClient.patch(`/workspaces/${workspaceId}`, { name });
      return data.data;
    },
    onSuccess: (_, variables) => {
      // Refresh the specific workspace AND the global list in the sidebar instantly!
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

// --- 3. NEW MUTATION: INVITE MEMBER ---
export function useInviteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ workspaceId, email }: { workspaceId: string; email: string }) => {
      const { data } = await apiClient.post(`/workspaces/${workspaceId}/members`, { email });
      return data.data;
    },
    onSuccess: (_, variables) => {
      // Refresh the workspace data so the new member appears in the UI
      queryClient.invalidateQueries({ queryKey: ["workspace", variables.workspaceId] });
    },
  });
}

// Add this inside use-workspace.ts
export const useWorkspaceAnalytics = (workspaceId: string) => {
  return useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/workspaces/${workspaceId}/analytics`);
      return data.data;
    },
    enabled: !!workspaceId,
  });
};