import { FastifyInstance } from "fastify";
import {
  createTaskSchema,
  UpdateTaskInput,
  updateTaskSchema,
} from "@repo/validators";
import { taskService } from "../../services/task.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { prisma,NotificationType } from "@repo/database";

export default async function taskRoutes(fastify: FastifyInstance) {
  // 1. Get all tasks for a specific project
  // GET /api/tasks/project/:projectId
  fastify.get(
    "/project/:projectId",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };

      const tasks = await taskService.getTasksByProjectId(projectId);
      return { data: tasks };
    },
  );

  // 2. Create a new task
  // POST /api/tasks
  fastify.post(
    "/",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      const result = createTaskSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({ error: result.error.format() });
      }

      const userId = (request as any).user.id;
      const task = await taskService.createTask(result.data, userId);

      return reply.status(201).send({ data: task });
    },
  );

  // 3. Update a task (The Drag-and-Drop Handler)
  // PATCH /api/tasks/:taskId
 fastify.patch(
    "/:taskId",
    {
      preHandler: requireAuth,
    },
    async (request, reply) => {
      try {
        const { taskId } = request.params as { taskId: string };

        // Use the .partial() schema so we can update just the status or priority
        const result = updateTaskSchema.safeParse(request.body);

        if (!result.success) {
          return reply.status(400).send({ error: result.error.format() });
        }

        const userId = (request as any).user.id;
        const oldTask = await prisma.task.findUnique({ where: { id: taskId } });
        const updatedTask = await taskService.updateTask(
          taskId,
          userId,
          result.data,
        );
        if (
          result.data.assigneeId && 
          result.data.assigneeId !== oldTask?.assigneeId && 
          result.data.assigneeId !== userId
        ) {
          const assigner = await prisma.user.findUnique({ where: { id: userId }});

          await prisma.notification.create({
            data: {
              userId: result.data.assigneeId, // Send it to the new assignee
              type: "ASSIGNED",
              taskId: taskId,
              content: `${assigner?.name || "Someone"} assigned you to "${updatedTask.title}"`,
            }
          });
        }

        return { data: updatedTask };
      } catch (error) {
        console.error("Failed to update task:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
      }
    },
  );

  // 4. Get full details of a single task (For the "Edit" modal)
  // GET /api/tasks/:taskId
  fastify.get("/:taskId", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };

    try {
      const task = await taskService.getTaskDetails(taskId);
      if (!task) {
        return reply.status(404).send({ message: "Task not found" });
      }

      return { data: task };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Internal Server Error" });
    }
  });

 fastify.post(
    "/:taskId/comments",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { taskId } = req.params as { taskId: string };
      const { content } = req.body as { content: string };
      
      const userId = (req as any).user.id;
      // 🟢 1. Grab the actor's name so the notification says "Ajith mentioned you"
      const userName = (req as any).user.name || "Someone"; 

      try {
        // Calling your flawless service function to save the comment!
        const comment = await taskService.addComment(taskId, content, userId);

        // --- 🟢 2. THE MENTIONS INTERCEPTOR ---
        const mentionRegex = /@\[.*?\]\((.*?)\)/g;
        let match;
        const mentionedUserIds = new Set<string>();

        // Find every User ID hidden in the @[...] text
        while ((match = mentionRegex.exec(content)) !== null) {
          mentionedUserIds.add(match[1]); // match[1] is the extracted ID
        }

        // If we found any mentions, blast out the notifications!
       if (mentionedUserIds.size > 0) {
          const notificationsData = Array.from(mentionedUserIds).map((mentionedId) => ({
            userId: mentionedId, 
            taskId: taskId,      
            // 🟢 THE FIX: Use the strict Prisma Enum instead of a normal string
            type: NotificationType.MENTIONED, 
            content: `${userName} mentioned you in a comment`, 
          }));

          // Bulk insert them to keep the database fast
          await prisma.notification.createMany({
            data: notificationsData,
          });
        }
        // --------------------------------------

        return reply.send({ success: true, data: comment });
      } catch (error) {
        console.error("Failed to post comment:", error); // Helpful for debugging!
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  );

  // 5. Delete a task
  fastify.delete("/:taskId", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    try {
      await taskService.deleteTask(taskId);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ message: "Failed to delete task" });
    }
  });

  // apps/api/src/routes/task/index.ts

  fastify.post("/:taskId/subtasks", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const { title, projectId, creatorId } = request.body as {
      title: string;
      projectId: string;
      creatorId: string; // Send this from the frontend hook
    };

    try {
      const subtask = await taskService.createSubtask(
        taskId,
        title,
        projectId,
        creatorId,
      );
      return { data: subtask };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to create subtask" });
    }
  });

  // Link two tasks together
  fastify.post("/:taskId/dependencies", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const { targetTaskId, type } = request.body as {
      targetTaskId: string;
      type: "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES";
    };

    try {
      const dependency = await taskService.linkTasks(
        taskId,
        targetTaskId,
        type,
      );
      return { data: dependency };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to link tasks" });
    }
  });

  // Add this GET route to handle the search requests
  fastify.get("/project/:projectId/search", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { q, exclude } = request.query as { q?: string; exclude?: string };

    try {
      const tasks = await taskService.searchProjectTasks(
        projectId,
        exclude || "",
        q || "",
      );
      return { data: tasks };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to search tasks" });
    }
  });

  fastify.get("/project/:projectId/epics", async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { exclude } = request.query as { exclude?: string };
    try {
      const epics = await taskService.getProjectEpics(projectId, exclude || "");
      return { data: epics };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to fetch epics" });
    }
  });

  // Inside apps/api/src/routes/task/index.ts

  fastify.put("/:taskId", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const data = request.body as UpdateTaskInput;

    // 1. Get the current user's ID (Assuming you have an auth middleware)
    // If you don't have auth setup yet, you can temporarily hardcode a valid User ID here to test it.
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    try {
      // 2. Pass ALL THREE arguments to the service
      const updatedTask = await taskService.updateTask(taskId, userId, data);
      return { data: updatedTask };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to update task" });
    }
  });

  fastify.get("/:taskId/activity", async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    try {
      const activity = await taskService.getTaskActivity(taskId);
      return { data: activity };
    } catch (error) {
      return reply.status(500).send({ message: "Failed to fetch activity" });
    }
  });

  // POST /tasks/:taskId/links
  // POST /tasks/:taskId/links
