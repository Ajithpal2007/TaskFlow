"use client";

import { useState, useEffect } from "react"; // 🟢 Added useEffect for debouncing
import { useTaskActivity } from "@/hooks/api/use-activity";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { Badge } from "@repo/ui/components/badge";
import { User, Link2, History, MessageSquare, Plus, X } from "lucide-react";
import { useTaskSearch } from "@/hooks/api/use-task-search";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/command";

interface TaskActivityProps {
  task: any;
  addComment: (content: string, options?: any) => void;
  isAddingComment: boolean;
  linkIssue: (data: { targetTaskId: string, linkType: string, targetTaskData: any }) => void;
  unlinkIssue: (targetTaskId: string) => void;
}

export function TaskActivity({ task, addComment, isAddingComment, linkIssue, unlinkIssue }: TaskActivityProps) {
  const { data: activityLogs = [], isLoading: isLoadingActivity } = useTaskActivity(task?.id);
  const [newComment, setNewComment] = useState("");

  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(""); // 🟢 State for debouncing
  const [linkType, setLinkType] = useState<"BLOCKS" | "IS_BLOCKED_BY">("BLOCKS");

  // 🟢 1. THE DEBOUNCE EFFECT: Waits 300ms after typing stops before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(linkSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [linkSearchQuery]);

  // Use the debounced query for the API hook!
  const { data: searchResults = [] } = useTaskSearch(task?.projectId, debouncedQuery);

  if (!task) return null;

  const handlePostComment = () => {
    if (!newComment.trim()) return;

    // 1. Save the text to a temporary variable
    const textToSubmit = newComment.trim();

    // 🟢 2. INSTANT FEEDBACK: Clear the box immediately! Do not wait for the server.
    setNewComment("");

    // 3. Fire the mutation
    addComment(textToSubmit);
  };

  // 🟢 2. KEYBOARD SHORTCUT: Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePostComment();
    }
  };

  return (
    <div className="flex flex-col gap-10">

      {/* --- LINKED ISSUES SECTION --- */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
            <Link2 className="h-5 w-5 text-muted-foreground" />
            Linked Issues
          </div>

          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen} modal={true}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0 z-[105]" align="end">
              <div className="p-2 border-b bg-muted/30">
                <Select value={linkType} onValueChange={(v: any) => setLinkType(v)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!z-[10000]">
                    <SelectItem value="BLOCKS">Blocks...</SelectItem>
                    <SelectItem value="IS_BLOCKED_BY">Is Blocked By...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Command shouldFilter={false} className="bg-transparent">
                <CommandInput
                  placeholder="Search tasks by ID or title..."
                  value={linkSearchQuery}
                  onValueChange={setLinkSearchQuery}
                  className="h-9 text-xs"
                />
                <CommandList>
                  <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                    {linkSearchQuery ? "No tasks found." : "Type to search..."}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchResults
                      .filter((t: any) => t.id !== task.id)
                      .map((t: any) => (
                        <CommandItem
                          key={t.id}
                          value={t.id} // Added value prop for standard command behavior
                          onSelect={() => {
                            linkIssue({ targetTaskId: t.id, linkType, targetTaskData: t });
                            setIsLinkPopoverOpen(false);
                            setLinkSearchQuery("");
                          }}
                          className="cursor-pointer flex flex-col items-start gap-1 py-2"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                              {t.project?.identifier}-{t.sequenceId}
                            </span>
                            <span className="text-xs truncate flex-1">{t.title}</span>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="ml-7 space-y-4">
          {task.blocking?.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocks</span>
              {task.blocking.map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer">
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20">
                    {dep.blockedBy.project?.identifier}-{dep.blockedBy.sequenceId}
                  </Badge>
                  <span className={`text-sm flex-1 truncate ${dep.blockedBy?.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {dep.blockedBy.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100" // 🟢 Made 'X' appear on hover for cleaner UI
                    onClick={(e) => {
                      e.stopPropagation();
                      unlinkIssue(dep.blockedBy.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {task.blockedBy?.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Is Blocked By</span>
              {task.blockedBy.map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer">
                  <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    {dep.blocking.project?.identifier}-{dep.blocking.sequenceId}
                  </Badge>
                  <span className={`text-sm flex-1 truncate ${dep.blocking?.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {dep.blocking.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      unlinkIssue(dep.blocking.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- COMMENTS SECTION --- */}
      <div className="space-y-6 pt-6 border-t">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          Comments
        </div>

        <div className="ml-7 flex gap-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment... (Cmd+Enter to save)" // 🟢 Updated placeholder
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown} // 🟢 Added Keyboard shortcut
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

        <div className="ml-7 space-y-6 mt-6">
          {!task.comments || task.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
          ) : (
            task.comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-4 group">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border">
                  <span className="text-xs font-bold uppercase">
                    {comment.author?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {comment.author?.name || "Unknown User"}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "Unknown time"}
                    </div>
                  </div>
                  <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-transparent group-hover:border-border transition-colors whitespace-pre-wrap">
                    {/* 🟢 Added whitespace-pre-wrap so line breaks in comments render correctly */}
                    {comment.content || "..."}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- ACTIVITY LOG SECTION --- */}
      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <History className="h-5 w-5 text-muted-foreground" />
          History
        </div>

        {isLoadingActivity ? (
          <div className="text-xs text-muted-foreground">Loading history...</div>
        ) : activityLogs.length === 0 ? (
          <div className="text-xs text-muted-foreground italic ml-7">No activity recorded yet.</div>
        ) : (
          <div className="space-y-6 ml-10 border-l-2 border-muted pl-6 relative">
            {/* 🟢 Improved Timeline CSS to prevent text wrapping issues */}
            {activityLogs.map((log: any) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[37px] top-0 h-6 w-6 rounded-full bg-background border-2 border-muted flex items-center justify-center overflow-hidden">
                  {log.actor?.image ? (
                    <img src={log.actor.image} alt={log.actor.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">{log.actor?.name?.charAt(0) || "U"}</span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{log.actor?.name} </span>
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
                  <div className="mt-1.5 flex items-center gap-2 text-xs font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground line-through">
                      {log.oldValue || "None"}
                    </span>
                    <span className="text-muted-foreground">→</span>
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

    </div>
  );
}