import { prisma } from "@repo/database";
import { CreateTaskInput, UpdateTaskInput } from "@repo/validators";

export const taskService = {
  /**
   * Create a new task with an auto-incrementing Sequence ID per project
   */
  
  async createTask(data: CreateTaskInput, creatorId: string) {
    // 1. Start a transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // 2. Get the current max sequenceId for this specific project
      const lastTask = await tx.task.findFirst({
        where: { projectId: data.projectId },
        orderBy: { sequenceId: "desc" },
        select: { sequenceId: true },
      });

      const nextSequenceId = lastTask ? lastTask.sequenceId + 1 : 1;

      // 3. Create the task
      return await tx.task.create({
        data: {
          title: data.title,
          description: data.description,
          status: data.status || "TODO",
          priority: data.priority || "NONE",
          projectId: data.projectId,
          creatorId: creatorId,
          sequenceId: nextSequenceId,
          // If you passed an assigneeId in the request
          assigneeId: (data as any).assigneeId || null,
        },
        include: {
          project: { select: { identifier: true } },
          assignee: { select: { name: true, image: true } },
        },
      });
    });
  },

  /**
   * Fetch all tasks for a project, grouped for the Kanban board
   */
 async getTasksByProjectId(projectId: string) {
    try {
      return await prisma.task.findMany({
        where: { projectId },
        // 👇 EVERYTHING YOU WANT TO JOIN MUST BE INSIDE THIS INCLUDE BLOCK
        include: {
          project: { select: { identifier: true } },
          assignee: { select: { id: true, name: true, image: true } },
          // Moved comments inside!
          comments: { 
            select: { id: true } 
          },
          // Added subtasks so your card progress counters work!
          subtasks: {
            select: { id: true, status: true } 
          },
          tags: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      console.error("PRISMA ERROR in getTasksByProjectId:", error);
      throw error;
    }
  },

  /**
   * Update task (Handles Drag & Drop status changes)
   */
  async updateTask(taskId: string, userId: string, data: UpdateTaskInput) {
    // 1. Fetch the task BEFORE the update so we know what changed
    const oldTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!oldTask) throw new Error("Task not found");

    // 2. Perform the actual update using YOUR safe spread logic
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.tags && {
          tags: {
            set: data.tags.map((id: string) => ({ id })),
          },
        }),
        ...(data.type && { type: data.type }),
        ...(data.storyPoints !== undefined && { storyPoints: data.storyPoints }),
        ...(data.parentTaskId !== undefined && { parentTaskId: data.parentTaskId }),
      },
      include: {
        project: { select: { identifier: true } },
        assignee: { select: { name: true, image: true } },
      }
    });

    // 3. The Diffing Engine: Figure out what changed
    const logsToCreate = [];

    if (data.status && data.status !== oldTask.status) {
      logsToCreate.push({ action: "STATUS_CHANGED", oldValue: oldTask.status, newValue: data.status });
    }
    if (data.priority && data.priority !== oldTask.priority) {
      logsToCreate.push({ action: "PRIORITY_CHANGED", oldValue: oldTask.priority, newValue: data.priority });
    }
    if (data.type && data.type !== oldTask.type) {
      logsToCreate.push({ action: "TYPE_CHANGED", oldValue: oldTask.type, newValue: data.type });
    }
    if (data.assigneeId !== undefined && data.assigneeId !== oldTask.assigneeId) {
      logsToCreate.push({ 
        action: data.assigneeId ? "ASSIGNEE_ASSIGNED" : "ASSIGNEE_REMOVED", 
        oldValue: oldTask.assigneeId || "Unassigned", 
        newValue: data.assigneeId || "Unassigned" 
      });
    }

    // 4. Save the logs to the database in bulk
   if (logsToCreate.length > 0) {
      // 🚨 REMOVE 'await' here and add '.catch()'
      prisma.activityLog.createMany({
        data: logsToCreate.map(log => ({
          ...log,
          taskId,
          actorId: userId, 
        }))
      }).catch(err => console.error("Failed to save activity logs:", err));
    }

    return updatedTask;
  },

  /**
   * Get a single task with its full history (Activity Log)
   */
  async getTaskDetails(taskId: string) {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true, image: true } },
        
        subtasks: {
          orderBy: { createdAt: "asc" }, // Keep them in order
        },
        tags: true,
        // 1. Tasks that THIS task is actively blocking
        blocking: {
          include: {
            blockedBy: { 
              select: { 
                id: true, 
                title: true, 
                status: true,
                sequenceId: true,
                project: { select: { identifier: true } }
              } 
            }
          }
        },
        
        // 2. Tasks that THIS task is blocked by
        blockedBy: {
          include: {
            blocking: { 
              select: { 
                id: true, 
                title: true, 
                status: true,
                sequenceId: true,
                project: { select: { identifier: true } }
              } 
            }
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            sequenceId: true,
            project: { select: { identifier: true } }
          }
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true, image: true } } },
        },
        activityLogs: {
          include: { actor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },

  async addComment(taskId: string, content: string, authorId: string) {
    return await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId,
      },
      // Include the author so the frontend can instantly show their name and avatar
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });
  },

  async deleteTask(taskId: string) {
    return await prisma.task.delete({
      where: { id: taskId },
    });
  },

  
  // apps/api/src/services/task.service.ts

  async createSubtask(
    parentTaskId: string,
    title: string,
    projectId: string,
    creatorId: string,
  ) {
    // 1. Get the next sequence number for this project (e.g., if max is 5, this becomes 6)
    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { sequenceId: "desc" },
    });

    const nextSequenceId = (lastTask?.sequenceId ?? 0) + 1;

    // 2. Create the task with ALL required fields
    return await prisma.task.create({
      data: {
        title,
        projectId,
        parentTaskId,
        creatorId,
        sequenceId: nextSequenceId,
        status: "TODO",
      },
      include: {
        project: { select: { identifier: true } },
        assignee: { select: { name: true, image: true } },
      },
    });
  },

  async updateTaskTags(taskId: string, tagIds: string[]) {
    return await prisma.task.update({
      where: { id: taskId },
      data: {
        tags: {
          // This "set" command replaces all old tags with the new list
          set: tagIds.map((id) => ({ id })),
        },
      },
      include: { tags: true },
    });
  },
  /**
   * Links two tasks together with a specific dependency type
   */
  async linkTasks(blockingId: string, blockedById: string, type: "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES") {
    // If the user selects "IS_BLOCKED_BY" in the UI, we just flip the IDs 
    // before saving to keep the database logic clean.
    const actualBlockingId = type === "IS_BLOCKED_BY" ? blockedById : blockingId;
    const actualBlockedById = type === "IS_BLOCKED_BY" ? blockingId : blockedById;
    
    // Default to BLOCKS or RELATES_TO depending on what was selected
    const actualType = type === "RELATES_TO" || type === "DUPLICATES" ? type : "BLOCKS";

    return await prisma.taskDependency.create({
      data: {
        blockingId: actualBlockingId,
        blockedById: actualBlockedById,
        type: actualType
      }
    });
  },

  // Find tasks by title, excluding the current task
  async searchProjectTasks(projectId: string, excludeTaskId: string, searchQuery: string = "") {
    return await prisma.task.findMany({
      where: {
        projectId,
        id: { not: excludeTaskId }, // Prevent infinite loops (linking to itself)
        title: { contains: searchQuery, mode: "insensitive" } // Case-insensitive search
      },
      select: {
        id: true,
        title: true,
        sequenceId: true,
        project: { select: { identifier: true } }
      },
      take: 15, // Only return top 15 results for UI speed
    });
  },

  async getProjectEpics(projectId: string, excludeTaskId: string) {
    return await prisma.task.findMany({
      where: { 
        projectId, 
        type: "EPIC",
        id: { not: excludeTaskId } // A task cannot be its own parent
      },
      select: { id: true, title: true, sequenceId: true, project: { select: { identifier: true } } }
    });
  },

  async getTaskActivity(taskId: string) {
    return await prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { name: true, image: true } } // Get the user's avatar
      }
    });
  }


  
};

