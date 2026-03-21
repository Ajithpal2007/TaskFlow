"use client";

import { useSidebar } from "@repo/ui/components/sidebar";
import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useProjects } from "@/hooks/api/use-projects";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store"; // 1. IMPORT YOUR STORE
import { Folder, Plus, LayoutDashboard, Inbox, CheckSquare, ChevronsUpDown, Check } from "lucide-react"; // Added new icons

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

// 2. IMPORT DROPDOWN COMPONENTS
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

export function SidebarLeft() {
  const { data: workspaces } = useWorkspaces();
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();
  
  // 3. GET ACTIVE WORKSPACE FROM STORE (Fallback to first if null)
  const activeWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId) || workspaces?.[0];

  const { data: projects, isLoading: isProjectsLoading } = useProjects(activeWorkspace?.id);
  const setCreateProjectModalOpen = useUIStore((state) => state.setCreateProjectModalOpen);
  const { setOpen, state } = useSidebar(); 

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* 4. THE DROPDOWN MENU */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  size="lg" 
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                   <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
                      {activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : "W"}
                   </div>
                   <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                     <span className="truncate font-semibold">
                       {activeWorkspace ? activeWorkspace.name : "Loading..."}
                     </span>
                     <span className="truncate text-xs text-muted-foreground">Free Plan</span>
                   </div>
                   <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  Workspaces
                </div>
                {workspaces?.map((workspace: any) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setActiveWorkspaceId(workspace.id)} // SAVES TO ZUSTAND
                    className="gap-2 p-2 cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    {workspace.name}
                    {workspace.id === activeWorkspace?.id && (
                      <Check className="ml-auto size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add workspace</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* GLOBAL VIEWS */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive>
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <CheckSquare className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">My Tasks</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Inbox className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Inbox</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* PROJECTS LIST */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between group group-data-[collapsible=icon]:hidden">
            Projects
            <button 
              onClick={() => setCreateProjectModalOpen(true)} 
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted p-1 rounded"
              title="Create Project"
            >
              <Plus className="h-4 w-4 shrink-0" />
            </button>
          </SidebarGroupLabel>
          
          <SidebarMenu>
            {isProjectsLoading ? (
              <div className="px-4 py-2 text-xs text-muted-foreground animate-pulse group-data-[collapsible=icon]:hidden">
                Loading...
              </div>
            ) : projects?.length === 0 ? (
              <div className="px-4 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                No projects yet
              </div>
            ) : (
              projects?.map((project: any) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton>
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="group-data-[collapsible=icon]:hidden truncate">{project.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}