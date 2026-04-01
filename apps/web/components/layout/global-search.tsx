"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { useSearch } from "@/hooks/api/use-search"; // Make sure this calls the new /global route!
import { Folder, CheckSquare, FileText, Layout } from "lucide-react"; // 🟢 Added new icons
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

  // 🟢 ROUTING HANDLERS
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
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search tasks, docs, and whiteboards..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.length < 2
                ? "Type at least 2 characters to search..."
                : isFetching
                  ? "Searching workspace..."
                  : "No results found."}
            </CommandEmpty>

            {/* 🟢 TASKS */}
            {results?.tasks && results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((task: any) => (
                  <CommandItem key={task.id} value={`task-${task.id}`} onSelect={() => handleSelectTask(task)}>
                    <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                    <span className="truncate max-w-[250px]">{task.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{task.project.identifier}-{task.sequenceId}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* 🟢 DOCUMENTS */}
            {results?.documents && results.documents.length > 0 && (
              <CommandGroup heading="Documents">
                {results.documents.map((doc: any) => (
                  <CommandItem key={doc.id} value={`doc-${doc.id}`} onSelect={() => handleSelectDocument(doc.id)}>
                    {doc.emoji ? (
                      <span className="mr-2 text-sm">{doc.emoji}</span>
                    ) : (
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    )}
                    <span>{doc.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* 🟢 WHITEBOARDS */}
            {results?.whiteboards && results.whiteboards.length > 0 && (
              <CommandGroup heading="Whiteboards">
                {results.whiteboards.map((board: any) => (
                  <CommandItem key={board.id} value={`board-${board.id}`} onSelect={() => handleSelectWhiteboard(board.roomId)}>
                    <Layout className="mr-2 h-4 w-4 text-purple-500" />
                    <span>{board.title}</span>
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