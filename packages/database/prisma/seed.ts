import {  WorkspaceRole, ProjectRole, TaskStatus, TaskPriority, TaskType } from "@prisma/client";
import { prisma } from "../src/client";

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. Create/Update a Demo User
  // Using your name from your profile!
  const user = await prisma.user.upsert({
    where: { email: "nisha@csmu.edu.in" }, 
    update: {},
    create: {
      email: "nisha@csmu.edu.in",
      name: "Nisha",
      image: "https://github.com/shadcn.png",
    },
  });

  // 2. Create a Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "korevix" },
    update: {},
    create: {
      name: "Korevix",
      slug: "korevix",
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  // 3. Create a Project
  const project = await prisma.project.create({
    data: {
      name: "TaskFlow MVP",
      identifier: "TFK",
      workspaceId: workspace.id,
      members: {
        create: {
          userId: user.id,
          role: ProjectRole.MANAGER,
        },
      },
    },
  });

  // 4. Create Initial Tasks (The Kanban Seed)
  const taskData = [
    {
      title: "Setup Monorepo Architecture",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      sequenceId: 1,
    },
    {
      title: "Implement Better Auth with Fastify",
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      sequenceId: 2,
    },
    {
      title: "Design Enterprise Prisma Schema",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      sequenceId: 3,
    },
    {
      title: "Build Kanban Board with dnd-kit",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      sequenceId: 4,
    },
  ];

  for (const t of taskData) {
    await prisma.task.create({
      data: {
        ...t,
        projectId: project.id,
        creatorId: user.id,
        assigneeId: user.id,
        type: TaskType.TASK,
      },
    });
  }

  console.log("✅ Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });