import { prisma } from "@repo/database";
import crypto from "crypto";

export const seedOnboardingData = async (userId: string, userName: string) => {
  // 1. Generate a unique slug for the URL (e.g., "ajith-workspace-a1b2")
  const baseSlug = (userName || "user").toLowerCase().replace(/[^a-z0-9]/g, "-");
  const uniqueSlug = `${baseSlug}-workspace-${crypto.randomBytes(2).toString("hex")}`;

  console.log(`[Onboarding] Seeding demo workspace for ${userName}...`);

  // 2. We use a Prisma Transaction so it all builds perfectly at the exact same time
  const workspace = await prisma.$transaction(async (tx) => {
    
    // A. Create Workspace & Add User as OWNER
    const newWorkspace = await tx.workspace.create({
      data: {
        name: `${userName}'s Workspace`,
        slug: uniqueSlug,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
    });

    // B. Create Default "#general" Chat Channel
    await tx.channel.create({
      data: {
        name: "general",
        description: "General discussion and announcements.",
        type: "GROUP",
        workspaceId: newWorkspace.id,
        members: {
          create: { userId, role: "OWNER" },
        },
      },
    });

    // C. Create the Demo Project
    const demoProject = await tx.project.create({
      data: {
        name: "Welcome to TaskFlow",
        identifier: "DEMO", // Tasks will be DEMO-1, DEMO-2
        description: "A sandbox project to help you learn the ropes.",
        workspaceId: newWorkspace.id,
        members: {
          create: { userId, role: "MANAGER" },
        },
      },
    });

    // D. Create 3 Interactive Dummy Tasks
    await tx.task.createMany({
      data: [
        {
          title: "👋 Welcome to TaskFlow! Click me.",
          description: "This is your first task. You can assign users, set due dates, and add subtasks here.",
          status: "TODO",
          priority: "HIGH",
          sequenceId: 1, // DEMO-1
          projectId: demoProject.id,
          creatorId: userId,
          assigneeId: userId, // Assign it to them so it shows up on their Dashboard!
        },
        {
          title: "Drag this task to 'In Progress'",
          description: "Try moving this card across the Kanban board to update its status.",
          status: "TODO",
          priority: "MEDIUM",
          sequenceId: 2, // DEMO-2
          projectId: demoProject.id,
          creatorId: userId,
        },
        {
          title: "Invite a teammate to collaborate",
          description: "TaskFlow is better with a team. Click the Invite button in the top right.",
          status: "IN_PROGRESS",
          priority: "LOW",
          sequenceId: 3, // DEMO-3
          projectId: demoProject.id,
          creatorId: userId,
        },
      ],
    });

    // E. Create a "Getting Started" Document
    // Using a very basic JSON structure that BlockNote can read
    const defaultDocContent = [
      { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "🚀 Getting Started", styles: {} }] },
      { type: "paragraph", content: [{ type: "text", text: "Welcome to your first document! You can type '/ ' to see formatting options.", styles: {} }] }
    ];

    await tx.document.create({
      data: {
        title: "🚀 Getting Started",
        content: defaultDocContent,
        emoji: "🚀",
        workspaceId: newWorkspace.id,
        projectId: demoProject.id,
        authorId: userId,
        visibility: "PUBLIC",
      },
    });

    return newWorkspace;
  });

  console.log(`✅ Onboarding complete. Workspace ${workspace.name} created.`);
  return workspace;
};