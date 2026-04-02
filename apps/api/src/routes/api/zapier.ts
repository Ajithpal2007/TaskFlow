import { FastifyPluginAsync } from "fastify";
import { prisma } from "@repo/database";
import { z } from "zod";

const zapierRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/tasks", async (request, reply) => {
    let rawKey = (
      request.headers["x-api-key"] || 
      request.headers["x-x-api-key"] || 
      (request.query as any)["x-api-key"]
    ) as string;
    
    if (!rawKey) {
      return reply.status(401).send({ error: "Missing API Key" });
    }

    const cleanKey = rawKey.trim().replace(/['"()]/g, "");

    // 🟢 UPDATE: We now fetch the workspace AND its owner so we have a 'creatorId'
    const workspace = await prisma.workspace.findUnique({
      where: { apiKey: cleanKey },
      include: {
        members: {
          where: { role: "OWNER" }, // Find the owner of the workspace
          take: 1,
        }
      }
    });

    if (!workspace || workspace.members.length === 0) {
      return reply.status(401).send({ error: "Invalid API Key or Workspace setup" });
    }

    const defaultCreatorId = workspace.members[0].userId; // The robot will use the owner's ID

    // 2. Validate the incoming data from Zapier
    const zapierTaskSchema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      projectId: z.string(),
    });

    const parsed = zapierTaskSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    // 🟢 NEW: Calculate the next sequenceId for this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { sequenceId: "desc" },
    });
    const nextSequenceId = (lastTask?.sequenceId || 0) + 1;

    // 3. Create the task in the database!
    const newTask = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        projectId: parsed.data.projectId,
        status: "TODO",
        sequenceId: nextSequenceId, // 🟢 Added Sequence ID
        creatorId: defaultCreatorId, // 🟢 Added Creator ID
      }
    });

    // 4. Return the new task to Zapier
    return reply.status(201).send(newTask);
  });

  // 🟢 ZAPIER AUTH TEST: Verify the API Key is valid
 // 🟢 ZAPIER AUTH TEST (Bulletproof Version)
  fastify.get("/me", async (request, reply) => {
    // 1. Check everywhere (Headers AND Query Params)
    let rawKey = (
      request.headers["x-api-key"] || 
      request.headers["x-x-api-key"] || 
      (request.query as any)["x-api-key"]
    ) as string;

    if (!rawKey) {
      console.log("\n❌ ZAPIER: No key provided by Zapier!");
      return reply.status(401).send({ error: "Missing API Key" });
    }

    // 2. Scrub the key clean (removes spaces, tabs, and accidental quotes)
    const cleanKey = rawKey.trim().replace(/['"()]/g, "");

    console.log(`\n🔍 --- ZAPIER AUTH TEST ---`);
    console.log(`➡️ Extracted Key: "${cleanKey}"`);

    // 3. Ask the database
    const workspace = await prisma.workspace.findFirst({
      where: { apiKey: cleanKey },
    });

    if (!workspace) {
      console.log(`❌ ZAPIER FAILED: Key "${cleanKey}" does NOT exist in the connected database!`);
      console.log(`   (Tip: Check if you are connected to the right Neon branch in your .env)`);
      return reply.status(401).send({ error: "Invalid API Key" });
    }

    // 4. Success!
    console.log(`✅ ZAPIER SUCCESS: Workspace found -> ${workspace.name}\n`);
    return reply.status(200).send({ workspace: workspace.name });
  });


};

export default zapierRoutes;