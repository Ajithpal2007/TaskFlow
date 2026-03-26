"use client";

import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useProjects } from "@/hooks/api/use-projects";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store"; 
import { Folder, Plus, LayoutDashboard, Inbox, ChevronsUpDown, Check, Settings2, LogOut, User } from "lucide-react";
import { useNotifications } from "@/hooks/api/use-notifications";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter
} from "@repo/ui/components/sidebar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/api/use-auth";

// 🟢 1. Import useRouter to fix the navigation sync!
import { usePathname, useParams, useRouter } from "next/navigation";

export function SidebarLeft() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentWorkspaceId = params.workspaceId as string;

  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  const { notifications = [] } = useNotifications(); 
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const activeWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId) || workspaces?.[0];

  const { data: projects, isLoading: isProjectsLoading } = useProjects(activeWorkspace?.id);
  const setCreateProjectModalOpen = useUIStore((state) => state.setCreateProjectModalOpen);
  const { setOpen, state } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
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
                    onClick={() => {
                      // 🟢 2. THE FIX: Sync global state AND force the URL to change instantly!
                      setActiveWorkspaceId(workspace.id);
                      router.push(`/dashboard/${workspace.id}`);
                    }}
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
              <SidebarMenuButton asChild isActive={pathname === `/dashboard/${activeWorkspace?.id}`}>
                <Link href={`/dashboard/${activeWorkspace?.id}`}>
                  <LayoutDashboard className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {activeWorkspace && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.includes("/settings")}>
                  <Link href={`/dashboard/${activeWorkspace.id}/settings`}>
                    <Settings2 className="h-4 w-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.includes("/inbox")}>
                <Link href={`/dashboard/${currentWorkspaceId}/inbox`}>
                  <Inbox className="h-4 w-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden flex-1">Inbox</span>
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 py-0 text-[10px] group-data-[collapsible=icon]:hidden"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                </Link>
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
                  <SidebarMenuButton asChild isActive={pathname.includes(`/projects/${project.id}`)}>
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
                  {/* 🟢 Added overflow hidden to prevent Avatar corners from poking out */}
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg overflow-hidden">
                    {user?.image ? (
                      <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || "U"
                    )}
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
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold overflow-hidden">
                    {user?.image ? (
                      <img src={user.image} alt={user.name || "User"} className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name || "My Account"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/${currentWorkspaceId}/profile`} className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>
                </DropdownMenuItem>

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