"use client";
import { BacklogView } from "@/components/project/backlog-view";

export default function ProjectBacklogPage({ params }: { params: { projectId: string } }) {
  return (
    <div className="h-full w-full overflow-hidden">
      <BacklogView projectId={params.projectId} />
    </div>
  );
}