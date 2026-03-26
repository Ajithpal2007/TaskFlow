"use client";

import { useState, useEffect } from "react";
import { useProjects, useUpdateProject } from "@/hooks/api/use-projects";
// 🟢 1. Import useSession and ShieldAlert
import { useSession } from "@/app/lib/auth/client"; 
import { ShieldAlert, Kanban, Settings2, Save, Pencil } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";

import { useWorkspace } from "@/hooks/api/use-workspace";

export default function ProjectSettingsPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  const { workspaceId, projectId } = params;

  // Fetch Session & Data
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: projects, isLoading } = useProjects(workspaceId);
  const activeProject = projects?.find((p: any) => p.id === projectId);


  const { data: workspace, isLoading: isWorkspaceLoading } = useWorkspace(workspaceId);
  const { mutate: updateProject, isPending } = useUpdateProject();

  // A. What is their role in the Workspace?
  const myWorkspaceRole = workspace?.members?.find(
    (m: any) => m.userId === currentUserId
  )?.role;
  const isWorkspaceAdmin = myWorkspaceRole === "OWNER" || myWorkspaceRole === "ADMIN";

  // B. What is their role in this specific Project?
  const myProjectRole = activeProject?.members?.find(
    (m: any) => m.userId === currentUserId
  )?.role;
  const isProjectManager = myProjectRole === "MANAGER";

  // C. THE MASTER KEY: They can manage if they are a Project Manager OR a Workspace Admin!
  const canManageProject = isWorkspaceAdmin || isProjectManager;

  
  const { data: projectMembers, isLoading: isProjectsLoading } = useProjects(workspaceId);


  const [name, setName] = useState("");
  const [todoLimit, setTodoLimit] = useState<number | "">("");
  const [inProgressLimit, setInProgressLimit] = useState<number | "">("");
  const [inReviewLimit, setInReviewLimit] = useState<number | "">("");
 

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      const limits = activeProject.wipLimits || {};
      setTodoLimit(limits.TODO || "");
      setInProgressLimit(limits.IN_PROGRESS || "");
      setInReviewLimit(limits.IN_REVIEW || "");
    }
  }, [activeProject]);

  const handleSave = () => {
    updateProject({
      projectId,
      updates: {
        name,
        wipLimits: {
          TODO: todoLimit ? Number(todoLimit) : null,
          IN_PROGRESS: inProgressLimit ? Number(inProgressLimit) : null,
          IN_REVIEW: inReviewLimit ? Number(inReviewLimit) : null,
        }
      }
    });
  };

  if (isLoading || isProjectsLoading || isWorkspaceLoading) return <div className="p-10 text-muted-foreground">Loading project settings...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden bg-muted/10">
      
      <div className="shrink-0 px-8 py-8 bg-background border-b">
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-muted-foreground mt-2">Manage constraints and details for {activeProject?.name}.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl w-full mx-auto space-y-8">

          {/* --- GENERAL SETTINGS --- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Project Details</CardTitle>
              <CardDescription>Update the core identity of your project.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-sm">
                <label className="text-sm font-medium flex items-center gap-2">Project Name <Pencil className="h-3 w-3 text-muted-foreground"/></label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={!canManageProject} // 🟢 Locked!
                />
              </div>
            </CardContent>
            
            {/* 🟢 Conditional Footer */}
            {canManageProject ? (
              <CardFooter className="border-t bg-muted/20 px-6 py-3 flex justify-end">
                <Button onClick={() => handleSave()} disabled={isPending || !name || name === activeProject?.name}>
                  {isPending ? "Saving..." : "Save Project Details"}
                </Button>
              </CardFooter>
            ) : (
              <CardFooter className="border-t bg-muted/20 px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4" /> Only Project Managers can rename this project.
              </CardFooter>
            )}
          </Card>

          {/* --- AGILE CONSTRAINTS --- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Kanban className="h-5 w-5" /> Agile Constraints (WIP Limits)</CardTitle>
              <CardDescription>Restrict how many tasks can sit in a column to prevent bottlenecks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Todo Limit</label>
                  <Input 
                    type="number" min="0" value={todoLimit} 
                    onChange={(e) => setTodoLimit(Number(e.target.value) || "")} 
                    placeholder="No limit" 
                    disabled={!canManageProject} // 🟢 Locked!
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">In Progress Limit</label>
                  <Input 
                    type="number" min="0" value={inProgressLimit} 
                    onChange={(e) => setInProgressLimit(Number(e.target.value) || "")} 
                    placeholder="No limit" 
                    disabled={!canManageProject} // 🟢 Locked!
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">In Review Limit</label>
                  <Input 
                    type="number" min="0" value={inReviewLimit} 
                    onChange={(e) => setInReviewLimit(Number(e.target.value) || "")} 
                    placeholder="No limit" 
                    disabled={!canManageProject} // 🟢 Locked!
                  />
                </div>
              </div>
            </CardContent>
            
            {/* 🟢 Conditional Footer */}
            {canManageProject ? (
              <CardFooter className="border-t bg-muted/20 px-6 py-3 flex justify-end">
                <Button variant="secondary" onClick={() => handleSave()} disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" /> Save WIP Limits
                </Button>
              </CardFooter>
            ) : (
              <CardFooter className="border-t bg-muted/20 px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4" /> Only Project Managers can change WIP limits.
              </CardFooter>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}