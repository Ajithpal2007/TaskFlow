"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectTabs({ workspaceId, projectId }: { workspaceId: string, projectId: string }) {
  const pathname = usePathname();
  const basePath = `/dashboard/${workspaceId}/projects/${projectId}`;
  
  // Checks if the current URL matches the tab
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex items-center gap-6 h-12">
      <Link 
        href={basePath} 
        className={`h-full flex items-center border-b-2 text-sm font-medium transition-colors ${
          isActive(basePath) 
            ? "border-primary text-foreground" 
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        Board
      </Link>
      
      <Link 
        href={`${basePath}/backlog`} 
        className={`h-full flex items-center border-b-2 text-sm font-medium transition-colors ${
          isActive(`${basePath}/backlog`) 
            ? "border-primary text-foreground" 
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        Backlog
      </Link>

      <Link 
        href={`${basePath}/settings`} 
        className={`h-full flex items-center border-b-2 text-sm font-medium transition-colors ${
          isActive(`${basePath}/settings`) 
            ? "border-primary text-foreground" 
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        Settings
      </Link>
    </div>
  );
}