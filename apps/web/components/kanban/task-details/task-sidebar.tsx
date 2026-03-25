"use client";

import { useUsers } from "@/hooks/api/use-users";

import { useEpics } from "@/hooks/api/use-epics";

import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import {
   User, Calendar,  ArrowRight,
   ChevronDown, Trash2, Check,   X,
  Plus,
   Zap,
} from "lucide-react";
import { format } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import { useState } from "react"; 
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

import { Calendar as CalendarComponent } from "@repo/ui/components/calendar";

import { Badge } from "@repo/ui/components/badge";
import { useTags } from "@/hooks/api/use-tags";
import { TaskWatchers } from "./task-watchers";
import { TaskTimeTracking } from "./task-time-tracking";

interface TaskSidebarProps {
  task: any;
  updateTask: (updates: any) => void;
  // Add these two new props!
  deleteTask: () => void;
  isDeleting: boolean;
}
export function TaskSidebar({ task, updateTask,deleteTask, isDeleting }: TaskSidebarProps) {

  const { tags,createTag } = useTags();

  const [tagSearchValue, setTagSearchValue] = useState("");

  const [isEpicPopoverOpen, setIsEpicPopoverOpen] = useState(false);
  const { data: epics = [], isLoading: isLoadingEpics } = useEpics(task?.projectId, task?.id);

         if (!task) return null;
  
  
      return (
        <div className="flex flex-col gap-6">
  
            {/* MAIN CONTENT (LEFT COLUMN) */}
            
            {/* SIDEBAR (RIGHT COLUMN) */}
            <div className="bg-muted/10 border-l p-6 md:p-8 flex flex-col gap-6">
              {/* STATUS SELECTOR */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 bg-background shadow-sm font-medium capitalize">
                      <div className={`h-2 w-2 rounded-full mr-3 ${task.status === 'DONE' ? 'bg-green-500' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                          task.status === 'TODO' ? 'bg-yellow-500' :
                            'bg-gray-500'
                        }`} />
                      <span className="flex-1 text-left">{task.status.replace("_", " ").toLowerCase()}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[250px]" align="start" side="bottom">
                    {/* ALL statuses are correctly mapped here now */}
                    {["BACKLOG", "TODO", "IN_PROGRESS", "DONE"].map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onClick={() => updateTask({ status: s })}
                        className="capitalize cursor-pointer"
                      >
                        <div className={`h-2 w-2 rounded-full mr-3 ${s === 'DONE' ? 'bg-green-500' :
                          s === 'IN_PROGRESS' ? 'bg-blue-500' :
                            s === 'TODO' ? 'bg-yellow-500' :
                              'bg-gray-500'
                          }`} />
                        {s.replace("_", " ").toLowerCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>


              {/* ASSIGNEE SELECTOR */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</span>
                {/* FIX 1: Add modal={true} so the Dialog doesn't steal focus */}
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 bg-background shadow-sm font-medium">
                      {task.assignee ? (
                        <>
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={task.assignee.image} />
                            <AvatarFallback className="text-[10px]">{task.assignee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-left truncate">{task.assignee.name}</span>
                        </>
                      ) : (
                        <>
                          <User className="h-4 w-4 mr-3 text-muted-foreground" />
                          <span className="flex-1 text-left text-muted-foreground">Unassigned</span>
                        </>
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  {/* FIX 2: Add z-[100] to ensure it renders above the Dialog overlay */}
                  <PopoverContent className="w-[280px] p-0 z-[100]" align="start">
                    <AssigneeList
                      selectedUserId={task.assignee?.id}
                      onSelect={(userId) => {
                        updateTask({ assigneeId: userId });
                        // Note: We don't need to manually close the Popover here, 
                        // Shadcn CommandItems handle their own blur/close events usually.
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* TAGS SECTION */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</span>

                <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                  {task.tags?.map((tag: any) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}
                    >
                      {tag.name}
                    </Badge>
                  ))}

                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-dashed text-muted-foreground hover:text-foreground">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[240px] z-[100]" align="start">
                      <Command>
                        {/* 1. Track what the user types */}
                        <CommandInput
                          placeholder="Search or create tags..."
                          className="h-9"
                          value={tagSearchValue}
                          onValueChange={setTagSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>

                            {/* 2. Map existing tags (Keep your existing map logic here) */}
                            {tags.map((tag: any) => {
                              const isSelected = task.tags?.some((t: any) => t.id === tag.id);
                              return (
                                <CommandItem
                                  key={tag.id}
                                  onSelect={() => {
                                    const currentTagIds = task.tags?.map((t: any) => t.id) || [];
                                    const newTagIds = isSelected
                                      ? currentTagIds.filter((id: string) => id !== tag.id)
                                      : [...currentTagIds, tag.id];
                                    updateTask({ tags: newTagIds });
                                  }}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                                  <span className="flex-1 truncate">{tag.name}</span>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </CommandItem>
                              );
                            })}

                            {/* 3. THE MAGIC TRICK: "Create New Tag" Button */}
                            {tagSearchValue.trim() !== "" && !tags.some((t: any) => t.name.toLowerCase() === tagSearchValue.trim().toLowerCase()) && (
                              <CommandItem
                                // IMPORTANT: We set the value to the search term so Shadcn doesn't filter this item out!
                                value={tagSearchValue}
                                onSelect={() => {
                                  // Default to a nice blue color for now
                                  createTag({ name: tagSearchValue.trim(), color: "#3b82f6" }, {
                                    onSuccess: (newTag) => {
                                      // Magic UX: Instantly assign the newly created tag to the current task!
                                      const currentTagIds = task.tags?.map((t: any) => t.id) || [];
                                      updateTask({ tags: [...currentTagIds, newTag.id] });
                                      setTagSearchValue(""); // Clear the input
                                    }
                                  });
                                }}
                                className="cursor-pointer flex items-center gap-2 text-primary font-medium border-t rounded-none mt-1 pt-2"
                              >
                                <Plus className="h-4 w-4" />
                                Create "{tagSearchValue.trim()}"
                              </CommandItem>
                            )}

                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {/* PRIORITY SELECTOR */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start h-9 bg-background shadow-sm font-medium capitalize">
                      <ArrowRight className="h-4 w-4 mr-3 text-yellow-500" />
                      <span className="flex-1 text-left">{task.priority.toLowerCase()}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[250px]" align="start" side="bottom">
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                      <DropdownMenuItem
                        key={p}
                        onClick={() => updateTask({ priority: p })}
                        className="capitalize cursor-pointer"
                      >
                        {p.toLowerCase()}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* WATCHERS SECTION */}

              <TaskWatchers task={task} />

              {/* STORY POINTS SECTION */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estimate</span>
                <Select
                  // We convert to string for the Select component, handle nulls
                  value={task.storyPoints ? task.storyPoints.toString() : "none"}
                  onValueChange={(val) => updateTask({ storyPoints: val === "none" ? null : parseInt(val) })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Add points..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No estimate</SelectItem>
                    {[1, 2, 3, 5, 8, 13, 21].map((points) => (
                      <SelectItem key={points} value={points.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-4 w-4 rounded-full bg-muted text-[10px] font-bold">
                            {points}
                          </div>
                          {points} Points
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TaskTimeTracking task={task} />

              {/* EPIC LINKING SECTION */}
              {task.type !== "EPIC" && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Epic Link</span>

                  <Popover open={isEpicPopoverOpen} onOpenChange={setIsEpicPopoverOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-xs h-8 ${task.parentTask ? "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20" : ""}`}
                      >
                        {task.parentTask ? (
                          <>
                            <Zap className="h-3.5 w-3.5 mr-2 fill-purple-600/20" />
                            <span className="truncate">{task.parentTask.project?.identifier}-{task.parentTask.sequenceId} {task.parentTask.title}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground font-normal">Add to Epic...</span>
                        )}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="w-[260px] p-0 z-[105]" align="start">
                      <Command>
                        <CommandInput placeholder="Search epics..." className="h-9 text-xs" />
                        <CommandList>
                          <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">No epics found.</CommandEmpty>
                          <CommandGroup heading="Available Epics">

                            {/* Option to clear the Epic */}
                            {task.parentTaskId && (
                              <CommandItem
                                onSelect={() => {
                                  updateTask({ parentTaskId: null });
                                  setIsEpicPopoverOpen(false);
                                }}
                                className="cursor-pointer text-red-500 text-xs py-2"
                              >
                                Unlink Epic
                              </CommandItem>
                            )}

                            {isLoadingEpics ? (
                              <div className="p-2 text-xs text-muted-foreground text-center">Loading...</div>
                            ) : (
                              epics.map((epic: any) => (
                                <CommandItem
                                  key={epic.id}
                                  onSelect={() => {
                                    updateTask({ parentTaskId: epic.id });
                                    setIsEpicPopoverOpen(false);
                                  }}
                                  className="cursor-pointer flex flex-col items-start gap-1 py-2"
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Zap className="h-3 w-3 text-purple-500 shrink-0" />
                                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                      {epic.project.identifier}-{epic.sequenceId}
                                    </span>
                                    <span className="text-xs truncate flex-1">{epic.title}</span>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* DUE DATE */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</span>
                <div className="flex gap-2">
                  {/* FIX: Wrap in Popover with modal={true} and high z-index */}
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`flex-1 justify-start h-9 bg-background shadow-sm font-medium ${!task.dueDate ? "text-muted-foreground" : ""}`}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        {task.dueDate ? format(new Date(task.dueDate), "PPP") : "Set due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <CalendarComponent
                      mode="single"
                      selected={task.dueDate ? new Date(task.dueDate) : undefined}
                      onSelect={(date: Date | undefined) => {
                        // Send the ISO string to the backend when a date is clicked
                        if (date) updateTask({ dueDate: date.toISOString() });
                      }}
                      initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* CLEAR DATE BUTTON */}
                  {task.dueDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => updateTask({ dueDate: null })}
                      title="Clear date"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Separator className="my-2" />

              {/* CREATED AT */}
      <div className="text-xs text-muted-foreground space-y-3 font-medium">
        <div className="flex justify-between items-center">
          <span>Created</span>
          <span className="text-foreground">
            {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy") : "Just now"}
          </span>
        </div>
      </div>

              {/* DANGER ZONE */}
             <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (confirm("Are you sure you want to delete this task? This cannot be undone.")) {
              deleteTask(); // Using the prop!
            }
          }}
          disabled={isDeleting} // Using the prop!
        >
          <Trash2 className="h-4 w-4 mr-3" />
          {isDeleting ? "Deleting..." : "Delete Task"}
        </Button>
      </div>

            </div>
            <div className="flex flex-col gap-6">


            </div>
      
    </div>
  );
}
  
  
  

  


function AssigneeList({ selectedUserId, onSelect }: { selectedUserId?: string, onSelect: (id: string | null) => void }) {
  const { data: users, isLoading } = useUsers();

  return (
    <Command>
      <CommandInput placeholder="Search teammates..." />
      <CommandList>
        <CommandEmpty>No teammates found.</CommandEmpty>
        <CommandGroup>
          {/* Option to Unassign */}
          <CommandItem
          value="unassigned"
            onSelect={() => onSelect(null)}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4 opacity-50" />
            <span>Unassigned</span>
            {!selectedUserId && <Check className="ml-auto h-4 w-4 text-primary" />}
          </CommandItem>

          {users?.map((user: any) => (
            <CommandItem
              key={user.id}
              value={user.name} // 🟢 The fix! Explicitly tell the search engine to use the name
              onSelect={() => onSelect(user.id)}
              className="cursor-pointer"
            >
              <Avatar className="mr-2 h-5 w-5">
                <AvatarImage src={user.image} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{user.name}</span>
              {selectedUserId === user.id && <Check className="ml-auto h-4 w-4 text-primary" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}