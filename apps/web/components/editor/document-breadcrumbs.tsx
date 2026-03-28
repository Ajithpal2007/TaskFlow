"use client";

import { useDocuments } from "@/hooks/api/use-documents";
import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@repo/ui/components/skeleton";

interface BreadcrumbsProps {
  workspaceId: string;
  docId: string;
}

export function DocumentBreadcrumbs({ workspaceId, docId }: BreadcrumbsProps) {
  // 1. Grab the already-cached tree from the sidebar hook!
  const { data: tree, isLoading } = useDocuments(workspaceId);

  // 2. The Recursive "Tree Walker" algorithm
  const findPath = (nodes: any[], targetId: string, currentPath: any[] = []): any[] | null => {
    if (!nodes) return null;
    
    for (const node of nodes) {
      // Build the path up to this current node
      const newPath = [...currentPath, { id: node.id, title: node.title, emoji: node.emoji }];
      
      // If we found the target, return the path!
      if (node.id === targetId) return newPath;
      
      // If it has children, search them. If found deep inside, pass the path back up.
      if (node.children && node.children.length > 0) {
        const foundDeep = findPath(node.children, targetId, newPath);
        if (foundDeep) return foundDeep;
      }
    }
    return null;
  };

  // 3. Execute the search
  const path = tree ? findPath(tree, docId) : [];

  if (isLoading) {
    return <Skeleton className="h-4 w-48 mb-6" />;
  }

  // If the path isn't found (or it's a brand new doc not in the tree yet), hide it safely
  if (!path || path.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-8">
      {path.map((item, index) => (
        <div key={item.id} className="flex items-center">
          
          <Link
            href={`/dashboard/${workspaceId}/docs/${item.id}`}
            className="hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 truncate max-w-[150px] px-1.5 py-0.5 rounded-md"
          >
            {item.emoji ? (
              <span className="text-[13px] leading-none">{item.emoji}</span>
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span className="truncate">{item.title || "Untitled"}</span>
          </Link>

          {/* Render the separator chevron UNLESS it's the very last item */}
          {index < path.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 mx-0.5 text-muted-foreground/50 shrink-0" />
          )}
          
        </div>
      ))}
    </nav>
  );
}