"use client";

import { useWorkspace, useWorkspaceAnalytics } from "@/hooks/api/use-workspace";
import { useMyPriorityTasks, useRecentDocuments } from "@/hooks/api/use-dashboard";
import { useProjects } from "@/hooks/api/use-projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { AlertCircle, CheckCircle2, CircleDashed, Clock, FileText, Kanban, Plus, Target } from "lucide-react";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function WorkspaceDashboard({ params }: { params: { workspaceId: string } }) {
  const { data: workspace } = useWorkspace(params.workspaceId);
  const { workspaceId } = params;
  const { data: projects } = useProjects(params.workspaceId);

  const { data: analytics, isLoading } = useWorkspaceAnalytics(params.workspaceId);
  const { data: myTasks, isLoading: loadingTasks } = useMyPriorityTasks(workspaceId);
  const { data: recentDocs, isLoading: loadingDocs } = useRecentDocuments(workspaceId);

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading dashboard...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-muted/10">

      {/* HEADER WITH QUICK ACTIONS */}
      {/* 🟢 TIGHTER HEADER: Reduced py-8 to py-6 and tightened the title sizing */}
      <div className="shrink-0 px-6 md:px-8 py-6 bg-background border-b flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back to <span className="font-semibold text-foreground">{workspace?.name || "your workspace"}</span>.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
            <FileText className="h-3.5 w-3.5" /> New Doc
          </Button>
          <Button size="sm" className="gap-2 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        </div>
      </div>

      {/* 🟢 REDUCED SPACING: Changed space-y-8 to space-y-6 to compress the vertical layout */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">

        {/* --- 1. KPI CARDS --- */}
        {/* 🟢 TIGHTER GRID: Added gap-4 for nice, compact data cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-primary opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis?.activeProjects || 0}</div>
            </CardContent>
          </Card>
           <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Progress</CardTitle>
              <CircleDashed className="h-4 w-4 text-blue-500 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis.tasksInProgress || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">+3 since yesterday</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis.issuesResolved || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completion</CardTitle>
              <Target className="h-4 w-4 text-purple-500 opacity-70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">+2% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* --- 2. THE "JUMP BACK IN" ROW --- */}
        {/* 🟢 TIGHTER GAP: Reduced gap-8 to gap-6 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Side: My Priority Tasks */}
          <Card className="flex flex-col h-full shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">My Priority Tasks</CardTitle>
              <CardDescription className="text-xs">Tasks actively in progress.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              {loadingTasks ? (
                <div className="animate-pulse flex space-y-2 flex-col">
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              ) : myTasks?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/50" />
                  <p className="text-sm">You have no pending priority tasks!</p>
                </div>
              ) : (
                // 🟢 TIGHTER LIST: Changed space-y-3 to space-y-2
                <div className="space-y-2">
                  {myTasks?.map((task: any) => (
                    <Link 
                      href={`/dashboard/${workspaceId}/projects/${task.project?.id}`} 
                      key={task.id}
                      className="block"
                    >
                      {/* 🟢 SLIMMER ITEMS: Changed p-3 to py-2 px-3 for sleeker rows */}
                      <div className="flex items-center justify-between py-2 px-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <CircleDashed className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{task.title}</span>
                            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-wide">{task.project?.name || "Unknown Project"}</span>
                          </div>
                        </div>
                        
                        {task.dueDate && (
                          <div className="shrink-0 ml-4 flex items-center gap-1.5 text-[10px] font-semibold bg-red-500/10 text-red-600 px-2 py-0.5 rounded uppercase tracking-wide">
                            <AlertCircle className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Side: Recent Documents */}
          <Card className="flex flex-col h-full shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Recent Documents</CardTitle>
              <CardDescription className="text-xs">Pick up where you left off.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              {loadingDocs ? (
                <div className="animate-pulse flex space-y-2 flex-col">
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              ) : recentDocs?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No documents edited recently.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentDocs?.map((doc: any) => (
                    <Link href={`/dashboard/${workspaceId}/docs/${doc.id}`} key={doc.id}>
                      <div className="flex items-center gap-3 py-2 px-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium text-sm truncate">{doc.title || "Untitled Document"}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            Edited {new Date(doc.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* --- 3. CHARTS GRID --- */}
        {/* 🟢 THE FIX: You had col-span-2 on the charts, but they weren't wrapped in a grid! 
            This div wrapper stops the bar chart from stretching across your entire monitor. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart: Sprint Velocity (Takes up 2/3 of the row) */}
          <Card className="col-span-1 lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sprint Velocity</CardTitle>
              <CardDescription className="text-xs">Tasks added vs. completed.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.sprintVelocityData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="added" name="Added scope" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Donut Chart: Issue Breakdown (Takes up 1/3 of the row) */}
          <Card className="col-span-1 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Issue Breakdown</CardTitle>
              <CardDescription className="text-xs">Active work distribution.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics?.issueTypeData || []} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                    {(analytics?.issueTypeData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}