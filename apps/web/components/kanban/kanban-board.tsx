"use client";

import { useTasks } from "@/hooks/api/use-tasks";
import { KanbanColumn } from "./kanban-column";
import { TaskStatus } from "@repo/database"; // Get your enums from the shared package
import { useState } from "react";
import { 
  DndContext, 
  DragOverEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners 
} from "@dnd-kit/core";




const COLUMNS: { label: string; status: TaskStatus }[] = [
  { label: "Backlog", status: "BACKLOG" },
  { label: "Todo", status: "TODO" },
  { label: "In Progress", status: "IN_PROGRESS" },
  { label: "Done", status: "DONE" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { tasks, isLoading , updateTask, error } = useTasks(projectId);

  

  // 1. Setup Sensors (Prevents accidental drags when clicking buttons)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 2. Handle the Drop Logic
 // 1. REMOVED 'async'
  const handleDragEnd = (event: any) => { 
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus; // The Column ID is the status

    // Find the current task to see if status actually changed
    const task = tasks.find((t: any) => t.id === taskId);
    
    if (task && task.status !== newStatus) {
      // 2. REMOVED 'await'
      // This now fires in the background, allowing the function to finish instantly!
      updateTask({ taskId, updates: { status: newStatus } }); 
    }
  };

  if (isLoading) return <div>Loading board...</div>;
  if (error) return <div className="p-10 text-red-500">❌ Error: {(error as any).message}</div>;

 return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full gap-4 overflow-x-auto p-4">
        {COLUMNS.map((col) => (
         <KanbanColumn
    key={col.status}
    status={col.status} 
    label={col.label}
     projectId={projectId}
    tasks={tasks.filter((t: any) => t.status === col.status)}
   
  />
        ))}
      </div>

      
    </DndContext>
  );
}