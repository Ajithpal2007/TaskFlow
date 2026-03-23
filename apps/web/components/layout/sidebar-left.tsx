"use client";


import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useProjects } from "@/hooks/api/use-projects";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store"; // 1. IMPORT YOUR STORE
import { Folder, Plus, LayoutDashboard, Inbox, CheckSquare, ChevronsUpDown, Check, Settings2 } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@repo/ui/components/sidebar";

// 2. IMPORT DROPDOWN COMPONENTS
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";



import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/api/use-auth";
import { LogOut } from "lucide-react";
import { SidebarFooter } from "@repo/ui/components/sidebar";



export function SidebarLeft() {
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  // 3. GET ACTIVE WORKSPACE FROM STORE (Fallback to first if null)
  const activeWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId) || workspaces?.[0];

  const { data: projects, isLoading: isProjectsLoading } = useProjects(activeWorkspace?.id);
  const setCreateProjectModalOpen = useUIStore((state) => state.setCreateProjectModalOpen);
  const { setOpen, state } = useSidebar();

  const { user, logout } = useAuth();

  const pathname = usePathname();

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
              <SidebarMenuButton
                asChild // 🟢 CRITICAL: This allows the Link to behave as the button
                isActive={pathname === `/dashboard/${activeWorkspaceId}`}
              >
                <Link href={`/dashboard/${activeWorkspaceId}`}>
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <CheckSquare className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">My Tasks</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* 🟢 1. ADDED THE SETTINGS LINK HERE */}
            {activeWorkspace && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href={`/dashboard/${activeWorkspace.id}/settings`}>
                    <Settings2 className="h-4 w-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
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
                  {/* 🟢 2. WRAPPED PROJECTS IN NEXT.JS LINKS */}
                  <SidebarMenuButton asChild>
                    <Link href={`/dashboard/${activeWorkspace?.id}/projects/${project.id}`}>
                      <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="group-data-[collapsible=icon]:hidden truncate">{project.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.name || "My Account"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email || "Loading..."}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-2 p-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "My Account"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* 🟢 The Logout Button! */}
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}