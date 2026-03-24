import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "../../app/lib/api-client";
import { toast } from "sonner"

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
      // 🟢 Calling the Fastify route we built earlier
      const { data } = await apiClient.post(`/workspaces/${workspaceId}/invites`, {
        email,
        role: "MEMBER", // Hardcoding to MEMBER for now, can add a dropdown later
      });
      return data;
    },
    onSuccess: (data, variables) => {
      // Optional: If you want to show pending invites on the UI, you would invalidate a query here.
      // queryClient.invalidateQueries({ queryKey: ["workspace-invites", variables.workspaceId] });
      console.log("Invite sent successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to send invite:", error.response?.data?.message || error.message);
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

