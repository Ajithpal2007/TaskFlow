"use client";

import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useTask } from "@/hooks/api/use-task";
import { useUsers } from "@/hooks/api/use-users";
import { useTaskSearch } from "@/hooks/api/use-task-search";
import { useEpics } from "@/hooks/api/use-epics";
import { useTaskActivity } from "@/hooks/api/use-activity";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import {
  AlignLeft, User, Calendar, Activity, ArrowRight,
  MessageSquare, Paperclip, CheckSquare, Loader2, ChevronDown, Trash2, Check, ChevronsUpDown, Search, X,
  Plus,
  Link2, Zap, Bookmark, AlertCircle, Layers, History
} from "lucide-react";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import { useState, useEffect } from "react"; // <-- Add this
import { Textarea } from "@repo/ui/components/textarea"; // <-- Add this
import { Progress } from "@repo/ui/components/progress";

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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"

import { Calendar as CalendarComponent } from "@repo/ui/components/calendar";
import { Input } from "@repo/ui/components/input";

import { Badge } from "@repo/ui/components/badge";
import { useTags } from "@/hooks/api/use-tags";

export function TaskDetailsDialog() {
  const { isTaskDetailsModalOpen, activeTaskId, closeTaskDetails } = useUIStore();

  const { task, isLoading, updateTask, addComment, isAddingComment, deleteTask,
    isDeleting, createSubtask, isCreatingSubtask, linkTask } = useTask(activeTaskId, closeTaskDetails);

  const { tags, isLoadingTags, createTag, isCreatingTag } = useTags();

  const [tagSearchValue, setTagSearchValue] = useState("");


  const [description, setDescription] = useState("");
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkType, setLinkType] = useState<"BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO">("BLOCKS");

  const { data: activityLogs = [], isLoading: isLoadingActivity } = useTaskActivity(task?.id);

  const [isEpicPopoverOpen, setIsEpicPopoverOpen] = useState(false);
  const { data: epics = [], isLoading: isLoadingEpics } = useEpics(task?.projectId, task?.id);

  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const { data: searchResults = [], isLoading: isSearching } = useTaskSearch(
    task?.projectId,
    task?.id,
    linkSearchQuery
  );

  // --- SUBTASK PROGRESS CALCULATION ---
  // Default to empty arrays/0 if data is still loading
  const totalSubtasks = task?.subtasks?.length || 0;

  // Assuming your subtasks have a 'status' field like main tasks. 
  // If you are using a boolean like 'isCompleted', change this to st.isCompleted === true
  const completedSubtasks = task?.subtasks?.filter((st: any) => st.status === "DONE").length || 0;

  // Prevent division by zero!
  const progressPercentage = totalSubtasks === 0
    ? 0
    : Math.round((completedSubtasks / totalSubtasks) * 100);

  const queryClient = useQueryClient();

  // Dedicated mutation to update subtasks without messing with the parent task
  const updateSubtaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiClient.patch(`/tasks/${id}`, { status });
    },
    onSuccess: () => {
      // Instantly refresh the parent task so the progress bar updates!
      queryClient.invalidateQueries({ queryKey: ["task", task?.id] });
    },
  });


  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "EPIC": return <Zap className="h-4 w-4 text-purple-500 fill-purple-500/20" />;
      case "STORY": return <Bookmark className="h-4 w-4 text-green-500 fill-green-500/20" />;
      case "BUG": return <AlertCircle className="h-4 w-4 text-red-500 fill-red-500/20" />;
      case "SUBTASK": return <Layers className="h-4 w-4 text-cyan-500" />;
      default: return <CheckSquare className="h-4 w-4 text-blue-500 fill-blue-500/20" />; // TASK
    }
  };




  useEffect(() => {
    if (task) {
      setDescription(task.description || "");
    }
  }, [task]);

  const [newComment, setNewComment] = useState("");

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment, {
      onSuccess: () => setNewComment("") // Clear the box after posting
    });
  };
  // Add this near your other state variables
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // The submit handler
  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) {
      setIsAddingSubtask(false); // Close if empty
      return;
    }

    createSubtask(newSubtaskTitle, {
      onSuccess: () => {
        setNewSubtaskTitle(""); // Clear the input
        // Optional: keep it open to type another task immediately, or close it:
        setIsAddingSubtask(false);
      }
    });
  };

  const handleDescriptionBlur = () => {
    // Only save if the text actually changed
    if (task && description !== task.description) {
      setIsSavingDesc(true);
      updateTask(
        { description },
        { onSuccess: () => setTimeout(() => setIsSavingDesc(false), 1500) } // Keep "Saved" visible for 1.5s
      );
    }
  };

  const renderDialogContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-background/50 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (task) {
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
              <DialogTitle className="text-2xl font-semibold leading-tight text-foreground">
                {task.title}
              </DialogTitle>
            </div>
          </div>

          {/* BODY - Using foolproof CSS Grid */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* MAIN CONTENT (LEFT COLUMN) */}
            <div className="p-6 md:p-8 space-y-10">

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="h-8 text-xs font-medium" onClick={() => setIsAddingSubtask(true)}>
                  <CheckSquare className="h-3.5 w-3.5 mr-2" /> Create Subtask
                </Button>

                {/* THE NEW LINK BUTTON */}
                <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-8 text-xs font-medium">
                      <Link2 className="h-3.5 w-3.5 mr-2" /> Link Issue
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[320px] p-0 z-[100]" align="start">
                    <div className="p-3 border-b bg-muted/30">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        This task...
                      </span>
                      <Select value={linkType} onValueChange={(val: any) => setLinkType(val)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper"
                          side="bottom"
                          align="start"
                          sideOffset={4}
                          className="w-[130px] z-[1000]">
                          <SelectItem value="BLOCKS">Blocks</SelectItem>
                          <SelectItem value="IS_BLOCKED_BY">Is blocked by</SelectItem>
                          <SelectItem value="RELATES_TO">Relates to</SelectItem>
                          <SelectItem value="DUPLICATES">Duplicates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Command>

                      <CommandGroup heading="Suggestions">

                        {/* SHOW LOADING STATE */}
                        {isSearching && <div className="p-4 text-center text-xs text-muted-foreground">Searching...</div>}

                        {/* USE REAL DATABASE RESULTS */}
                        {!isSearching && searchResults.map((targetTask: any) => (
                          <CommandItem
                            key={targetTask.id}
                            onSelect={() => {
                              linkTask({ targetTaskId: targetTask.id, type: linkType }, {
                                onSuccess: () => {
                                  setIsLinkPopoverOpen(false);
                                  setLinkSearchQuery("");
                                }
                              });
                            }}
                            className="cursor-pointer flex flex-col items-start gap-1 py-2"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {targetTask.project.identifier}-{targetTask.sequenceId}
                              </span>
                              <span className="text-xs truncate flex-1">{targetTask.title}</span>
                            </div>
                          </CommandItem>

                        ))}

                      </CommandGroup>

                    </Command>
                  </PopoverContent>
                </Popover>

                <Button variant="secondary" size="sm" className="h-8 text-xs font-medium">
                  <Paperclip className="h-3.5 w-3.5 mr-2" /> Attach
                </Button>
              </div>

              {/* Description Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                    <AlignLeft className="h-5 w-5 text-muted-foreground" />
                    Description
                  </div>
                  {isSavingDesc && (
                    <span className="text-xs font-medium text-muted-foreground animate-pulse">
                      Saving...
                    </span>
                  )}
                </div>

                <div className="ml-7">
                  <Textarea
                    placeholder="Add a more detailed description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionBlur}
                    className="min-h-[140px] resize-none border-transparent bg-muted/10 hover:bg-muted/30 focus:bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                  />
                </div>
              </div>

              {/* --- SUBTASKS SECTION --- */}
              <div className="space-y-4 pt-6 border-t">

                {/* 1. Header with Counter */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                    <CheckSquare className="h-5 w-5 text-muted-foreground" />
                    Subtasks
                  </div>

                  {totalSubtasks > 0 && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {completedSubtasks} / {totalSubtasks}
                    </span>
                  )}
                </div>

                {/* 2. The Progress Bar */}
                {totalSubtasks > 0 && (
                  <Progress
                    value={progressPercentage}
                    className="h-2 w-full bg-muted"
                  />
                )}

                {/* 3. The Subtask List & Inputs */}
                <div className="ml-7 space-y-2">

                  {/* Map through existing subtasks */}
                  {task.subtasks?.map((subtask: any) => (
                    <div key={subtask.id} className="flex items-start gap-3 group py-1">
                      <Input
                        type="checkbox"
                        checked={subtask.status === "DONE"}
                        onChange={(e) => {
                          // USE THE NEW MUTATION HERE!
                          updateSubtaskMutation.mutate({
                            id: subtask.id,
                            status: e.target.checked ? "DONE" : "TODO"
                          });
                        }}
                        className="mt-1 h-4 w-4 rounded border-muted-foreground/30 accent-primary cursor-pointer"
                      />
                      <span className={`text-sm flex-1 ${subtask.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}

                  {/* The Inline Input for new subtasks */}
                  {isAddingSubtask && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-4 w-4 rounded border border-dashed border-muted-foreground/50 shrink-0" />
                      <input
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
                        placeholder="What needs to be done?"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateSubtask();
                          if (e.key === "Escape") {
                            setIsAddingSubtask(false);
                            setNewSubtaskTitle("");
                          }
                        }}
                        onBlur={() => {
                          // Save if they click away, otherwise just close
                          if (newSubtaskTitle.trim()) handleCreateSubtask();
                          else setIsAddingSubtask(false);
                        }}
                        disabled={isCreatingSubtask}
                      />
                    </div>
                  )}

                  {/* Empty state (only shows if no subtasks and not adding one) */}
                  {(!task.subtasks || task.subtasks.length === 0) && !isAddingSubtask && (
                    <p className="text-sm text-muted-foreground italic">No subtasks added yet.</p>
                  )}
                </div>
              </div>
              {/* --- END SUBTASKS SECTION --- */}
              {/* --- ACTIVITY LOG SECTION --- */}
              <div className="space-y-4 pt-8 border-t mt-8">
                <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Activity
                </div>

                {isLoadingActivity ? (
                  <div className="text-xs text-muted-foreground">Loading history...</div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic">No activity recorded yet.</div>
                ) : (
                  <div className="space-y-5 ml-2 border-l-2 border-muted pl-4 relative">
                    {activityLogs.map((log: any) => (
                      <div key={log.id} className="relative">
                        {/* Timeline dot/avatar */}
                        <div className="absolute -left-[25px] top-0 h-6 w-6 rounded-full bg-background border flex items-center justify-center overflow-hidden">
                          {log.actor.image ? (
                            <img src={log.actor.image} alt={log.actor.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold">{log.actor.name?.charAt(0) || "U"}</span>
                          )}
                        </div>

                        {/* Log Content */}
                        <div className="flex flex-col gap-0.5">
                          <div className="text-sm">
                            <span className="font-medium text-foreground">{log.actor.name} </span>
                            <span className="text-muted-foreground">
                              {log.action === "STATUS_CHANGED" && "updated the status"}
                              {log.action === "PRIORITY_CHANGED" && "changed the priority"}
                              {log.action === "TYPE_CHANGED" && "changed the issue type"}
                              {log.action === "ASSIGNEE_ASSIGNED" && "assigned this task"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </div>

                          {/* Value Diff Badge */}
                          <div className="mt-1.5 flex items-center gap-2 text-xs font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground line-through">
                              {log.oldValue || "None"}
                            </span>
                            <span>→</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700">
                              {log.newValue}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* --- LINKED ISSUES SECTION --- */}
              {(task.blocking?.length > 0 || task.blockedBy?.length > 0) && (
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                    <Link2 className="h-5 w-5 text-muted-foreground" />
                    Linked Issues
                  </div>

                  <div className="ml-7 space-y-4">

                    {/* 1. Tasks THIS task is blocking */}
                    {task.blocking?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocks</span>
                        {task.blocking.map((dep: any) => (
                          <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer">
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">
                              {dep.blockedBy.project.identifier}-{dep.blockedBy.sequenceId}
                            </Badge>
                            <span className={`text-sm flex-1 truncate ${dep.blockedBy.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                              {dep.blockedBy.title}
                            </span>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {dep.blockedBy.status.replace("_", " ").toLowerCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Tasks blocking THIS task */}
                    {task.blockedBy?.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Is Blocked By</span>
                        {task.blockedBy.map((dep: any) => (
                          <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer">
                            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              {dep.blocking.project.identifier}-{dep.blocking.sequenceId}
                            </Badge>
                            <span className={`text-sm flex-1 truncate ${dep.blocking.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                              {dep.blocking.title}
                            </span>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {dep.blocking.status.replace("_", " ").toLowerCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}
              {/* --- END LINKED ISSUES SECTION --- */}

              {/* Activity placeholder */}
              {/* ACTIVITY FEED */}
              <div className="space-y-6 pt-4 border-t">
                <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Activity
                </div>

                {/* Comment Input Box */}
                <div className="ml-7 flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handlePostComment}
                        disabled={!newComment.trim() || isAddingComment}
                      >
                        {isAddingComment ? "Posting..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Render Existing Comments */}
                <div className="ml-7 space-y-6 mt-6">
                  {task.comments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                  ) : (
                    task.comments?.map((comment: any) => (
                      <div key={comment.id} className="flex gap-4 group">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden border">
                          {/* If you have images later, put an <Image> tag here */}
                          <span className="text-xs font-bold uppercase">
                            {comment.author?.name?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {comment.author?.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-transparent group-hover:border-border transition-colors">
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

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
                        onSelect={(date) => {
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

              <div className="text-xs text-muted-foreground space-y-3 font-medium">
                <div className="flex justify-between items-center">
                  <span>Created</span>
                  <span className="text-foreground">
                    {/* SAFE FALLBACK: Check if createdAt exists before formatting */}
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
                      deleteTask();
                    }
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  {isDeleting ? "Deleting..." : "Delete Task"}
                </Button>
              </div>

            </div>
          </div>
        </>
      );
    }

    return <div className="p-8 text-center text-muted-foreground">Task not found.</div>;
  };

  return (
    <Dialog
      open={isTaskDetailsModalOpen}
      onOpenChange={(open) => {
        if (!open) closeTaskDetails();
      }}
    >
      {/* ADDED w-[95vw] TO FORCE WIDTH */}
      <DialogContent className="w-[95vw] sm:max-w-[800px] lg:max-w-[1000px] p-0 overflow-hidden h-[85vh] flex flex-col gap-0 outline-none">
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
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