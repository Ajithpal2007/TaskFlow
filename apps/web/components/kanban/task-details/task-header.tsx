"use client";

import {
  CheckSquare,
  Zap,
  Bookmark,
  AlertCircle,
  Layers,
  ChevronDown,
  Paperclip,
  Share2,
  MoreHorizontal
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Button } from "@repo/ui/components/button";


interface TaskHeaderProps {
  task: any;
  updateTask: (updates: any) => void;
}

export function TaskHeader({ task, updateTask }: TaskHeaderProps) {
  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "EPIC": return <Zap className="h-4 w-4 text-purple-500 fill-purple-500/20" />;
      case "STORY": return <Bookmark className="h-4 w-4 text-green-500 fill-green-500/20" />;
      case "BUG": return <AlertCircle className="h-4 w-4 text-red-500 fill-red-500/20" />;
      case "SUBTASK": return <Layers className="h-4 w-4 text-cyan-500" />;
      default: return <CheckSquare className="h-4 w-4 text-blue-500 fill-blue-500/20" />; // TASK
    }
  };

  if (!task) return null;

  return (
    <div className="px-6 md:px-8 py-4 border-b flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">

      {/* --- LEFT SIDE: Breadcrumbs & Type Dropdown --- */}
      <div className="flex items-center gap-1.5">

        {/* BREADCRUMB */}
        {task.parentTask && task.type !== "EPIC" && (
          <>
            <span className="text-xs text-muted-foreground hover:underline cursor-pointer hover:text-foreground transition-colors">
              {task.parentTask.project?.identifier}-{task.parentTask.sequenceId}
            </span>
            <span className="text-muted-foreground/40 mx-1">/</span>
          </>
        )}

        {/* TYPE DROPDOWN */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 h-7 px-1.5 -ml-1.5 rounded hover:bg-muted focus:outline-none transition-colors group">
            {getTaskTypeIcon(task.type)}
            <span className="text-xs font-semibold text-muted-foreground tracking-wide group-hover:text-foreground transition-colors">
              {task.project?.identifier}-{task.sequenceId}
            </span>
            {/* 🟢 THE UI CUE: A subtle chevron tells the user "this is a dropdown" */}
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-[130px] z-[105]">
            <DropdownMenuItem onClick={() => updateTask({ type: "TASK" })} className="cursor-pointer">
              <div className="flex items-center gap-2">{getTaskTypeIcon("TASK")} Task</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateTask({ type: "STORY" })} className="cursor-pointer">
              <div className="flex items-center gap-2">{getTaskTypeIcon("STORY")} Story</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateTask({ type: "BUG" })} className="cursor-pointer">
              <div className="flex items-center gap-2">{getTaskTypeIcon("BUG")} Bug</div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateTask({ type: "EPIC" })} className="cursor-pointer">
              <div className="flex items-center gap-2">{getTaskTypeIcon("EPIC")} Epic</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- RIGHT SIDE: Action Buttons --- */}
      <div className="flex items-center gap-1">

        {/* 🟢 THE ATTACH BUTTON */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => document.getElementById("attachments-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          <Paperclip className="h-4 w-4 mr-1.5" />
          Attach
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Share2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>

      </div>
    </div>
  );
}