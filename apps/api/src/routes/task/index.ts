import { FastifyInstance } from "fastify";
import { createTaskSchema, UpdateTaskInput, updateTaskSchema } from "@repo/validators";
import { taskService } from "../../services/task.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { prisma } from "@repo/database";


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
        const updatedTask = await taskService.updateTask(taskId, userId, result.data);
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

 

fastify.post("/:taskId/comments", { preHandler: [requireAuth] }, async (req, reply) => {
  const { taskId } = req.params as { taskId: string };
  const { content } = req.body as { content: string };
  const userId = (req as any).user.id; 

  try {
    // Calling your flawless service function!
    const comment = await taskService.addComment(taskId, content, userId);
    return reply.send({ success: true, data: comment });
  } catch (error) {
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

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
fastify.post("/:taskId/links", async (request, reply) => {
  const { taskId } = request.params as { taskId: string };
  const { targetTaskId, linkType } = request.body as { targetTaskId: string, linkType: "BLOCKS" | "IS_BLOCKED_BY" };

  if (taskId === targetTaskId) return reply.status(400).send({ error: "Cannot link a task to itself." });

  // The Magic Logic: Figure out who is blocking who
  const blockingId = linkType === "BLOCKS" ? taskId : targetTaskId;
  const blockedById = linkType === "BLOCKS" ? targetTaskId : taskId;

  try {
    const dependency = await prisma.taskDependency.create({
      data: { blockingId, blockedById }
    });
    return reply.send({ success: true, data: dependency });
  } catch (error) {
    return reply.status(400).send({ error: "Link already exists." });
  }
});

// DELETE /tasks/:taskId/links/:targetTaskId
fastify.delete("/:taskId/links/:targetTaskId", async (request, reply) => {
  const { taskId, targetTaskId } = request.params as { taskId: string, targetTaskId: string };

  try {
    // Delete the relationship regardless of which direction it was created
    await prisma.taskDependency.deleteMany({
      where: {
        OR: [
          { blockingId: taskId, blockedById: targetTaskId },
          { blockingId: targetTaskId, blockedById: taskId }
        ]
      }
    });
    return reply.send({ success: true });
  } catch (error) {
    return reply.status(500).send({ error: "Failed to remove link" });
  }
});

}
