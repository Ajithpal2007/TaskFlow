// hooks/api/use-document.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function useDocument(docId: string) {
  const queryClient = useQueryClient();

  // 1. FETCH DOCUMENT
  const documentQuery = useQuery({
    queryKey: ["document", docId],
    queryFn: async () => {
      // Adjust this URL to match exactly where you mounted the fastify routes!
      const { data } = await apiClient.get(`/docs/${docId}`);
      return data.data;
    },
    enabled: !!docId && docId !== "undefined",
  });

  // 2. AUTO-SAVE MUTATION
  const updateDocumentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { data } = await apiClient.patch(`/docs/${docId}`, updates);
      return data.data;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["document", docId] });
      const previousDoc = queryClient.getQueryData(["document", docId]);

      // Optimistically update the UI so it feels instant
      queryClient.setQueryData(["document", docId], (old: any) => ({
        ...old,
        ...updates,
      }));

      return { previousDoc };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["document", docId], context?.previousDoc);
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document", docId] });

      if (data?.workspaceId) {
        queryClient.invalidateQueries({
          queryKey: ["documents", "tree", data.workspaceId],
        });
      } else {
        // Fallback just in case
        queryClient.invalidateQueries({ queryKey: ["documents", "tree"] });
      }
    },
  });

  return {
    document: documentQuery.data,
    isLoading: documentQuery.isLoading,
    updateDocument: updateDocumentMutation.mutate,
  };
}
