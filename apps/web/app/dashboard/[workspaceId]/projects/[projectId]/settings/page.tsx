"use client";

import { useState, useEffect } from "react";
import { useProjects, useUpdateProject } from "@/hooks/api/use-projects";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Kanban, Settings2, Pencil } from "lucide-react";

export default function ProjectSettingsPage({ params }: { params: { workspaceId: string; projectId: string } }) {
  const { workspaceId, projectId } = params;

  // 1. Fetch the data
  const { data: projects, isLoading } = useProjects(workspaceId);
  const activeProject = projects?.find((p: any) => p.id === projectId);

  // 2. Bring in our new working mutation hook!
  const { mutate: updateProject, isPending } = useUpdateProject();

  // 3. Local State for the inputs
  const [name, setName] = useState("");
  const [todoLimit, setTodoLimit] = useState<number | "">("");
  const [inProgressLimit, setInProgressLimit] = useState<number | "">("");

  // Sync state when data loads
  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      // Safely parse the JSON wipLimits if they exist in the DB
      const limits = activeProject.wipLimits || {};
      setTodoLimit(limits.TODO || "");
      setInProgressLimit(limits.IN_PROGRESS || "");
    }
  }, [activeProject]);

  const handleSave = () => {
    // 🟢 Fire the network request with the new data!
    updateProject({
      projectId,
      updates: {
        name,
        wipLimits: {
          TODO: todoLimit ? Number(todoLimit) : null,
          IN_PROGRESS: inProgressLimit ? Number(inProgressLimit) : null,
        }
      }
    });
  };

  if (isLoading) return <div className="p-10">Loading project settings...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden bg-background">



      {/* SETTINGS CONTENT */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-8">
        <div className="max-w-3xl space-y-8">

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Project Details</CardTitle>
            </CardHeader>


            <CardContent>
               <Pencil className="h-4 w-4" />
              <div className="space-y-2">

                <label className="text-sm font-medium">Project Name

                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
             

            </CardContent>
          </Card>

          {/* Agile Constraints (WIP Limits) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Kanban className="h-5 w-5" /> Agile Constraints (WIP Limits)</CardTitle>
              <CardDescription>Restrict how many tasks can sit in a column to prevent bottlenecks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Todo Limit</label>
                  <Input type="number" value={todoLimit} onChange={(e) => setTodoLimit(Number(e.target.value) || "")} placeholder="No limit" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">In Progress Limit</label>
                  <Input type="number" value={inProgressLimit} onChange={(e) => setInProgressLimit(Number(e.target.value) || "")} placeholder="No limit" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🟢 THE WORKING SAVE BUTTON */}
          <div className="flex justify-end">
            <Button
              // 1. THIS IS THE CLICK HANDLER
              onClick={() => {
                console.log("Project Save Clicked! Firing mutation...");
                handleSave();
              }}

              // 2. Disabled if the name is empty or the API is currently loading
              disabled={isPending || !name}
            >
              {isPending ? "Saving..." : "Save All Changes"}
            </Button>
          </div>

        </div >
      </div >
    </div >
  );
}