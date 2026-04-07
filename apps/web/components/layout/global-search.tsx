"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { useSearch } from "@/hooks/api/use-search"; 
import { Folder, CheckSquare, FileText, Layout } from "lucide-react"; 
import { Dialog, DialogContent } from "@repo/ui/components/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";

export function GlobalSearch() {
  const router = useRouter();
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: results, isFetching } = useSearch(activeWorkspaceId, debouncedValue);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const currentState = useUIStore.getState().isSearchOpen;
        setSearchOpen(!currentState);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) setInputValue("");
  }, [isSearchOpen]);

  // ROUTING HANDLERS
  const handleSelectTask = (task: any) => {
    setSearchOpen(false);
    router.push(`/dashboard/${activeWorkspaceId}/projects/${task.project.id}?taskId=${task.id}`);
  };

  const handleSelectDocument = (docId: string) => {
    setSearchOpen(false);
    router.push(`/dashboard/${activeWorkspaceId}/docs/${docId}`);
  };

  const handleSelectWhiteboard = (roomId: string) => {
    setSearchOpen(false);
    router.push(`/dashboard/${activeWorkspaceId}/canvas/${roomId}`);
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      {/* 🟢 THE BULLETPROOF FIX: 
          1. sm:max-w-[600px] locks it to standard Spotlight size on desktop.
          2. w-[95vw] ensures it fits cleanly on mobile phones. */}
      <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[600px] w-[95vw] border-border/50 rounded-xl">
        <Command shouldFilter={false} className="bg-background">
          <CommandInput
            placeholder="Search tasks, docs, and whiteboards..."
            value={inputValue}
            onValueChange={setInputValue}
            className="h-12 text-[15px]" // slightly taller input for a premium feel
          />
          {/* 🟢 HEIGHT CAP: Prevent the list from touching the bottom of the screen */}
          <CommandList className="max-h-[60vh] sm:max-h-[450px] overflow-y-auto">
            <CommandEmpty className="py-6 text-sm">
              {inputValue.length < 2
                ? "Type at least 2 characters to search..."
                : isFetching
                  ? "Searching workspace..."
                  : "No results found."}
            </CommandEmpty>

            {/* TASKS */}
            {results?.tasks && results.tasks.length > 0 && (
              <CommandGroup heading="Tasks" className="text-muted-foreground">
                {results.tasks.map((task: any) => (
                  <CommandItem 
                    key={task.id} 
                    value={`task-${task.id}`} 
                    onSelect={() => handleSelectTask(task)}
                    className="flex items-center py-2.5 cursor-pointer"
                  >
                    <CheckSquare className="mr-3 h-4 w-4 text-primary shrink-0" />
                    {/* 🟢 Flex-1 and min-w-0 ensures the title wraps nicely if it's too long */}
                    <span className="truncate flex-1 min-w-0 mr-4 text-foreground">{task.title}</span>
                    <span className="shrink-0 text-[10px] uppercase font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      {task.project.identifier}-{task.sequenceId}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* DOCUMENTS */}
            {results?.documents && results.documents.length > 0 && (
              <CommandGroup heading="Documents" className="text-muted-foreground">
                {results.documents.map((doc: any) => (
                  <CommandItem 
                    key={doc.id} 
                    value={`doc-${doc.id}`} 
                    onSelect={() => handleSelectDocument(doc.id)}
                    className="flex items-center py-2.5 cursor-pointer"
                  >
                    {doc.emoji ? (
                      <span className="mr-3 text-base shrink-0">{doc.emoji}</span>
                    ) : (
                      <FileText className="mr-3 h-4 w-4 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate flex-1 min-w-0 text-foreground">{doc.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* WHITEBOARDS */}
            {results?.whiteboards && results.whiteboards.length > 0 && (
              <CommandGroup heading="Whiteboards" className="text-muted-foreground">
                {results.whiteboards.map((board: any) => (
                  <CommandItem 
                    key={board.id} 
                    value={`board-${board.id}`} 
                    onSelect={() => handleSelectWhiteboard(board.roomId)}
                    className="flex items-center py-2.5 cursor-pointer"
                  >
                    <Layout className="mr-3 h-4 w-4 text-purple-500 shrink-0" />
                    <span className="truncate flex-1 min-w-0 text-foreground">{board.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}