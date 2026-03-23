"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";

export default function DashboardRootPage() {
  const router = useRouter();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { data: workspaces, isLoading } = useWorkspaces();

  useEffect(() => {
    if (isLoading) return;

    const targetWorkspace = workspaces?.find((w: any) => w.id === activeWorkspaceId) || workspaces?.[0];

    // If they have a workspace, instantly redirect them to the nested route!
    if (targetWorkspace) {
      router.push(`/dashboard/${targetWorkspace.id}`);
    }
  }, [workspaces, isLoading, activeWorkspaceId, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Checking your account...</div>;
  }

  // If they stay on this page, it means they have 0 workspaces. Show Onboarding!
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