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
      <div className="shrink-0 px-8 py-8 bg-background border-b flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back to <span className="font-semibold text-foreground">{workspace?.name || "your workspace"}</span>.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" /> New Doc
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">

        {/* --- 1. KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis?.activeProjects || 0}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks in Progress</CardTitle>
              <CircleDashed className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis.tasksInProgress || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">+3 since yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Issues Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis.issuesResolved || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {/* Title goes here */}
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {/* Large number goes here */}
              <div className="text-2xl font-bold">{analytics?.kpis.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">+2% from last week</p>
            </CardContent>
          </Card>
          
        </div>

        {/* --- 2. THE "JUMP BACK IN" ROW --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Side: My Priority Tasks */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">My Priority Tasks</CardTitle>
              <CardDescription>Tasks actively in progress.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {loadingTasks ? (
                <div className="animate-pulse flex space-y-4 flex-col">
                  <div className="h-10 bg-muted rounded w-full"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              ) : myTasks?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/50" />
                  <p className="text-sm">You have no pending priority tasks!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myTasks?.map((task: any) => (
                    <Link 
                      href={`/dashboard/${workspaceId}/projects/${task.project?.id}`} 
                      key={task.id}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <CircleDashed className="h-4 w-4 text-blue-500 shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{task.title}</span>
                            <span className="text-xs text-muted-foreground truncate">{task.project?.name || "Unknown Project"}</span>
                          </div>
                        </div>
                        
                        {task.dueDate && (
                          <div className="shrink-0 ml-4 flex items-center gap-1.5 text-xs font-medium bg-red-500/10 text-red-600 px-2.5 py-1 rounded-md">
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
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-lg">Recent Documents</CardTitle>
              <CardDescription>Pick up where you left off.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {loadingDocs ? (
                <div className="animate-pulse flex space-y-4 flex-col">
                  <div className="h-12 bg-muted rounded w-full"></div>
                  <div className="h-12 bg-muted rounded w-full"></div>
                </div>
              ) : recentDocs?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No documents edited recently.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDocs?.map((doc: any) => (
                    <Link href={`/dashboard/${workspaceId}/docs/${doc.id}`} key={doc.id}>
                      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="h-10 w-10 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          {/* Use your Yjs title field here, or default to "Untitled" */}
                          <span className="font-medium text-sm truncate">{doc.title || "Untitled Document"}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
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



        {/* Bar Chart: Sprint Velocity */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Sprint Velocity</CardTitle>
            <CardDescription>Comparing tasks added vs. tasks completed over recent sprints.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.sprintVelocityData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="added" name="Added scope" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Chart: Issue Breakdown */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Issue Breakdown</CardTitle>
            <CardDescription>Distribution of active work items.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.issueTypeData || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {/* Remember to map over analytics?.issueTypeData for the Cells! */}
                  {(analytics?.issueTypeData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

    </div>

  );
}