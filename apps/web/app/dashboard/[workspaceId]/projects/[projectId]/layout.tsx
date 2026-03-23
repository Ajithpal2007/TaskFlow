"use client";

import { useProjects, useUpdateProject } from "@/hooks/api/use-projects";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { Button } from "@repo/ui/components/button";
import { CreateTaskDialog } from "@/components/kanban/create-task-dialog";
import { ProjectTabs } from "@/components/project/project-tabs";

import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@repo/ui/components/input";
export default function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { workspaceId: string; projectId: string };
}) {
  const setOpen = useUIStore((state) => state.setCreateTaskModalOpen);
  const { data: projects, isLoading } = useProjects(params.workspaceId);
  const activeProject = projects?.find((p: any) => p.id === params.projectId);


  const { mutate: updateProject } = useUpdateProject();

  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local state in sync with the database
  useEffect(() => {
    if (activeProject?.name) {
      setProjectName(activeProject.name);
    }
  }, [activeProject?.name]);

  // Focus the input automatically when they click "edit"
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // The Save Logic
  const handleSave = () => {
    if (projectName.trim() === "") {
      setProjectName(activeProject?.name || "Unknown Project");
      setIsEditing(false);
      return;
    }

    if (projectName !== activeProject?.name) {
      // 🟢 2. Match your mutation's expected variables: { projectId, updates }
      updateProject({
        projectId: params.projectId,
        updates: { name: projectName.trim() }
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setProjectName(activeProject?.name || "");
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden bg-background">
      
      {/* 1. PROJECT HEADER */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b bg-card z-10">
        
        {/* THE INLINE EDIT TITLE */}
        <div className="flex items-center">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleSave} 
              onKeyDown={handleKeyDown}
              className="h-9 text-2xl font-bold border-primary w-[300px] px-2 shadow-sm"
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-2 px-2 py-1 -ml-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
            >
              <h1 className="text-2xl font-bold tracking-tight">
                {isLoading ? "Loading..." : projectName || "Unknown Project"}
              </h1>
              <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <Button onClick={() => setOpen(true)}>+ New Task</Button>
      </div>

      {/* 2. THE TAB NAVIGATION */}
      <div className="shrink-0 z-10 border-b bg-background px-6">
        <ProjectTabs workspaceId={params.workspaceId} projectId={params.projectId} />
      </div>

      {/* 3. THE PAGE CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-muted/10">
        {children}
      </div>

      <CreateTaskDialog projectId={params.projectId} workspaceId={params.workspaceId} />
    </div>
  );
}