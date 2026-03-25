"use client";

import { Clock3, Loader2 } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";

export function TaskTimeTracking({ task }: { task: any }) {
  const queryClient = useQueryClient();

  // Standard task update mutation - we use this for single field updates
  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      // Assuming your standard task PATCH route is /tasks/[id]
      const res = await apiClient.patch(`/tasks/${task.id}`, updates);
      return res.data;
    },
    // We use optimistic updates to make the inputs feel instant!
    onMutate: async (newUpdates: any) => {
      await queryClient.cancelQueries({ queryKey: ["task", task.id] });
      const previousTask = queryClient.getQueryData(["task", task.id]);
      
      queryClient.setQueryData(["task", task.id], (old: any) => {
        if (!old) return old;
        return { ...old, ...newUpdates };
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

  // Calculate variance for display (positive is good, negative is bad)
  const variance = task.estimatedHours && task.actualHours 
    ? (task.estimatedHours - task.actualHours).toFixed(1)
    : null;

  return (
    <div className="space-y-2.5 pt-4 border-t" id="time-tracking-section">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Clock3 className="h-3.5 w-3.5" />
        Time Tracking
      </h4>

      <div className="flex gap-4">
        {/* ESTIMATED HOURS INPUT */}
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Estimate (hrs)</label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              defaultValue={task.estimatedHours || ""}
              placeholder="0.0"
              className="h-8 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              onBlur={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                // Only send the update if it's different from the current task value
                if (value !== task.estimatedHours) {
                  updateMutation.mutate({ estimatedHours: value });
                }
              }}
            />
          </div>
        </div>

        {/* ACTUAL HOURS INPUT */}
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Actual (hrs)</label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              defaultValue={task.actualHours || ""}
              placeholder="0.0"
              className="h-8 text-sm focus-visible:ring-1 focus-visible:ring-ring"
              onBlur={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : null;
                // Only send the update if it's different from the current task value
                if (value !== task.actualHours) {
                  updateMutation.mutate({ actualHours: value });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Variance Display - purely for display */}
      {variance !== null && (
        <div className="pt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Variance</span>
          <span className={parseFloat(variance) >= 0 ? "text-green-500 font-medium" : "text-destructive font-medium"}>
            {parseFloat(variance) >= 0 ? "+" : ""}{variance} hrs
          </span>
        </div>
      )}
    </div>
  );
}