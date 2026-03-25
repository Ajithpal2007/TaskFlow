"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useSession } from "@/app/lib/auth/client";

export function TaskWatchers({ task }: { task: any }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUser = session?.user;

  // Check if the current logged-in user is in the watchers array
  const isWatching = task.watchers?.some((watcher: any) => watcher.id === currentUser?.id);

  const toggleWatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/tasks/${task.id}/watch`);
      return res.data;
    },
    // Optimistic UI updates makes the button feel instant!
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["task", task.id] });
      const previousTask = queryClient.getQueryData(["task", task.id]);
      
      queryClient.setQueryData(["task", task.id], (old: any) => {
        if (!old) return old;
        
        let newWatchers = [...(old.watchers || [])];
        if (isWatching) {
          // Remove current user optimistically
          newWatchers = newWatchers.filter(w => w.id !== currentUser?.id);
        } else if (currentUser) {
          // Add current user optimistically
          newWatchers.push({ id: currentUser.id, name: currentUser.name, image: currentUser.image });
        }
        
        return { ...old, watchers: newWatchers };
      });

      return { previousTask };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["task", task.id], context?.previousTask); // Rollback on error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
    }
  });

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Watchers
        </h4>
        
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 px-2 text-xs ${isWatching ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground"}`}
          onClick={() => toggleWatchMutation.mutate()}
          disabled={toggleWatchMutation.isPending || !currentUser}
        >
          {isWatching ? <Eye className="h-3.5 w-3.5 mr-1.5" /> : <EyeOff className="h-3.5 w-3.5 mr-1.5" />}
          {isWatching ? "Watching" : "Watch"}
        </Button>
      </div>

      {/* Avatar Cluster */}
      <div className="flex flex-wrap gap-1.5">
        {!task.watchers || task.watchers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No one is watching.</p>
        ) : (
          task.watchers.map((watcher: any) => (
            <Avatar key={watcher.id} className="h-7 w-7 border border-background" title={watcher.name}>
              <AvatarImage src={watcher.image || ""} alt={watcher.name} />
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                {watcher.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          ))
        )}
      </div>
    </div>
  );
}