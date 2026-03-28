"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

import { Button } from "@repo/ui/components/button";
import { Globe, Lock, Users, Mail, Loader2 } from "lucide-react";
import { useInviteCollaborator } from "@/hooks/api/use-invite-collaborator";
import { useState } from "react";

interface ShareModalProps {
  documentId: string;
  visibility: "PUBLIC" | "PRIVATE" | "SHARED";
  updateDocument: (updates: any) => void;
}

export function ShareDocumentModal({ documentId, visibility, updateDocument }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState("VIEW");
  const { mutate: inviteUser, isPending } = useInviteCollaborator();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Automatically change visibility to SHARED if it was PRIVATE
    if (visibility === "PRIVATE") {
      updateDocument({ visibility: "SHARED" });
    }

    inviteUser({ docId: documentId, email, accessLevel }, {
      onSuccess: () => setEmail("") // Clear input on success
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          {visibility === "PRIVATE" ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
          Share
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Manage who can view and edit this document.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Option 1: PUBLIC */}
          <div
            onClick={() => updateDocument({ visibility: "PUBLIC" })}
            className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${visibility === "PUBLIC" ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
          >
            <Globe className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">Workspace Public</span>
              <span className="text-xs text-muted-foreground">Everyone in the workspace can access this.</span>
            </div>
          </div>

          {/* Option 2: PRIVATE */}
          <div
            onClick={() => updateDocument({ visibility: "PRIVATE" })}
            className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${visibility === "PRIVATE" ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
          >
            <Lock className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium text-sm">Private</span>
              <span className="text-xs text-muted-foreground">Only you can access this document.</span>
            </div>
          </div>

          {/* Option 3: SHARED (Placeholder for next feature) */}
          <div className="my-2 border-t" />

          {/* 🟢 THE NEW INVITE FORM */}
          <div className="flex flex-col gap-2">
            <span className="font-medium text-sm">Invite Collaborators</span>
            <form onSubmit={handleInvite} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 rounded-md border bg-transparent pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <Select value={accessLevel} onValueChange={setAccessLevel}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue placeholder="Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">Can View</SelectItem>
                  <SelectItem value="EDIT">Can Edit</SelectItem>
                </SelectContent>
              </Select>

              <Button type="submit" size="sm" className="h-9" disabled={isPending || !email}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}