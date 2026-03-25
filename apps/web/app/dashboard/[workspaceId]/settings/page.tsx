"use client";

import { useSession } from "@/app/lib/auth/client";
import { useState, useEffect } from "react";
import { useWorkspace, useUpdateWorkspace, useInviteMember } from "@/hooks/api/use-workspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { UserPlus, Settings2, Users, ShieldAlert, Trash2 } from "lucide-react";

export default function WorkspaceSettingsPage({ params }: { params: { workspaceId: string } }) {
  const queryClient = useQueryClient();
  const { data: workspace, isLoading } = useWorkspace(params.workspaceId);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const myWorkspaceMemberData = workspace?.members?.find((m: any) => m.userId === currentUserId);
  const myRole = myWorkspaceMemberData?.role;
  const canManageInvites = myRole === "OWNER" || myRole === "ADMIN";

  const { mutate: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace();
  const { mutate: inviteMember, isPending: isInviting } = useInviteMember();

  // 🟢 1. MUTATION: Update Role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string, role: string }) => {
      await apiClient.patch(`/workspaces/${params.workspaceId}/members/${memberId}`, { role });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace", params.workspaceId] }),
  });

  // 🟢 2. MUTATION: Remove Member
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiClient.delete(`/workspaces/${params.workspaceId}/members/${memberId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace", params.workspaceId] }),
  });

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
        {/* --- GENERAL SETTINGS --- */}
        {/* --- 1. GENERAL SETTINGS --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> General</CardTitle>
            <CardDescription>Update your workspace name.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <label className="text-sm font-medium">Workspace Name</label>
              {/* 🟢 Disable the input if they aren't an admin! */}
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                disabled={!canManageInvites}
              />
            </div>
          </CardContent>

          {/* 🟢 CONDITIONAL RENDERING FOR THE SAVE BUTTON */}
          {canManageInvites ? (
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
          ) : (
            <CardFooter className="border-t bg-muted/20 px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4" /> Only Workspace Admins can rename the workspace.
            </CardFooter>
          )}
        </Card>

        {/* --- MEMBER MANAGEMENT --- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Members & Invites</CardTitle>
            <CardDescription>Invite colleagues to collaborate in this workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canManageInvites ? (
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
                  type="button"
                  disabled={!inviteEmail || isInviting}
                  onClick={(e) => {
                    e.preventDefault();
                    inviteMember({ workspaceId: params.workspaceId, email: inviteEmail }, { onSuccess: () => setInviteEmail("") });
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> {isInviting ? "Inviting..." : "Invite"}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground border border-dashed flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Only Workspace Admins can invite new members.
              </div>
            )}

            <Separator />

            {/* --- ACTIVE MEMBERS LIST --- */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Active Members</h4>
              <div className="space-y-2">
                {workspace?.members?.length > 0 ? (
                  workspace.members.map((member: any) => {
                    const isMe = member.userId === currentUserId;
                    const isOwner = member.role === "OWNER";

                    return (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border">
                            {member.user?.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{member.user?.name || "Unknown User"}</p>
                              {isMe && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm font-medium">YOU</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>

                        {/* 🟢 3. ROLE DROPDOWN & REMOVE BUTTON */}
                        <div className="flex items-center gap-3">
                          <Select
                            value={member.role}
                            disabled={!canManageInvites || isOwner || updateRoleMutation.isPending}
                            onValueChange={(newRole) => updateRoleMutation.mutate({ memberId: member.id, role: newRole })}
                          >
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER" disabled>Owner</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="GUEST">Guest</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={!canManageInvites || isOwner || removeMemberMutation.isPending}
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove ${member.user?.name}?`)) {
                                removeMemberMutation.mutate(member.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
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