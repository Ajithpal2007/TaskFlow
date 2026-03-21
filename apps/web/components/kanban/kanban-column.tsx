import { TaskCard } from "./task-card";
import { TaskStatus } from "@repo/database";
import { useDroppable } from "@dnd-kit/core";

interface ColumnProps {
  label: string;
  status: TaskStatus;
  tasks: any[];
 // For DnD, this will match TaskStatus
}

export function KanbanColumn({  label, status, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
 return (
    <div 
      ref={setNodeRef}
      className={`flex w-80 flex-col rounded-lg p-4 transition-colors ${
        isOver ? "bg-primary/10 ring-2 ring-primary/20" : "bg-secondary/50"
      }`}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase opacity-70">{label}</h3>
      <div className="flex flex-1 flex-col gap-3">
        {tasks.map((task: any) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}