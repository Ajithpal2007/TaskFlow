"use client";

import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Plus, X, ListTodo, Sparkles } from "lucide-react"; // 🟢 Added Sparkles
import { Progress } from "@repo/ui/components/progress";
import { toast } from "sonner"; // 🟢 Added toast for AI feedback
import { useParams } from "next/navigation";

interface TaskSubtasksProps {
  task: any;
  createSubtask: (title: string) => void;
  updateSubtask: (data: { id: string; status?: string; title?: string }) => void;
  deleteSubtask: (id: string) => void;
  isCreatingSubtask: boolean;
  refreshTask?: () => void; // 🟢 Optional: Pass a function to refresh the task data after AI generation
}

export function TaskSubtasks({ task, createSubtask, updateSubtask, deleteSubtask, isCreatingSubtask, refreshTask }: TaskSubtasksProps) {
  // --- STATE ---
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");




  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const subtasks = task?.subtasks || [];
  const completedCount = subtasks.filter((st: any) => st.status === "DONE").length;
  const progressValue = subtasks.length === 0 ? 0 : (completedCount / subtasks.length) * 100;

  const params = useParams();
  const workspaceId = params.workspaceId as string;

  // 🟢 AI Loading State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [streamedSubtasks, setStreamedSubtasks] = useState<any[]>([]);
  const displaySubtasks = [
    ...subtasks,
    ...streamedSubtasks.filter(
      (streamed) => !subtasks.some((serverTask: any) => serverTask.id === streamed.id)
    )
  ];

  // --- FOCUS MANAGEMENT ---
  useEffect(() => {
    if (isAdding && addInputRef.current) addInputRef.current.focus();
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [isAdding, editingId]);

  // --- CREATION LOGIC ---
  const handleCreate = () => {
    if (newTitle.trim()) {
      createSubtask(newTitle.trim());
      setNewTitle("");
    } else {
      setIsAdding(false);
    }
  };

  // --- AI GENERATION LOGIC 🟢 ---
  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setStreamedSubtasks([]);


    try {
      // 🟢 2. Inject it safely into the URL
      const res = await fetch(`http://localhost:4000/api/ai/${workspaceId}/generate-subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          description: task.description,
          projectId: task.projectId
        })
      });

      if (!res.ok) throw new Error("Failed to generate subtasks");

      const data = await res.json();
      // 🟢 THE CASCADE EFFECT
      // Instead of showing them all instantly, we reveal them one-by-one!
      data.subtasks.forEach((newSubtask: any, index: number) => {
        setTimeout(() => {
          setStreamedSubtasks((prev) => [...prev, newSubtask]);
        }, index * 400); // 400ms delay between each subtask appearing
      });

      // Wait for the animation to finish, then officially refresh the parent data
      setTimeout(() => {
        if (refreshTask) refreshTask();
        
        toast.success(`✨ Generated ${data.count} subtasks!`);
      }, data.subtasks.length * 400);

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI subtasks.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // --- EDIT LOGIC ---
  const startEditing = (subtask: any) => {
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim() && editTitle !== subtasks.find((s: any) => s.id === id)?.title) {
      updateSubtask({ id, title: editTitle.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-4">

      {/* HEADER & PROGRESS BAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          Subtasks
        </div>

        {/* 🟢 Action Buttons */}
        <div className="flex items-center gap-2 text-xs font-medium">
          {subtasks.length > 0 && <span className="text-muted-foreground mr-2">{completedCount} / {subtasks.length}</span>}

          {/* ✨ New AI Button ✨ */}
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800 transition-all"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {isGeneratingAI ? "Thinking..." : "Auto-Generate"}
          </Button>

          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setIsAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {subtasks.length > 0 && (
        <Progress value={progressValue} className="h-2 w-full bg-muted/50" />
      )}

      {/* THE SUBTASK LIST */}
      <div className="space-y-1 pt-2">
        {subtasks.length === 0 && !isAdding && (
          <div
            onClick={() => setIsAdding(true)}
            className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors"
          >
            <Plus className="h-6 w-6 mb-2 text-muted-foreground/50" />
            <p className="text-sm font-medium">Add a subtask</p>
          </div>
        )}

        {displaySubtasks.map((subtask: any) => (
          <div
            key={subtask.id}
            // 🟢 Add a simple Tailwind fade-in animation here if you want it to look extra smooth!
            className="animate-in fade-in slide-in-from-top-2 duration-500 group flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted/50 transition-all"
          >
            {/* The Checkbox */}
            <Checkbox
              checked={subtask.status === "DONE"}
              onCheckedChange={(checked) => updateSubtask({ id: subtask.id, status: checked ? "DONE" : "TODO" })}
              className="h-4 w-4 rounded-[4px] data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />

            {/* The Title (Either Text or Input) */}
            <div className="flex-1 min-w-0">
              {editingId === subtask.id ? (
                <Input
                  ref={editInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveEdit(subtask.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(subtask.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-7 px-2 text-sm"
                />
              ) : (
                <span
                  onClick={() => startEditing(subtask)}
                  className={`text-sm cursor-text truncate block select-none ${subtask.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {subtask.title}
                </span>
              )}
            </div>

            {/* The Hover-to-Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteSubtask(subtask.id)}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {/* INLINE CREATION ROW */}
        {isAdding && (
          <div className="flex items-center gap-3 p-2 -mx-2 rounded-md bg-muted/30">
            <Checkbox disabled className="h-4 w-4 rounded-[4px] opacity-50" />
            <Input
              ref={addInputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              onBlur={handleCreate}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTitle("");
                }
              }}
              className="h-7 px-2 text-sm flex-1"
              disabled={isCreatingSubtask}
            />
          </div>
        )}
      </div>
    </div>
  );
}