"use client";

import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client"; // Adjust path if needed
 import { toast } from "sonner"; // Optional: if you use toasts

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";

// Next.js requires components using `useSearchParams` to be wrapped in a Suspense boundary
function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");


  // 🟢 The Mutation to send the token to Fastify
  const { mutate: acceptInvite, isPending } = useMutation({
    mutationFn: async (inviteToken: string) => {
      // Calls the Fastify route we just built
      const { data } = await apiClient.post("/workspaces/invites/accept", { token: inviteToken });
      return data;
    },
    onSuccess: (data) => {
      // toast.success("Welcome to the team!");
      // 🟢 Redirect them straight into their new workspace!
      router.push(`/dashboard/${data.workspaceId}`);
    },
    onError: (error: any) => {
      console.error("Failed to accept:", error);
      if (error.response?.status === 401) {
        
        router.push("/sign-in")
      } else {
        // Optional: Show a toast notification for other errors (like expired tokens)
        alert(error.response?.data?.message || "Failed to accept invitation");
      }
    },
  });
  
  const handleAccept = () => {
    if (token) {
      acceptInvite(token);
    }
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
          disabled={isPending}
        >
          {isPending ? "Accepting..." : "Accept Invitation"}
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