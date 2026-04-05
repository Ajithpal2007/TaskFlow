import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/require-auth.js";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { requireWorkspaceRole } from "@/middleware/require-role.js";
import { requirePlan } from "@/middleware/require-plan.js";

// --- LangChain & Zod (For Structured Subtasks) ---
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { prisma } from "@repo/database";
import { taskService } from "@services/task.service.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Configure the AI provider to use Groq's Llama 3
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export default async function aiRoutes(fastify: FastifyInstance) {
  // 🟢 THE MISSING DOOR: We restored the actual POST route!
  fastify.post(
    "/:workspaceId/generate-task",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"]),
        requirePlan(["PRO", "ENTERPRISE"]),
      ],
      config: {
        rateLimit: {
          max: 5, // Only 5 AI generations...
          timeWindow: "1 minute", // ...per minute
        },
      },
    },
    async (request, reply) => {
      // Extract the prompt from the request body
      const { prompt } = request.body as { prompt: string };

      if (!prompt) {
        return reply.status(400).send({ error: "Prompt is required" });
      }

      try {
        const result = await streamText({
          model: groq("llama-3.1-8b-instant"),
          system:
            "You are a technical product manager. Write a professional ticket description. You MUST output entirely in HTML format using <p>, <strong>, <ul>, and <li> tags. Do NOT use markdown. Do NOT wrap the response in ```html blocks.",
          prompt: prompt,
          temperature: 0.5,
        });

        const origin = process.env.FRONTEND_URL || "http://localhost:3000";

        // 1. Send the correct headers so CORS and Chrome are happy
        reply.raw.writeHead(200, {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        });

        for await (const textPart of result.textStream) {
          reply.raw.write(textPart);
        }

        reply.raw.end();
        return reply; // Tell Fastify we manually handled the response
      } catch (error) {
        console.error("AI Generation Error:", error);
        return reply
          .status(500)
          .send({ error: "Failed to generate task description" });
      }
    },
  );

  fastify.post(
    "/:workspaceId/generate-subtasks",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"]),
        requirePlan(["PRO", "ENTERPRISE"]),
      ],
      config: {
        rateLimit: { max: 5, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      // 🟢 1. DEFINING PROJECT ID & OTHERS (This fixes the TS error!)
      const { taskId, title, description, projectId } = request.body as {
        taskId: string;
        title: string;
        description?: string;
        projectId: string;
      };

      // 🟢 2. DEFINING CREATOR ID (This fixes the TS error!)
      const creatorId = (request as any).user.id;

      if (!taskId || !title || !projectId) {
        return reply
          .status(400)
          .send({ error: "Task ID, Title, and Project ID are required" });
      }

      try {
        const model = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
        });

        const subtaskSchema = z.object({
          subtasks: z
            .array(
              z.object({
                title: z
                  .string()
                  .describe("A short, actionable title for the subtask"),
              }),
            )
            .max(5)
            .describe("A list of up to 5 logical subtasks"),
        });

        const structuredModel = model.withStructuredOutput(subtaskSchema, {
          name: "subtask_generator",
        });

        const prompt = PromptTemplate.fromTemplate(`
          You are an expert project manager. Break down the following task into 3 to 5 actionable subtasks.
          Keep the subtask titles brief and focused.

          Task Title: {title}
          Description: {description}
        `);

        const chain = prompt.pipe(structuredModel);
        const result = await chain.invoke({
          title,
          description: description || "No description provided.",
        });

        // 🟢 3. CREATING THE SUBTASKS
        const createdSubtasks = [];
        for (const st of result.subtasks) {
          // TypeScript now knows exactly what taskId, title, projectId, and creatorId are!
          const newSubtask = await taskService.createSubtask(
            taskId,
            st.title,
            projectId,
            creatorId,
          );
          createdSubtasks.push(newSubtask);
        }

        return reply.send({
          success: true,
          count: createdSubtasks.length,
          subtasks: createdSubtasks,
        });
      } catch (error) {
        console.error("LangChain Subtask Error:", error);
        return reply.status(500).send({ error: "Failed to generate subtasks" });
      }
    },
  );

  fastify.post(
    "/:workspaceId/editor-assist",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole(["OWNER", "ADMIN", "MEMBER"]),
        requirePlan(["PRO", "ENTERPRISE"]),
      ],
      config: {
        rateLimit: { max: 20, timeWindow: "1 minute" }, // Slightly higher limit for frequent editor usage
      },
    },
    async (request, reply) => {
      const { command, contextText } = request.body as {
        command: string;
        contextText: string;
      };

      if (!command) {
        return reply.status(400).send({ error: "Command is required" });
      }

      // 1. Initialize LangChain with a slightly higher temperature for better writing
      const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.1-8b-instant",
        temperature: 0.6,
      });

      const parser = new StringOutputParser();
      // 🟢 1. PROMPT ENGINEERING: Map quick actions to elite AI instructions
      let optimizedInstruction = command; // Defaults to the user's custom text input

      switch (command) {
        case "improve":
          optimizedInstruction =
            "Rewrite the provided text to make it more professional, articulate, and engaging. Improve the flow and vocabulary.";
          break;
        case "fix_grammar":
          optimizedInstruction =
            "Fix all spelling, punctuation, and grammatical errors in the provided text. Do not change the original meaning or tone.";
          break;
        case "summarize":
          optimizedInstruction =
            "Provide a concise, easy-to-read summary of the provided text. Extract the core points.";
          break;
        case "translate":
          optimizedInstruction =
            "Translate the provided text into English. If it is already in English, translate it into Spanish."; // You can adjust this later!
          break;
        case "continue_writing":
          optimizedInstruction =
            "Continue writing the text naturally. Read the context and seamlessly add the next logical paragraph.";
          break;
      }

      // 🟢 2. INJECT THE OPTIMIZED INSTRUCTION
      const prompt = PromptTemplate.fromTemplate(`
        You are an elite AI writing assistant embedded directly inside a document editor.
        
        YOUR TASK: {instruction}
        
        CONTEXT / SELECTED TEXT:
        """
        {contextText}
        """
        
        Provide the requested output directly. 
        CRITICAL: Do NOT include conversational filler like "Here is the rewritten text:" or "Sure, I can help."
        Just output the raw text. Do NOT wrap it in markdown code blocks unless the user explicitly asked for code.
      `);
      const chain = prompt.pipe(model).pipe(parser);

      const origin = process.env.FRONTEND_URL || "http://localhost:3000";

      // 🟢 3. The SSE Streaming Headers (Keep these exactly the same)
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
      });

      try {
        // 🟢 4. Pass the new instruction variable to the stream!
        const stream = await chain.stream({
          instruction: optimizedInstruction,
          contextText: contextText || "No context provided.",
        });

        for await (const chunk of stream) {
          reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        reply.raw.write(`data: [DONE]\n\n`);
        reply.raw.end();
        return reply;
      } catch (error) {
        console.error("Editor AI Streaming Error:", error);
        reply.raw.write(
          `data: ${JSON.stringify({ error: "AI Generation failed." })}\n\n`,
        );
        reply.raw.end();
        return reply;
      }
    },
  );
}

