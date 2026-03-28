"use client";

import { QueryClient, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { authClient } from "@/app/lib/auth/client"; // 🟢 Added Better Auth
import { toast } from "sonner";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { useWorkspaceStore } from "../lib/stores/use-workspace-store";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const queryClient = new QueryClient();
  const setActiveWorkspaceId = useWorkspaceStore((state) => state.setActiveWorkspaceId);

  // 🟢 1. Check if the user is actually logged in before they click accept!
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  const { mutate: acceptInvite, isPending: isAccepting } = useMutation({
    mutationFn: async (inviteToken: string) => {
      // 🟢 2. Fixed the route path to match your backend exactly
      const { data } = await apiClient.post("/workspaces/invites/accept", { token: inviteToken });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      if (data.workspaceId) {
       setActiveWorkspaceId(data.workspaceId);
    }
      toast.success("Welcome to the team!");
      // Redirect them straight into their new workspace!
      router.push(`/dashboard/${data.workspaceId}`);
    },
    onError: (error: any) => {
      console.error("Failed to accept:", error);
      toast.error(error.response?.data?.message || "Failed to accept invitation");
    },
  });
  
  const handleAccept = () => {
    if (!token) return;

    // 🟢 3. THE MAGIC FIX: If they aren't logged in, send them to sign-in
    // but append the callbackUrl so Better Auth drops them right back here afterward!
    if (!session) {
      toast.info("Please sign in or create an account to accept this invite.");
      router.push(`/sign-in?callbackUrl=/invite?token=${token}`);
      return;
    }

    // If they are logged in, fire the mutation!
    acceptInvite(token);
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-lg border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Invalid Link</CardTitle>
          <CardDescription>
            This invitation link is missing its secure token or is malformed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center pt-8">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">You've been invited!</CardTitle>
        <CardDescription className="text-base mt-2">
          You have been invited to join a workspace. Click below to securely accept your invitation and join the team.
        </CardDescription>
      </CardHeader>
      <CardFooter className="pb-8 px-8">
        <Button 
          size="lg" 
          className="w-full text-md h-12" 
          onClick={handleAccept}
          // 🟢 Prevent clicking while checking session OR while accepting
          disabled={isAccepting || isSessionLoading}
        >
          {isAccepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : isSessionLoading ? (
            "Loading..."
          ) : (
             "Accept Invitation"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10 p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}>
        <InviteContent />
      </Suspense>
    </div>
  );
}