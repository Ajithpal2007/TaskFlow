"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useTasks } from "@/hooks/api/use-tasks";
import { KanbanColumn } from "./kanban-column";
import { TaskStatus } from "@repo/database";
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners 
} from "@dnd-kit/core";

// 🟢 New UI Imports for the Filter Bar
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Search, X, SlidersHorizontal,AlertTriangle } from "lucide-react";

const COLUMNS: { label: string; status: TaskStatus; wipLimit?: number }[] = [
  { label: "Backlog", status: "BACKLOG" },
  { label: "Todo", status: "TODO", wipLimit: 5 }, 
  { label: "In Progress", status: "IN_PROGRESS", wipLimit: 3 }, // Agile standard: strict limit here
  { label: "Done", status: "DONE" },
];
export function KanbanBoard({ projectId, workspaceId }: { projectId: string; workspaceId: string }) {
  const { tasks, isLoading, updateTask, error } = useTasks(projectId);

  // 🟢 1. The Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: any) => { 
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks?.find((t: any) => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTask({ taskId, updates: { status: newStatus } }); 
    }
  };

  // 🟢 2. Extract unique assignees dynamically from the existing tasks
  const uniqueAssignees = useMemo(() => {
    if (!tasks) return [];
    const map = new Map();
    tasks.forEach((t: any) => {
      if (t.assignee && !map.has(t.assignee.id)) {
        map.set(t.assignee.id, t.assignee);
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  // 🟢 3. The High-Speed Client-Side Filter Engine
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task: any) => {
      // Check Search (Matches Title or Sequence ID like "TASK-12")
      const matchesSearch = searchQuery === "" || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.sequenceId?.toString().includes(searchQuery);

      // Check Assignee
      const matchesAssignee = assigneeFilter === null || task.assignee?.id === assigneeFilter;

      return matchesSearch && matchesAssignee;
    });
  }, [tasks, searchQuery, assigneeFilter]);

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading board...</div>;
  if (error) return <div className="p-10 text-red-500">❌ Error loading tasks.</div>;

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* --- 🟢 THE FILTER BAR --- */}
      <div className="flex flex-wrap items-center gap-4 pb-4 mb-2 border-b border-border/40 shrink-0">
        
        {/* Search Input */}
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background shadow-sm focus-visible:ring-1"
          />
        </div>

        {/* Assignee Avatars */}
        {uniqueAssignees.length > 0 && (
          <div className="flex items-center gap-1.5 border-l pl-4 border-border/50">
            <span className="text-xs font-medium text-muted-foreground mr-1">Assignees:</span>
            {uniqueAssignees.map((user: any) => {
              const isActive = assigneeFilter === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => setAssigneeFilter(isActive ? null : user.id)}
                  title={`Filter by ${user.name}`}
                  className={`relative h-7 w-7 rounded-full border-2 overflow-hidden transition-all ${
                    isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100"
                  }`}
                >
                  {user.image ? (
                    <Image src={user.image} alt={user.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-secondary text-foreground flex items-center justify-center text-[10px] font-bold uppercase">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear Filters Button */}
        {(searchQuery || assigneeFilter) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSearchQuery(""); setAssigneeFilter(null); }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* --- THE CANVAS (Board) --- */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status} 
              label={col.label}
              projectId={projectId}
              workspaceId={workspaceId}
              wipLimit={col.wipLimit}
              tasks={filteredTasks.filter((t: any) => t.status === col.status)}
            />
          ))}
        </div>
      </DndContext>

    </div>
  );
}