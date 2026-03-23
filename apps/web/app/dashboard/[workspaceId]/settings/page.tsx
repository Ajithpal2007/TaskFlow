"use client";

import { useState, useEffect } from "react";
import { useWorkspace, useUpdateWorkspace, useInviteMember } from "@/hooks/api/use-workspace";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { UserPlus, Settings2, Users } from "lucide-react";

export default function WorkspaceSettingsPage({ params }: { params: { workspaceId: string } }) {
  const { data: workspace, isLoading } = useWorkspace(params.workspaceId);
  const { mutate: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace();
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember();

  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    if (workspace?.name) setWorkspaceName(workspace.name);
  }, [workspace?.name]);

  if (isLoading && !workspace) return <div className="p-10 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-muted/10">
      <div className="shrink-0 px-8 py-8 bg-background border-b">
        <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your team and workspace configurations.</p>
      </div>

      <div className="max-w-4xl w-full mx-auto p-8 space-y-8">

        {/* --- 1. GENERAL SETTINGS --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> General</CardTitle>
            <CardDescription>Update your workspace name.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-6 py-3">
            <Button 
              type="button" 
              disabled={workspaceName === workspace?.name || isUpdating || !workspaceName}
              onClick={(e) => {
                e.preventDefault();
                updateWorkspace({ workspaceId: params.workspaceId, name: workspaceName });
              }}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        {/* --- 2. MEMBER MANAGEMENT --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Members & Invites</CardTitle>
            <CardDescription>Invite colleagues to collaborate in this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Invite Form */}
            <div className="flex items-end gap-3 max-w-md">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button
                type="button" // 🟢 Stops page reloads!
                disabled={!inviteEmail || isInviting}
                onClick={(e) => {
                  e.preventDefault(); // 🛑 THE NUCLEAR SHIELD AGAINST RELOADS
                  inviteMember(
                    { workspaceId: params.workspaceId, email: inviteEmail },
                    { onSuccess: () => setInviteEmail("") }
                  );
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" /> {isInviting ? "Inviting..." : "Invite"}
              </Button>
            </div>

            <Separator />

            {/* 🟢 REAL MEMBER DATA MAPPED HERE */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Active Members</h4>
              <div className="space-y-2">
                {workspace?.members?.length > 0 ? (
                  workspace.members.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {member.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.user?.name || "Unknown User"} <span className="text-xs text-muted-foreground ml-1">({member.role})</span></p>
                          <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Remove</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No members found.</div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}