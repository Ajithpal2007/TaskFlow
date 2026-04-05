"use client";

import { useTrash } from "@/hooks/api/use-trash";
import { useArchiveDocument } from "@/hooks/api/use-archive-document";
import { useDeleteDocument } from "@/hooks/api/use-delete-document";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { FileText, RefreshCcw, Trash2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns"; 

export default function TrashPage({ params }: { params: { workspaceId: string } }) {
  const { data: trashedDocs, isLoading } = useTrash(params.workspaceId);
  const { mutate: restoreDoc, isPending: isRestoring } = useArchiveDocument();
  const { mutate: deleteDoc, isPending: isDeleting } = useDeleteDocument();

  const handleRestore = (docId: string) => {
    restoreDoc({ docId, workspaceId: params.workspaceId,isArchived: false });
  };

  const handleDelete = (docId: string) => {
    if (confirm("Are you sure? This cannot be undone.")) {
      deleteDoc({ docId, workspaceId: params.workspaceId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Trash2 className="h-8 w-8 text-muted-foreground" />
          Trash
        </h1>
        <p className="text-muted-foreground mt-2">
          Documents in the trash are hidden from the sidebar. You can restore them or permanently delete them here.
        </p>
      </div>

      <div className="border rounded-lg bg-background shadow-sm">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : trashedDocs?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <AlertTriangle className="h-10 w-10 mb-4 opacity-50" />
            <p>Your trash is empty.</p>
          </div>
        ) : (
          <div className="divide-y">
            {trashedDocs?.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {doc.emoji ? (
                      <span className="text-lg">{doc.emoji}</span>
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="grid gap-0.5 min-w-0">
                    <span className="font-medium truncate">{doc.title || "Untitled"}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      Deleted {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRestore(doc.id)}
                    disabled={isRestoring || isDeleting}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(doc.id)}
                    disabled={isRestoring || isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}