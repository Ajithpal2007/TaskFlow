"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useRouter } from "next/navigation";
import { FileText, Plus, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import Link from "next/link";

export default function DocsHubPage({ params }: { params: { workspaceId: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Fetch all docs for this workspace
  const { data: docs, isLoading } = useQuery({
    queryKey: ["docs", params.workspaceId],
    queryFn: async () => {
      // You might need to add this GET route to your fastify backend! 
      // e.g., fastify.get('/workspaces/:workspaceId/docs', ...)
      const { data } = await apiClient.get(`/workspaces/${params.workspaceId}/docs`);
      return data.data;
    },
  });

  // 2. Create a new blank doc and instantly redirect to the canvas
  const createDocMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/workspaces/${params.workspaceId}/projects/GLOBAL/docs`, {
        title: "", // Starts blank!
      });
      return data.data;
    },
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: ["docs", params.workspaceId] });
      // Redirect straight into the BlockNote editor we built earlier!
      // (Adjust this URL based on where you put your DocumentPage)
      router.push(`/dashboard/${params.workspaceId}/docs/${newDoc.id}`); 
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Docs Hub</h1>
          <p className="text-muted-foreground mt-1">Create and manage your workspace wikis, notes, and specs.</p>
        </div>
        <Button 
          onClick={() => createDocMutation.mutate()} 
          disabled={createDocMutation.isPending}
        >
          {createDocMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          New Document
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading your docs...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {docs?.map((doc: any) => (
            <Link key={doc.id} href={`/dashboard/${params.workspaceId}/docs/${doc.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center h-40 border-dashed hover:border-solid">
                <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="font-semibold truncate w-full">{doc.title || "Untitled Document"}</p>
                <p className="text-xs text-muted-foreground mt-1">Updated recently</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}