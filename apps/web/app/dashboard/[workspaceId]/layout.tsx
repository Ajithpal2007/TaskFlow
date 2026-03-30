"use client";

import { useEffect } from "react";
import { SidebarLeft } from "@/components/layout/sidebar-left";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { TaskDetailsDialog } from "@/components/kanban/task-details/index";

import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { GlobalSearch } from "@/components/layout/global-search";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { Loader2, Search } from "lucide-react";

import { useAuth } from "@/hooks/api/use-auth";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceId: string };
}) {
  const router = useRouter();

  // 1. Fetch the user's auth status
  const { isAuthenticated, isLoading: isAuthLoading, isError } = useAuth();

  // 2. Fetch Workspaces (only runs if they are logged in)
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.find((w: any) => w.id === params.workspaceId);

  // 3. The Redirect Logic
  useEffect(() => {
    // If the check is done, and they aren't authenticated (or there was an error)
    if (!isAuthLoading && (!isAuthenticated || isError)) {
      router.push("/");
    }
  }, [isAuthLoading, isAuthenticated, isError, router]);

  // 4. The Loading Shield (Prevents the dashboard from flashing)
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // 5. The Final Security Block (Don't render the sidebar if they are being redirected)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarLeft />

      <SidebarInset className="min-w-0 bg-background flex flex-col h-screen overflow-hidden ">
        {/* HEADER - Locks to the top */}

        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border mx-2" />

          {/* 🟢 LEFT SIDE: Breadcrumbs */}
          <div className="font-semibold text-sm text-muted-foreground">
            {activeWorkspace ? activeWorkspace.name : "Loading Workspace..."} / Project Management
          </div>

          <ThemeToggle />

          {/* 🟢 RIGHT SIDE: Search & Notifications */}
          {/* We moved ml-auto to this wrapper so everything inside gets pushed right! */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => useUIStore.getState().setSearchOpen(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-md border transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* THE NOTIFICATION BELL */}
            <NotificationBell workspaceId={params.workspaceId} />
          </div>
        </header>
        {/* PAGE CONTENT (Either the Workspace Home or the Kanban Board) */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {isAuthLoading ? (
            // 🟢 Show loader INSIDE the main area, so the Sidebar stays steady!
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            children
          )}
        </main>

        {/* HIDDEN GLOBAL DIALOGS */}
        <CreateProjectDialog />
        <TaskDetailsDialog />
        <GlobalSearch />
      </SidebarInset>
    </SidebarProvider>
  );
}