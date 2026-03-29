"use client";

import { Activity, CheckCircle2, UserPlus, Edit3, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkspaceActivity } from "@/hooks/api/use-activity";

// 🟢 1. THE TRANSLATOR: Converts DB actions into human-readable text
const getActivityMessage = (log: any) => {
  switch (log.action) {
    case "TASK_CREATED":
      return { text: "created task", icon: <PlusCircle size={16} className="text-green-500" /> };
    case "STATUS_CHANGED":
      return { 
        text: `changed status from ${log.oldValue || "None"} to ${log.newValue}`, 
        icon: <CheckCircle2 size={16} className="text-blue-500" /> 
      };
    case "ASSIGNEE_CHANGED":
      return { 
        text: `assigned this task to ${log.newValue}`, 
        icon: <UserPlus size={16} className="text-purple-500" /> 
      };
    case "TITLE_CHANGED":
      return { 
        text: `renamed the task to "${log.newValue}"`, 
        icon: <Edit3 size={16} className="text-orange-500" /> 
      };
    default:
      return { text: "updated the task", icon: <Activity size={16} className="text-muted-foreground" /> };
  }
};

export default function ActivityLogPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
 const { data: logs, isLoading } = useWorkspaceActivity(workspaceId);

  // 🟢 2. MOCK DATA (We will replace this with a Prisma fetch next!)
  

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      
      {/* --- HEADER --- */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10 shrink-0">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          Workspace Activity
        </h3>
      </div>

      {/* --- TIMELINE FEED --- */}
      <div className="flex-1 overflow-y-auto p-6 lg:px-12 bg-muted/5 relative">
        
        {/* The continuous vertical line behind the items */}
        <div className="absolute left-[3.25rem] lg:left-[4.75rem] top-10 bottom-10 w-px bg-border z-0" />

        <div className="space-y-6 relative z-10">

          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {/* 🟢 4. Handle empty state */}
          {!isLoading && (!logs || logs.length === 0) && (
            <div className="text-center text-muted-foreground py-10 bg-background border rounded-xl shadow-sm">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No activity recorded yet.</p>
            </div>
          )}

         
          


          {logs?.map((log: any) => {
            const { text, icon } = getActivityMessage(log);
            
            return (
              <div key={log.id} className="flex gap-4 lg:gap-6 group">
                
                {/* 1. Actor Avatar */}
                <div className="shrink-0 mt-1">
                  <Image 
                    src={log.actor.image} 
                    alt={log.actor.name} 
                    width={40} 
                    height={40} 
                    className="h-10 w-10 rounded-full object-cover border-2 border-background shadow-sm" 
                  />
                </div>

                {/* 2. Activity Card */}
                <div className="flex-1 bg-background border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    
                    {/* Who did it */}
                    <span className="font-bold text-foreground">{log.actor.name}</span>
                    
                    {/* Action text & icon */}
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      {text}
                    </span>

                    {/* Which task (Clickable link!) */}
                    <Link 
                      href={`/dashboard/${workspaceId}/tasks/${log.task.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {log.task.title}
                    </Link>

                  </div>
                  
                  {/* Timestamp & Icon badge */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <div className="bg-muted p-1 rounded-md">
                      {icon}
                    </div>
                    {new Date(log.createdAt).toLocaleString([], { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}