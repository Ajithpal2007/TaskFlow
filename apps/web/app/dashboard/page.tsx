"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaces } from "@/hooks/api/use-workspaces";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { Loader2, Sparkles } from "lucide-react"; 
import { Button } from "@repo/ui/components/button";
import { apiClient } from "@/app/lib/api-client";

export default function DashboardRootPage() {
  const router = useRouter();
  const { data: workspaces, isLoading, isSuccess, refetch } = useWorkspaces();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  // 🟢 NEW: State for our setup process
  const [isInitializing, setIsInitializing] = useState(false);
  const [loadingText, setLoadingText] = useState("Preparing your workspace...");

  // 1. The Redirect Engine (Unchanged)
  useEffect(() => {
    if (isSuccess && workspaces && workspaces.length > 0) {
      const targetWorkspace = workspaces.find((w: any) => w.id === activeWorkspaceId);
      const finalId = targetWorkspace?.id || workspaces[0]?.id;

      if (finalId && finalId !== "null" && finalId !== "undefined") {
        router.replace(`/dashboard/${finalId}`);
      }
    }
  }, [workspaces, isSuccess, activeWorkspaceId, router]);

  // 2. The Setup Function
  const handleBuildWorkspace = async () => {
    setIsInitializing(true);
    
    // Fun trick: Cycle the loading text to make the app feel "alive"
    setTimeout(() => setLoadingText("Creating demo tasks..."), 1500);
    setTimeout(() => setLoadingText("Setting up real-time chat..."), 3000);
    
    try {
      // Trigger the Fastify backend
      await apiClient.post("/workspaces/onboard");
      
      setLoadingText("Ready! Taking you there...");
      
      // Refetch the workspaces hook. 
      // This will instantly trigger the Redirect Engine in the useEffect above!
      await refetch(); 
    } catch (error) {
      console.error("Failed to initialize:", error);
      setIsInitializing(false);
      alert("Something went wrong. Please try again.");
    }
  };

  // 3. Professional Loading State (Unchanged)
  if (isLoading || (isSuccess && workspaces?.length > 0) || (isInitializing && loadingText === "Ready! Taking you there...")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium animate-pulse">Routing to your workspace...</p>
      </div>
    );
  }

  // 4. The "Zero Workspaces" Onboarding State
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 p-6 text-center bg-muted/10 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-2 max-w-md relative z-10">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary/20">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to TaskFlow</h1>
        <p className="text-muted-foreground leading-relaxed mt-4">
          We are going to set up a personalized sandbox for you. It includes a project, some interactive tasks, and a collaborative document so you can test drive the features.
        </p>
      </div>

      <div className="mt-8 relative z-10 w-full max-w-[250px]">
        {isInitializing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground animate-pulse">{loadingText}</span>
          </div>
        ) : (
          <Button 
            onClick={handleBuildWorkspace} 
            size="lg" 
            className="w-full text-md h-12 shadow-md hover:scale-105 transition-transform duration-200"
          >
            Build My Workspace
          </Button>
        )}
      </div>
      
      {/* Fallback for power users who just want to create an empty one */}
      {!isInitializing && (
         <div className="mt-4 relative z-10">
           <span className="text-xs text-muted-foreground">or </span>
           <button onClick={() => {/* Open your normal modal here if you want */}} className="text-xs font-medium text-primary hover:underline">
             create a blank workspace manually
           </button>
         </div>
      )}
    </div>
  );
}