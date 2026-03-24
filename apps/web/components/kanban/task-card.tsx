"use client";
import { Task } from "@repo/database";
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
  NONE: { icon: Minus, color: "text-muted-foreground", label: "None" },
  LOW: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
  MEDIUM: { icon: ArrowRight, color: "text-yellow-500", label: "Medium" },
  HIGH: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  URGENT: { icon: AlertCircle, color: "text-red-500", label: "Urgent" },
} as const;

const typeConfig = {
  BUG: { icon: Bug, color: "text-red-500" },
  FEATURE: { icon: Sparkles, color: "text-blue-500" },
  TASK: { icon: CheckCircle2, color: "text-green-500" },
  EPIC: { icon: Hexagon, color: "text-purple-500" },
  STORY: { icon: Bookmark, color: "text-yellow-500" },
  SUBTASK: { icon: Layers, color: "text-blue-400" },
} as const;

type TaskWithPending = Task & { 
  isPending?: boolean; 
  subtasks?: any[]; 
  comments?: any[]; 
  project?: any; 
  tags?: any[]; 
  
  // 🟢 Add the relational assignee object so TypeScript knows about it!
  assignee?: {
    id: string;
    name: string;
    image?: string | null;
  } | null;
};

type TaskPriority = keyof typeof priorityConfig;
type IssueType = keyof typeof typeConfig;



export function TaskCard({ task }: { task: TaskWithPending }) {
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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      // 🟢 Width constrained to standard Kanban size (280-300px)
      // 🟢 The "Pulse" UI is injected right here for optimistic updates!
      className={`touch-none pb-2.5 group w-full max-w-[300px] mx-auto ${
        task.isPending ? "opacity-60 animate-pulse pointer-events-none" : ""
      }`}
    >
      <Card
        onClick={() => !task.isPending && openTaskDetails(task.id)}
        // 🟢 Elite Styling: Subtler borders, elegant shadow on hover, tight radius
        className="cursor-grab active:cursor-grabbing border-border/40 hover:border-primary/30 bg-card hover:shadow-md transition-all duration-200 rounded-lg overflow-hidden"
      >
        <CardContent className="p-3.5">

          {/* --- TOP ROW: Issue Type, ID, & Priority --- */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CurrentTypeIcon className={`h-[14px] w-[14px] ${currentTypeColor}`} />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-primary/80 transition-colors">
                {task.isPending ? "SAVING..." : `${task.project?.identifier}-${task.sequenceId}`}
              </span>
            </div>

            <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none hover:bg-muted/60 p-1 rounded-md transition-colors opacity-70 hover:opacity-100">
                  <CurrentPriorityIcon className={`h-3.5 w-3.5 ${currentPriorityColor}`} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 z-[100] rounded-xl shadow-lg border-border/50">
                  {Object.entries(priorityConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <DropdownMenuItem
                        key={key}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePriorityChange(key as TaskPriority);
                        }}
                        className="flex items-center gap-2 text-xs cursor-pointer py-1.5"
                      >
                        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        <span className="font-medium">{config.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* --- MIDDLE ROW: Title & Tags --- */}
          {/* 🟢 Elite Typography: 13px font size with high-contrast text */}
          <p className="text-[13px] font-medium leading-[1.4] text-foreground/90 mb-2.5 line-clamp-2">
            {task.title}
          </p>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary" className="text-[9px] px-1.5 py-0 rounded-sm h-4 font-medium bg-secondary/50 hover:bg-secondary/80 text-secondary-foreground/70 border-none transition-colors">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* --- BOTTOM ROW: Metadata, Dates, Estimates, Assignee --- */}
          <div className="mt-3 flex items-center justify-between pt-1 border-t border-border/30">

            {/* Left Side: Subtasks, Comments, Due Date */}
            <div className="flex items-center gap-3 text-muted-foreground/70">
              {totalSubtasks > 0 && (
                <div className={`flex items-center gap-1 text-[11px] font-medium ${completedSubtasks === totalSubtasks ? 'text-green-600' : ''}`}>
                  <CheckSquare className="h-3 w-3" />
                  <span>{completedSubtasks}/{totalSubtasks}</span>
                </div>
              )}

              {commentCount > 0 && (
                <div className="flex items-center gap-1 text-[11px] font-medium">
                  <MessageSquare className="h-3 w-3" />
                  <span>{commentCount}</span>
                </div>
              )}

              {task.dueDate && (
                <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-red-500/90' : ''}`} title="Due Date">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.dueDate), "MMM d")}</span>
                </div>
              )}
            </div>

            {/* Right Side: Story Points & Assignee */}
            <div className="flex items-center gap-2 shrink-0">
              {task.storyPoints && (
                <div className="flex h-5 min-w-[20px] items-center justify-center rounded-sm bg-secondary/60 px-1 text-[10px] font-bold text-muted-foreground ring-1 ring-inset ring-border/50">
                  {task.storyPoints}
                </div>
              )}

              {task.assignee && (
                <div className="relative h-6 w-6 rounded-full border-2 border-background bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden shadow-sm">
                  {task.assignee.image ? (
                    <Image src={task.assignee.image} alt={task.assignee.name} className="h-full w-full object-cover" fill sizes="24px" />
                  ) : (
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">
                      {task.assignee.name.charAt(0)}
                    </span>
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