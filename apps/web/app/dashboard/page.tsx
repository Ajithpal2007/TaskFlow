"use client";

import { SidebarLeft } from "@/components/layout/sidebar-left";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/sidebar";
import { Button } from "@repo/ui/components/button";

// Store & Hooks
import { useUIStore } from "../../app/lib/stores/use-ui-store"; // Double check this path!
import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useProjects } from "@/hooks/api/use-projects";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";


// Components
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { CreateTaskDialog } from "@/components/kanban/create-task-dialog";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { TaskDetailsDialog } from "@/components/kanban/task-details/index";

export default function Page() {
  // 1. ALL HOOKS MUST GO AT THE TOP
  const setOpen = useUIStore((state) => state.setCreateTaskModalOpen);
  const setOpenProjectModal = useUIStore((state) => state.setCreateProjectModalOpen);

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);


  const { data: workspaces, isLoading: isWorkspacesLoading } = useWorkspaces(); 
  
  // 2. Pick the first workspace to be the "Active" one
const activeWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId) || workspaces?.[0];
  
  // 3. Get projects ONLY if we have an active workspace
  const { data: projects, isLoading: isProjectsLoading } = useProjects(activeWorkspace?.id);

  // 4. DERIVED STATE
  const activeProject = projects?.[0];
  const hasNoWorkspaces = !isWorkspacesLoading && (!workspaces || workspaces.length === 0);
  
  // Render board content based on loading and project state
  const boardContent = isProjectsLoading ? (
    <div className="flex h-full items-center justify-center">Loading board...</div>
  ) : activeProject ? (
    <KanbanBoard projectId={activeProject.id} />
  ) : (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-muted-foreground">You don't have any projects yet.</p>
      <Button onClick={() => setOpenProjectModal(true)}>
        Create First Project
      </Button>
    </div>
  );

  // 5. EARLY RETURNS (Must happen AFTER all hooks are called)
  if (isWorkspacesLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Checking your account...
      </div>
    );
  }

  // If user has NO workspaces, show the Onboarding UI ONLY
  if (hasNoWorkspaces) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Welcome to TaskFlow</h1>
          <p className="text-muted-foreground">To get started, you'll need to create a workspace for your team.</p>
        </div>
        <CreateWorkspaceDialog isFirstWorkspace={true} />
      </div>
    );
  }

  // 6. MAIN DASHBOARD (If they have a workspace)
  return (
<SidebarProvider defaultOpen={true}>
   <SidebarLeft />

   
      
      <SidebarInset>
        {/* HEADER */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border mx-2" /> {/* Separator Line */}
          <div className="font-semibold text-sm">TaskFlow / Project Management</div>
        </header>

        {/* BOARD AREA */}
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex h-24 shrink-0 items-center justify-between rounded-xl border bg-muted/20 px-6">
            <h1 className="text-2xl font-bold">
              {activeProject ? activeProject.name : "No Projects Found"}
            </h1>
            
            {/* Only show "New Task" if a project exists */}
            {activeProject && (
              <Button onClick={() => setOpen(true)}>+ New Task</Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden rounded-xl border bg-background">
            {boardContent}
          </div>

          {/* HIDDEN DIALOGS */}
          {activeProject && activeWorkspace && (
            <CreateTaskDialog 
              projectId={activeProject.id} 
              workspaceId={activeWorkspace.id} 
            />
          )}

          {activeWorkspace && (
             <CreateProjectDialog workspaceId={activeWorkspace.id} />
          )}

          <TaskDetailsDialog />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}