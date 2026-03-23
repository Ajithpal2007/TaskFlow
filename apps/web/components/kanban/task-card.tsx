"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast } from "date-fns";

import { Card, CardContent } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@repo/ui/components/dropdown-menu";

import { useTasks } from "@/hooks/api/use-tasks";
import {
  ArrowDown, ArrowRight, ArrowUp, AlertCircle, Minus,
  CheckSquare, MessageSquare, Calendar, Bug, Sparkles, CheckCircle2, Bookmark, Hexagon, Layers
} from "lucide-react";

import { useUIStore } from "@/app/lib/stores/use-ui-store";

const priorityConfig = {
  NONE: { icon: Minus, color: "text-gray-500", label: "None" },
  LOW: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
  MEDIUM: { icon: ArrowRight, color: "text-yellow-500", label: "Medium" },
  HIGH: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  URGENT: { icon: AlertCircle, color: "text-red-500", label: "Urgent" },
} as const;

// 🟢 The complete Type Config
const typeConfig = {
  BUG: { icon: Bug, color: "text-red-500" },
  FEATURE: { icon: Sparkles, color: "text-blue-500" },
  TASK: { icon: CheckCircle2, color: "text-green-500" },
  EPIC: { icon: Hexagon, color: "text-purple-500" },
  STORY: { icon: Bookmark, color: "text-yellow-500" },
  SUBTASK: { icon: Layers, color: "text-blue-400" },
} as const;

type TaskPriority = keyof typeof priorityConfig;
type IssueType = keyof typeof typeConfig;

export function TaskCard({ task }: { task: any }) {
  const { updateTask } = useTasks(task.projectId);
  const openTaskDetails = useUIStore((state) => state.openTaskDetails);

  // Metadata calculations
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((st: any) => st.status === "DONE").length || 0;
  const commentCount = task.comments?.length || 0;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate));

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (newPriority === task.priority) return;
    updateTask({ taskId: task.id, updates: { priority: newPriority } });
  };

 const safePriority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.NONE;
  const safeType = typeConfig[task.type as keyof typeof typeConfig] || typeConfig.TASK;

  const CurrentPriorityIcon = safePriority.icon;
  const currentPriorityColor = safePriority.color;
  
  const CurrentTypeIcon = safeType.icon;
  const currentTypeColor = safeType.color;

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
      className="touch-none pb-3 group"
    >
      <Card
        onClick={() => openTaskDetails(task.id)}
        className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all shadow-sm"
      >
        <CardContent className="p-3">

          {/* --- TOP ROW: Issue Type, ID, & Priority --- */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <CurrentTypeIcon className={`h-3.5 w-3.5 ${currentTypeColor}`} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                {task.project?.identifier}-{task.sequenceId}
              </span>
            </div>

            <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none hover:bg-muted p-1 rounded transition-colors">
                  <CurrentPriorityIcon className={`h-4 w-4 ${currentPriorityColor}`} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-[100]">
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
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* --- MIDDLE ROW: Title & Tags --- */}
          <p className="text-sm font-medium leading-snug line-clamp-2 mb-2">
            {task.title}
          </p>

          {/* 🟢 Render Tags if they exist */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* --- BOTTOM ROW: Metadata, Dates, Estimates, Assignee --- */}
          <div className="mt-3 flex items-center justify-between">

            {/* Left Side: Subtasks, Comments, Due Date */}
            <div className="flex items-center gap-2.5 text-muted-foreground">
              {totalSubtasks > 0 && (
                <div className={`flex items-center gap-1 text-[11px] ${completedSubtasks === totalSubtasks ? 'text-green-600' : ''}`}>
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span className="font-medium">{completedSubtasks}/{totalSubtasks}</span>
                </div>
              )}

              {commentCount > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="font-medium">{commentCount}</span>
                </div>
              )}

              {/* 🟢 Render Due Date */}
              {task.dueDate && (
                <div className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-500 font-semibold' : ''}`} title="Due Date">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(task.dueDate), "MMM d")}</span>
                </div>
              )}
            </div>

            {/* Right Side: Story Points & Assignee */}
            <div className="flex items-center gap-2 shrink-0">

              {/* 🟢 Render Story Points / Estimate */}
              {task.storyPoints && (
                <div className="flex h-5 items-center justify-center rounded bg-secondary px-1.5 text-[10px] font-semibold text-muted-foreground ring-1 ring-inset ring-border" title="Story Points">
                  {task.storyPoints}
                </div>
              )}

              {task.assignee && (
                <div className="relative h-6 w-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                  {task.assignee.image ? (
                    <Image src={task.assignee.image} alt={task.assignee.name} className="h-full w-full object-cover" fill />
                  ) : (
                    <span className="text-[10px] uppercase font-bold">{task.assignee.name.charAt(0)}</span>
                  )}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}