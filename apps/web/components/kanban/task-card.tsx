"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { Card, CardContent } from "@repo/ui/components/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@repo/ui/components/dropdown-menu";

import { useTasks } from "@/hooks/api/use-tasks";
import { ArrowDown, ArrowRight, ArrowUp, AlertCircle, Minus } from "lucide-react";

import { useUIStore } from "@/app/lib/stores/use-ui-store";

const priorityConfig = {
  NONE: { icon: Minus, color: "text-gray-500", label: "None" },
  LOW: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
  MEDIUM: { icon: ArrowRight, color: "text-yellow-500", label: "Medium" },
  HIGH: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  URGENT: { icon: AlertCircle, color: "text-red-500", label: "Urgent" },
} as const;

type TaskPriority = keyof typeof priorityConfig;

export function TaskCard({ task }: { task: any }) {
  const { updateTask } = useTasks(task.projectId);
  const openTaskDetails = useUIStore((state) => state.openTaskDetails);

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (newPriority === task.priority) return; 
    updateTask({ 
      taskId: task.id, 
      updates: { priority: newPriority } 
    });
  };

  const CurrentPriorityIcon = priorityConfig[task.priority as keyof typeof priorityConfig]?.icon || Minus;
  const currentPriorityColor = priorityConfig[task.priority as keyof typeof priorityConfig]?.color || "text-gray-500";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none pb-3" 
    >
      <Card 
        onClick={() => openTaskDetails(task.id)}
        className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all shadow-sm"
      >
        <CardContent className="p-3">
          
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              {task.project?.identifier}-{task.sequenceId}
            </span>
            
            <div 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none hover:bg-muted p-1 rounded transition-colors">
                  <CurrentPriorityIcon className={`h-4 w-4 ${currentPriorityColor}`} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {Object.entries(priorityConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <DropdownMenuItem 
                        key={key} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePriorityChange(key as TaskPriority);
                        }}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  })
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {task.title}
          </p>
          
          {task.assignee && (
            <div className="mt-3 flex justify-end">
              <div className="relative h-6 w-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                {task.assignee.image ? (
                  <Image 
                    src={task.assignee.image} 
                    alt={task.assignee.name} 
                    className="h-full w-full object-cover"
                    fill
                  />
                ) : (
                  <span className="text-[10px] uppercase font-bold">
                    {task.assignee.name.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}