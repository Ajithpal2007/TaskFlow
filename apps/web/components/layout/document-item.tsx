"use client";

import { useState } from "react";
import { ChevronRight, FileText, Plus, MoreHorizontal, Loader2, Trash, Archive } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@repo/ui/components/button";

import { useCreateDocument } from "@/hooks/api/use-create-document";
import { useAuth } from "@/hooks/api/use-auth";
import { useArchiveDocument } from "@/hooks/api/use-archive-document";
import { useMoveDocument } from "@/hooks/api/use-move-document";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@repo/ui/components/dropdown-menu";



interface DocumentItemProps {
  document: any; // We will type this properly later
  level?: number;
}

export function DocumentItem({ document, level = 0 }: DocumentItemProps) {
  const params = useParams();
  const { user } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);

  const { mutate: createSubDoc, isPending } = useCreateDocument();
  const { mutate: archiveDoc } = useArchiveDocument();
  const { mutate: moveDocument } = useMoveDocument();
  const [isDragOver, setIsDragOver] = useState(false);

  // --- NATIVE DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent) => {
    // Store the ID of the item being dragged in the browser's memory
    e.dataTransfer.setData("documentId", document.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow dropping
    setIsDragOver(true); // Triggers the blue highlight
  };

  const handleDragLeave = () => {
    setIsDragOver(false); // Removes the blue highlight
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Get the ID of the item we dragged
    const draggedId = e.dataTransfer.getData("documentId");

    // Prevent dropping an item onto itself, or dropping if no ID was found
    if (!draggedId || draggedId === document.id) return;

    // Expand the folder automatically so the user can see their dropped item
    if (!isExpanded) setIsExpanded(true);

    // Fire the backend mutation!
    moveDocument({ docId: draggedId, parentId: document.id });
  };



  const onArchive = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents navigating to the doc when clicking delete
    archiveDoc({ docId: document.id, isArchived: true });
  };

  const onExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const onCreateSubDoc = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    // 🟢 Automatically expand the parent so the user sees the new child!
    setIsExpanded(true);

    createSubDoc({
      title: "Untitled Sub-doc",
      workspaceId: params.workspaceId as string,
      parentId: document.id, // 👈 This links it to the current item
      authorId: user.id
    });
  };

  return (
    <div>
      <div
        // 🟢 1. Make the row draggable
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}

        style={{ paddingLeft: level ? `${level * 12 + 12}px` : "12px" }}
        className={cn(
          "group flex min-h-[32px] w-full items-center py-1 pr-3 text-sm font-medium text-muted-foreground transition-colors cursor-grab active:cursor-grabbing",
          // 🟢 2. Add visual feedback when dragging over this item
          isDragOver ? "bg-primary/20 text-primary rounded-md" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          params.docId === document.id && !isDragOver && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
      >
        {/* The Chevron Button */}
        <button onClick={onExpand} title="Expand document" className="h-full rounded-sm hover:bg-muted-foreground/20 mr-1">
          <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform text-muted-foreground/50", isExpanded && "rotate-90")} />
        </button>

        {/* 🟢 2. THE LINK: Added 'min-w-0' to prevent pushing buttons off screen */}
        <Link
          href={`/dashboard/${params.workspaceId}/docs/${document.id}`}
          className="flex flex-1 items-center gap-x-2 min-w-0"
        >
          {document.emoji ? (
            <span className="shrink-0 text-[15px] leading-none">{document.emoji}</span>
          ) : (
            <FileText className="shrink-0 h-[18px] w-[18px] text-muted-foreground" />
          )}
          <span className="truncate">{document.title || "Untitled"}</span>
        </Link>

        {/* 🟢 3. THE BUTTONS: Must use standard 'group-hover:opacity-100' */}
        <div className="ml-auto flex items-center gap-x-1 opacity-0 group-hover:opacity-100 shrink-0">

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button title="Document options" className="rounded-sm hover:bg-muted-foreground/20 p-1 transition">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" sideOffset={8} className="w-40">
              <DropdownMenuItem onClick={onArchive} className="text-destructive focus:text-destructive cursor-pointer">
                <Trash className="h-4 w-4 mr-2" />
                Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            disabled={isPending}
            onClick={onCreateSubDoc}
            className="rounded-sm hover:bg-muted-foreground/20 p-1 transition"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

        </div>
      </div>
      {/* 4. THE MAGIC: Recursion! */}
      {isExpanded && document.children && document.children.length > 0 && (
        <div>
          {document.children.map((child: any) => (
            <DocumentItem
              key={child.id}
              document={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}