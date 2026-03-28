"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { Loader2 } from "lucide-react"; // 🟢 Added a professional spinner

export default function DashboardRootPage() {
  const router = useRouter();

  // 1. Fetch data
  const { data: workspaces, isLoading, isSuccess } = useWorkspaces();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  // 2. The Redirect Engine
  useEffect(() => {
    if (isSuccess && workspaces) {
      if (workspaces.length > 0) {
        // Safely find the workspace, fallback to the first one safely
        const targetWorkspace = workspaces.find((w: any) => w.id === activeWorkspaceId);
        const finalId = targetWorkspace?.id || workspaces[0]?.id;

        // ONLY redirect if we actually have a valid string ID!
        if (finalId && finalId !== "null" && finalId !== "undefined") {
          router.replace(`/dashboard/${finalId}`);
        }
      }
    }
  }, [workspaces, isSuccess, activeWorkspaceId, router]);

  // 3. Professional Loading State
  if (isLoading || isSuccess && workspaces?.length > 0) {
    // Note: We keep showing the spinner even AFTER success if they have workspaces, 
    // to prevent the "Welcome" screen from flashing for a split second before the router.push executes!
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Routing to your workspace...</p>
      </div>
    );
  }

  // 4. The "Zero Workspaces" Onboarding State
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-6 text-center bg-muted/10">
      <div className="space-y-2 max-w-md">
        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl font-bold text-primary">TF</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to TaskFlow</h1>
        <p className="text-muted-foreground">
          To get started, you need to create a secure workspace for your team's projects and tasks.
        </p>
      </div>

      <div className="mt-4">
        <CreateWorkspaceDialog isFirstWorkspace={true} />
      </div>
    </div>
  );
}