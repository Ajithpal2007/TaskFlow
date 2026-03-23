import { prisma } from "@repo/database";

export const analyticsService = {
  async getWorkspaceAnalytics(workspaceId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 🟢 1. Notice the updated 'project: { workspaceId }' syntax
    const [activeProjects, tasksInProgress, issuesResolved, totalTasks] = await Promise.all([
      prisma.project.count({ where: { workspaceId } }),
      prisma.task.count({ where: { project: { workspaceId }, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { project: { workspaceId }, status: "DONE", updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.task.count({ where: { project: { workspaceId } } })
    ]);

    const completionRate = totalTasks === 0 ? 0 : Math.round((issuesResolved / totalTasks) * 100);

    // 🟢 2. Prisma's groupBy sometimes restricts deep relational filtering.
    // To be perfectly safe and avoid another error, we fetch the types and group them in memory.
    const tasksForTypes = await prisma.task.findMany({
      where: { project: { workspaceId } },
      select: { type: true }
    });

    const typeCounts = tasksForTypes.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 🟢 3. Format the data for Recharts
    const colorMap: Record<string, string> = {
      FEATURE: "#3b82f6", 
      BUG: "#ef4444",     
      TASK: "#22c55e",    
      EPIC: "#a855f7",    
      STORY: "#eab308",   
      SUBTASK: "#94a3b8"  
    };

    const issueTypeData = Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0) + type.slice(1).toLowerCase(), 
      value: count,
      color: colorMap[type] || "#94a3b8" 
    }));

    return {
      kpis: {
        activeProjects,
        tasksInProgress,
        issuesResolved,
        completionRate
      },
      issueTypeData,
      sprintVelocityData: [
        { name: "Week 1", completed: 12, added: 15 },
        { name: "Week 2", completed: 18, added: 16 },
        { name: "Week 3", completed: 24, added: 20 },
      ]
    };
  }
};