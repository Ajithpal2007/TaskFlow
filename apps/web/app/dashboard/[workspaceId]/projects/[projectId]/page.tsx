"use client";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function ProjectBoardPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  return (
    <div className="h-full w-max min-w-full p-6 overflow-auto">
      <KanbanBoard projectId={params.projectId} workspaceId={params.workspaceId} />
    </div>
  );
}