"use client";

import { useWorkspace, useWorkspaceAnalytics } from "@/hooks/api/use-workspace";
import { useProjects } from "@/hooks/api/use-projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card";
import { CheckCircle2, CircleDashed, Kanban, Target } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";



// 🟢 MOCK DATA (We will wire this to a Fastify aggregation route next!)
const issueTypeData = [
  { name: "Features", value: 45, color: "#3b82f6" }, // Blue
  { name: "Bugs", value: 25, color: "#ef4444" },     // Red
  { name: "Tasks", value: 20, color: "#22c55e" },    // Green
  { name: "Tech Debt", value: 10, color: "#eab308" },// Yellow
];

const sprintVelocityData = [
  { name: "Sprint 1", completed: 12, added: 15 },
  { name: "Sprint 2", completed: 18, added: 16 },
  { name: "Sprint 3", completed: 24, added: 20 },
  { name: "Sprint 4", completed: 21, added: 18 },
  { name: "Sprint 5", completed: 28, added: 22 },
];

export default function WorkspaceDashboard({ params }: { params: { workspaceId: string } }) {
  const { data: workspace } = useWorkspace(params.workspaceId);
  const { data: projects } = useProjects(params.workspaceId);

  const { data: analytics, isLoading } = useWorkspaceAnalytics(params.workspaceId);
  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading dashboard...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-muted/10">

      {/* HEADER */}
      <div className="shrink-0 px-8 py-8 bg-background border-b">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back to <span className="font-semibold text-foreground">{workspace?.name || "your workspace"}</span>. Here is your overview.
        </p>
      </div>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">

        {/* --- 1. KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
              <Kanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.kpis.activeProjects || 0}</div>
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

        {/* --- 2. CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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
    </div>
  );
}