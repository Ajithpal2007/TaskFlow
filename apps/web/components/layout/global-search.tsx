"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/app/lib/stores/use-ui-store";
import { useWorkspaceStore } from "@/app/lib/stores/use-workspace-store";
import { useSearch } from "@/hooks/api/use-search";
import { Folder, CheckSquare } from "lucide-react";
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
  const [debouncedValue, setDebouncedValue] = useState(""); // 🟢 New state for debouncing

  // 🟢 1. THE DEBOUNCE FIX: Wait 300ms after the user stops typing to update the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // 🟢 2. Pass the debounced value to the API hook so we don't spam the server!
  const { data: results, isFetching } = useSearch(activeWorkspaceId, debouncedValue);

  // 🟢 THE BULLETPROOF LISTENER
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Check for both lowercase and uppercase 'K' (in case Caps Lock is on)
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();

        // Use Zustand's getState() to bypass React closures! 
        // This guarantees we always have the freshest state without needing dependencies.
        const currentState = useUIStore.getState().isSearchOpen;
        setSearchOpen(!currentState);
      }
    };

    document.addEventListener("keydown", down);

    // Clean up ONLY when the component completely unmounts
    return () => document.removeEventListener("keydown", down);
  }, []); // 🟢 Empty dependency array!

  // Clear input when modal closes
  useEffect(() => {
    if (!isSearchOpen) setInputValue("");
  }, [isSearchOpen]);

  const handleSelectProject = (projectId: string) => {
    setSearchOpen(false);
    router.push(`/dashboard/${activeWorkspaceId}/projects/${projectId}`);
  };

  const handleSelectTask = (task: any) => {
    setSearchOpen(false);
    // 🟢 Routes to the board and appends ?taskId=... to the URL
    router.push(`/dashboard/${activeWorkspaceId}/projects/${task.projectId}?taskId=${task.id}`);
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type a command or search..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {/* 🟢 3. FIX THE EMPTY STATE FLASH */}
            <CommandEmpty>
              {inputValue.length < 2
                ? "Type at least 2 characters to search..."
                : isFetching
                  ? "Searching database..."
                  : "No results found."}
            </CommandEmpty>

            {results?.projects && results.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {results.projects.map((project: any) => (
                  <CommandItem key={project.id} value={project.id} onSelect={() => handleSelectProject(project.id)}>
                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{project.identifier}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results?.tasks && results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((task: any) => (
                  <CommandItem key={task.id} value={task.id} onSelect={() => handleSelectTask(task)}>
                    <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                    <span className="truncate max-w-[250px]">{task.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{task.project.identifier}-{task.sequenceId}</span>
                    </span>
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