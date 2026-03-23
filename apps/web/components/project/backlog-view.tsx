"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/api/use-tasks";
import { useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { Search, MoreHorizontal, ArrowUpDown } from "lucide-react";

// Adjust imports based on your Shadcn setup
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";

export function BacklogView({ projectId }: { projectId: string }) {
  const { tasks, isLoading, deleteTask } = useTasks(projectId);
  const router = useRouter();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Filter tasks based on the search bar
  const filteredTasks = tasks?.filter((task: any) => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.sequenceId?.toString().includes(searchQuery)
  );

  // 2. Open the Task Details Modal via URL
  const openTask = (taskId: string) => {
    router.push(`${pathname}?taskId=${taskId}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-10 w-[300px]" />
        <div className="space-y-2 mt-8">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background p-6 md:p-8">
      
      {/* HEADER: Search and Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Backlog</h2>
          <p className="text-sm text-muted-foreground">Plan and prioritize your upcoming work.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter tasks..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE: The High-Density List */}
      <div className="rounded-md border bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 z-10">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Priority</TableHead>
              <TableHead className="w-[150px]">Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No tasks found in the backlog.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks?.map((task: any) => (
                <TableRow 
                  key={task.id} 
                  className="cursor-pointer hover:bg-muted/50 group transition-colors"
                  onClick={() => openTask(task.id)}
                >
                  <TableCell className="font-medium text-muted-foreground text-xs">
                    {task.project?.identifier}-{task.sequenceId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border bg-muted/20 text-muted-foreground">
                      {task.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${task.priority === 'HIGH' ? 'text-red-500' : task.priority === 'MEDIUM' ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {task.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(task.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openTask(task.id)}>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}