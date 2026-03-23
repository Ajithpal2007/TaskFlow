"use client";

import { useState } from "react"; 
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { CheckSquare, Plus } from "lucide-react";

import { Progress } from "@repo/ui/components/progress";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";

// 1. DEFINE PROPS
interface TaskSubtasksProps {
  task: any;
  createSubtask: (title: string, options?: any) => void;
  isCreatingSubtask: boolean;
}

export function TaskSubtasks({ task, createSubtask, isCreatingSubtask }: TaskSubtasksProps) {
  const queryClient = useQueryClient();

  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  if (!task) return null;

  // --- PROGRESS CALCULATION ---
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((st: any) => st.status === "DONE").length || 0;
  const progressPercentage = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  
  // --- MUTATION FOR CHECKBOXES (WITH OPTIMISTIC UI) ---
  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // "Fire and forget" the API call
      await apiClient.patch(`/tasks/${id}`, { status });
    },
    
    // 🟢 1. Run this instantly the millisecond they click
    onMutate: async ({ id, status }) => {
      // Cancel background fetches so they don't overwrite our instant update
      await queryClient.cancelQueries({ queryKey: ["task", task.id] });

      // Save the old state just in case the API crashes
      const previousTask = queryClient.getQueryData(["task", task.id]);

      // 🟢 OPTIMISTICALLY UPDATE THE CACHE
      queryClient.setQueryData(["task", task.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          // Find the specific subtask and flip its status instantly
          subtasks: old.subtasks.map((st: any) => 
            st.id === id ? { ...st, status } : st
          )
        };
      });

      return { previousTask };
    },
    
    // 🔴 2. If the API fails, roll back to the old state
    onError: (err, newSubtask, context) => {
      queryClient.setQueryData(["task", task.id], context?.previousTask);
    },
    
    // 🔵 3. Always refetch silently in the background when done to ensure perfect sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
    },
  });

  // --- HANDLERS ---
  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      setIsAddingSubtask(false); 
      return;
    }

    createSubtask(newSubtaskTitle, {
      onSuccess: () => {
        setNewSubtaskTitle(""); 
        setIsAddingSubtask(false);
      }
    });
  };

  // 2. REMOVED LAYOUT WRAPPERS - Just returning the core Subtask UI
  return (
    <div className="space-y-4 pt-6 border-t">

      {/* 1. Header with Counter & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <CheckSquare className="h-5 w-5 text-muted-foreground" />
          Subtasks
        </div>

        <div className="flex items-center gap-4">
          {totalSubtasks > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {completedSubtasks} / {totalSubtasks}
            </span>
          )}
          
          {/* Re-added the button to trigger the input! */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setIsAddingSubtask(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* 2. The Progress Bar */}
      {totalSubtasks > 0 && (
        <Progress
          value={progressPercentage}
          className="h-2 w-full bg-muted"
        />
      )}

      {/* 3. The Subtask List & Inputs */}
      <div className="ml-7 space-y-2">

        {/* Existing Subtasks */}
        {task.subtasks?.map((subtask: any) => (
          <div key={subtask.id} className="flex items-start gap-3 group py-1">
            <Input
              type="checkbox"
              checked={subtask.status === "DONE"}
              onChange={(e) => {
                updateSubtaskMutation.mutate({
                  id: subtask.id,
                  status: e.target.checked ? "DONE" : "TODO"
                });
              }}
              className="mt-1 h-4 w-4 rounded border-muted-foreground/30 accent-primary cursor-pointer"
            />
            <span className={`text-sm flex-1 ${subtask.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {subtask.title}
            </span>
          </div>
        ))}

        {/* Inline Input for NEW subtask */}
        {isAddingSubtask && (
          <div className="flex items-center gap-3 py-1">
            <div className="h-4 w-4 rounded border border-dashed border-muted-foreground/50 shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
              placeholder="What needs to be done?"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubtask();
                if (e.key === "Escape") {
                  setIsAddingSubtask(false);
                  setNewSubtaskTitle("");
                }
              }}
              onBlur={() => {
                if (newSubtaskTitle.trim()) handleCreateSubtask();
                else setIsAddingSubtask(false);
              }}
              disabled={isCreatingSubtask}
            />
          </div>
        )}

        {/* Empty state */}
        {(!task.subtasks || task.subtasks.length === 0) && !isAddingSubtask && (
          <p className="text-sm text-muted-foreground italic">No subtasks added yet.</p>
        )}
      </div>
    </div>
  );
}