"use client";

import {
  CheckSquare,Zap, Bookmark, AlertCircle, Layers
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

interface TaskHeaderProps {
  task: any; // Ideally replace 'any' with your actual Prisma Task type later!
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
    <>
      {/* HEADER */}
      <div className="px-8 py-5 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 mb-3">

              {/* JIRA BREADCRUMB: Only show if this task has a parent AND isn't an Epic itself */}
              {task.parentTask && task.type !== "EPIC" && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 ml-1">
                  <span className="hover:underline cursor-pointer flex items-center gap-1">
                    {/* Assuming you have a standard task icon, or just text */}
                    {task.parentTask.project?.identifier}-{task.parentTask.sequenceId}
                  </span>
                  <span className="text-muted-foreground/50">/</span>
                </div>
              )}


              <DropdownMenu>

                <DropdownMenuTrigger className="flex items-center gap-2 h-7 px-1 rounded hover:bg-muted focus:outline-none transition-colors">
                  {getTaskTypeIcon(task.type)}
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                    {task.project?.identifier}-{task.sequenceId}
                  </span>

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
          </div>

        </div>
      </div>
    </>
  );
}

    
  


 

