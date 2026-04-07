"use client";

import { useState, useEffect } from "react"; // 🟢 Added useEffect for debouncing
import { useTaskActivity } from "@/hooks/api/use-activity";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { Badge } from "@repo/ui/components/badge";
import { User, Link2, History, MessageSquare, Plus, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/command";

import { useTasks } from "@/hooks/api/use-tasks";

import { TaskAttachments } from "./task-attachments";

import { MentionsInput, Mention } from "react-mentions";

interface TaskActivityProps {
  task: any;
  workspaceUsers?: any[]; // <--- NEW PROP
  addComment: (content: string, options?: any) => void;
  isAddingComment: boolean;
  linkIssue: (data: { targetTaskId: string, linkType: string, targetTaskData: any }) => void;
  unlinkIssue: (targetTaskId: string) => void;
}

const mentionsStyles = {
  control: {
    fontSize: 14,
    fontWeight: "normal",
  },
  highlighter: {
    padding: "8px", 
  },
  input: {
    padding: "8px",
    outline: "none",
    border: "none",
    color: "inherit", 
  },
 
};

const renderCommentText = (text: string) => {
  if (!text) return null;
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="text-primary font-medium bg-primary/10 px-1 py-0.5 rounded cursor-pointer hover:underline">
        @{match[1]}
      </span>
    );
    lastIndex = mentionRegex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));

  return parts.length > 0 ? parts : text;
};
export function TaskActivity({ task, workspaceUsers = [], addComment, isAddingComment, linkIssue, unlinkIssue }: TaskActivityProps) {
  
  const { data: activityLogs = [], isLoading: isLoadingActivity,refetch: refetchActivity } = useTaskActivity(task?.id);

  // 🟢 THE FIX: Refetch activity logs whenever the task's status or priority changes!
  useEffect(() => {
    if (task?.id) {
      refetchActivity();
    }
  }, [task?.status, task?.priority, task?.assigneeId, refetchActivity, task?.id]);

  const [newComment, setNewComment] = useState("");

  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(""); // 🟢 State for debouncing
  const [linkType, setLinkType] = useState<"BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES">("BLOCKS");

  // 🟢 1. THE DEBOUNCE EFFECT: Waits 300ms after typing stops before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(linkSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [linkSearchQuery]);

  // Use the debounced query for the API hook!
  const { tasks: searchResults = [] } = useTasks(task?.projectId);

  if (!task) return null;

  const mentionData = workspaceUsers.map(member => ({
    // Use the actual User ID, not the Membership ID
    id: member.user?.id || member.userId,
    // Look inside the nested user object for the name!
    display: member.user?.name || member.user?.email || "Unknown User"
  }));
  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const textToSubmit = newComment.trim();
    setNewComment("");
    addComment(textToSubmit);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePostComment();
    }
  };



 return (
    // 🟢 1. Caged the outermost container with 'min-w-0 w-full'
    <div className="flex flex-col gap-10 min-w-0 w-full">
      <div className="space-y-4 pt-6 border-t min-w-0 w-full">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 font-semibold text-lg text-foreground truncate">
            <Link2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <span className="truncate">Linked Issues</span>
          </div>

          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen} modal={true}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2 shrink-0 ml-4">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[320px] p-0 z-50" align="start" side="bottom" sideOffset={4} avoidCollisions={false}>
              <div className="p-2 border-b bg-muted/30">
                <Select value={linkType} onValueChange={(v: any) => setLinkType(v)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="BLOCKS">Blocks...</SelectItem>
                    <SelectItem value="IS_BLOCKED_BY">Is Blocked By...</SelectItem>
                    <SelectItem value="RELATES_TO">Relates To...</SelectItem>
                    <SelectItem value="DUPLICATES">Duplicates...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Command className="bg-transparent">
                <CommandInput
                  placeholder="Search tasks by ID or title..."
                  value={linkSearchQuery}
                  onValueChange={setLinkSearchQuery}
                  className="h-9 text-xs"
                />

                <CommandList className="h-56 overflow-y-auto overflow-x-hidden">
                  <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                    No tasks found.
                  </CommandEmpty>

                  <CommandGroup>
                    {searchResults
                      .filter((t: any) => t.id !== task.id)
                      .map((t: any) => (
                        <CommandItem
                          key={t.id}
                          value={`${t.project?.identifier}-${t.sequenceId} ${t.title}`}
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
        
        {/* 🟢 2. Prevent linked issues from overflowing */}
        <div className="ml-7 space-y-4 min-w-0 pr-7 overflow-hidden">

          {/* --- 🔴 BLOCKS --- */}
          {task.blocking?.filter((d: any) => d.type === "BLOCKS").length > 0 && (
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocks</span>
              {task.blocking.filter((d: any) => d.type === "BLOCKS").map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer min-w-0">
                  <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 shrink-0">
                    {dep.blockedBy.project?.identifier}-{dep.blockedBy.sequenceId}
                  </Badge>
                  <span className={`text-sm flex-1 truncate ${dep.blockedBy?.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {dep.blockedBy.title}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); unlinkIssue(dep.blockedBy.id); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* --- 🟡 IS BLOCKED BY --- */}
          {task.blockedBy?.filter((d: any) => d.type === "BLOCKS").length > 0 && (
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Is Blocked By</span>
              {task.blockedBy.filter((d: any) => d.type === "BLOCKS").map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer min-w-0">
                  <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shrink-0">
                    {dep.blocking.project?.identifier}-{dep.blocking.sequenceId}
                  </Badge>
                  <span className={`text-sm flex-1 truncate ${dep.blocking?.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {dep.blocking.title}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); unlinkIssue(dep.blocking.id); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* --- 🔵 RELATES TO --- */}
          {task.blocking?.filter((d: any) => d.type === "RELATES_TO").length > 0 && (
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Relates To</span>
              {task.blocking.filter((d: any) => d.type === "RELATES_TO").map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer min-w-0">
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 shrink-0">
                    {dep.blockedBy.project?.identifier}-{dep.blockedBy.sequenceId}
                  </Badge>
                  <span className={`text-sm flex-1 truncate ${dep.blockedBy?.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {dep.blockedBy.title}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); unlinkIssue(dep.blockedBy.id); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* --- 🟣 DUPLICATES --- */}
          {task.blocking?.filter((d: any) => d.type === "DUPLICATES").length > 0 && (
            <div className="space-y-2 min-w-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duplicates</span>
              {task.blocking.filter((d: any) => d.type === "DUPLICATES").map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted/50 transition-colors group cursor-pointer min-w-0">
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20 shrink-0">
                    {dep.blockedBy.project?.identifier}-{dep.blockedBy.sequenceId}
                  </Badge>
                  <span className={`text-sm flex-1 truncate ${dep.blockedBy?.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {dep.blockedBy.title}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); unlinkIssue(dep.blockedBy.id); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
      
      <div className="w-full min-w-0 overflow-hidden">
        <TaskAttachments task={task} />
      </div>

      {/* --- COMMENTS SECTION --- */}
      <div className="space-y-6 pt-6 border-t min-w-0 w-full overflow-hidden">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0" />
          Comments
        </div>

        {/* 🟢 3. Caged the MentionsInput to force it to obey screen limits */}
        <div className="ml-7 flex gap-4 min-w-0 pr-7 overflow-hidden">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
           <div className="flex-1 space-y-2 relative min-w-0">
            <MentionsInput
              className="task-mentions"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment... Type @ to mention someone."
            >
              <Mention
                trigger="@"
                data={mentionData}
                displayTransform={(id, display) => `@${display}`}
                renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                  <div
                    className={`px-2 py-1.5 text-sm rounded-sm transition-colors cursor-pointer ${
                      focused
                        ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                        : "bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {suggestion.display}
                  </div>
                )}
              />
            </MentionsInput>
            
            <div className="flex justify-end relative z-50 pt-2">
              <Button
                size="sm"
                type="button"
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handlePostComment();
                }}
                disabled={!newComment.trim() || isAddingComment}
              >
                {isAddingComment ? "Posting..." : "Save"}
              </Button>
            </div>
            </div>
          </div>
        </div>

        <div className="ml-7 space-y-6 mt-6 min-w-0 pr-7">
          {!task.comments || task.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
          ) : (
            task.comments?.map((comment: any) => (
              <div key={comment.id} className="flex gap-4 group min-w-0">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border">
                  <span className="text-xs font-bold uppercase">
                    {comment.author?.name?.charAt(0) || "U"}
                  </span>
                </div>
                {/* 🟢 4. THE MAGIC KEY: Added 'break-words' and 'min-w-0' to the comment text box */}
                <div className="flex-1 space-y-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {comment.author?.name || "Unknown User"}
                    </span>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "Unknown time"}
                    </div>
                  </div>
                  <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-transparent group-hover:border-border transition-colors whitespace-pre-wrap break-words min-w-0 w-full">
                    {renderCommentText(comment.content)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- ACTIVITY LOG SECTION --- */}
      <div className="space-y-4 pt-6 border-t min-w-0 w-full overflow-hidden">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <History className="h-5 w-5 text-muted-foreground shrink-0" />
          History
        </div>

        {isLoadingActivity ? (
          <div className="text-xs text-muted-foreground">Loading history...</div>
        ) : activityLogs.length === 0 ? (
          <div className="text-xs text-muted-foreground italic ml-7">No activity recorded yet.</div>
        ) : (
          <div className="space-y-6 ml-10 border-l-2 border-muted pl-6 relative min-w-0 pr-10">
            {activityLogs.map((log: any) => (
              <div key={log.id} className="relative min-w-0">
                <div className="absolute -left-[37px] top-0 h-6 w-6 rounded-full bg-background border-2 border-muted flex items-center justify-center overflow-hidden">
                  {log.actor?.image ? (
                    <img src={log.actor.image} alt={log.actor.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">{log.actor?.name?.charAt(0) || "U"}</span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="text-sm min-w-0">
                    <span className="font-medium text-foreground truncate block md:inline">{log.actor?.name} </span>
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
                  {/* 🟢 5. flex-wrap prevents long history string updates from breaking out */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-mono min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground line-through break-all">
                      {log.oldValue || "None"}
                    </span>
                    <span className="text-muted-foreground shrink-0">→</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 break-all">
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