fastify.post("/:taskId/links", async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  
  // 🟢 1. Accept all 4 types, and grab 'type' (or 'linkType' fallback) from our Shotgun payload
  const { targetTaskId, type, linkType } = request.body as { 
    targetTaskId: string, 
    type?: "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES",
    linkType?: "BLOCKS" | "IS_BLOCKED_BY" | "RELATES_TO" | "DUPLICATES"
  };

  if (taskId === targetTaskId) return reply.status(400).send({ error: "Cannot link a task to itself." });

  const finalType = type || linkType || "BLOCKS";

  try {
    // 🟢 2. Pass it to your elite service! This handles all the ID flipping and Database typing perfectly.
    const dependency = await taskService.linkTasks(
      taskId,
      targetTaskId,
      finalType
    );
    
    return reply.send({ success: true, data: dependency });
  } catch (error) {
    console.error("Link Error:", error);
    return reply.status(400).send({ error: "Failed to link tasks. Link might already exist." });
  }
});

  // DELETE /tasks/:taskId/links/:targetTaskId
  fastify.delete("/:taskId/links/:targetTaskId", async (request, reply) => {
    const { taskId, targetTaskId } = request.params as {
      taskId: string;
      targetTaskId: string;
    };

    try {
      // Delete the relationship regardless of which direction it was created
      await prisma.taskDependency.deleteMany({
        where: {
          OR: [
            { blockingId: taskId, blockedById: targetTaskId },
            { blockingId: targetTaskId, blockedById: taskId },
          ],
        },
      });
      return reply.send({ success: true });
    } catch (error) {
      return reply.status(500).send({ error: "Failed to remove link" });
    }
  });


  // 🟢 Make sure the URL parameter matches what your other routes use (usually :id or :taskId)
  fastify.post(
    "/:id/attachments", // <-- If your other routes use '/:id', use '/:id' here!
    async (request, reply) => {
      // Grab the ID from the URL params
      const { id } = request.params as { id: string };
      const body = request.body as any;
      
      console.log(`\n🛸 BACKEND HIT: Received attachment for Task: ${id}`);

      try {
        const attachment = await prisma.attachment.create({
          data: {
            name: body.name,
            url: body.url,
            size: body.size.toString(), // Save as string or format to MB
            type: body.type,
            taskId: id, // Link it to the task
          },
        });
        return reply.send({ data: attachment });
      } catch (error) {
        console.error("❌ BACKEND PRISMA ERROR:", error);
        return reply.status(500).send({ error: "Failed to save attachment" });
      }
    }
  );

  // 🟢 TOGGLE WATCHER ROUTE
  fastify.post(
    "/:id/watch",
    // Make sure your requireAuth middleware is here so we know WHO is clicking the button!
    { preHandler: [requireAuth] }, 
    async (request, reply) => {
      const { id: taskId } = request.params as { id: string };
      const userId = (request as any).user.id;

      try {
        // 1. Check if the user is currently watching this task
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { watchers: { where: { id: userId } } }
        });

        if (!task) return reply.status(404).send({ error: "Task not found" });

        const isWatching = task.watchers.length > 0;

        // 2. Toggle the relationship based on their current status
        if (isWatching) {
          // Unwatch: Disconnect the user
          await prisma.task.update({
            where: { id: taskId },
            data: { watchers: { disconnect: { id: userId } } }
          });
          return reply.send({ watching: false });
        } else {
          // Watch: Connect the user
          await prisma.task.update({
            where: { id: taskId },
            data: { watchers: { connect: { id: userId } } }
          });
          return reply.send({ watching: true });
        }
      } catch (error) {
        return reply.status(500).send({ error: "Failed to toggle watcher status" });
      }
    }
  );

  // 🟢 1. GET ALL TASKS FOR A WORKSPACE
  fastify.get(
    "/workspace/:workspaceId",
    { preHandler: [requireAuth] }, // Assuming you use this middleware!
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      
      try {
        const tasks = await prisma.task.findMany({
          where: { 
            project: { workspaceId: workspaceId }
          },
          orderBy: { createdAt: "desc" },
        });
        return reply.code(200).send({ data: tasks });
      } catch (error) {
        return reply.code(500).send({ message: "Failed to fetch workspace tasks", error });
      }
    }
  );

  // 🟢 2. GET ALL TASKS FOR A SPECIFIC PROJECT
 
};

