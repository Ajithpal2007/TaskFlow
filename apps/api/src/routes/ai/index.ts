import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/require-auth.js";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { requireWorkspaceRole } from "@/middleware/require-role.js";
import { requirePlan } from "@/middleware/require-plan.js";

// Configure the AI provider to use Groq's Llama 3
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export default async function aiRoutes(fastify: FastifyInstance) {
  // 🟢 THE MISSING DOOR: We restored the actual POST route!
  fastify.post(
    "/generate-task",
    {
      preHandler: [
        requireAuth,
        requireWorkspaceRole(["ADMIN", "MEMBER"]),
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

        // 1. Send the correct headers so CORS and Chrome are happy
        reply.raw.writeHead(200, {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "http://localhost:3000",
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
}

