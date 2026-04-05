import type { FastifyInstance } from "fastify";
import { toNodeHandler } from "better-auth/node";

import { auth } from "auth";
import { userService } from "../../services/user.service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { updateUserSchema } from "@repo/validators";

export async function authRoutes(fastify: FastifyInstance) {
  // Register a sub-plugin for the raw auth routes
  fastify.register(async function (fastify) {
    fastify.addContentTypeParser("application/json", (req, payload, done) => {
      done(null, payload);
    });

    fastify.all("/api/auth/*", async (req, reply) => {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      // Add headers manually to EVERY request to be safe
      reply.raw.setHeader(
        "Access-Control-Allow-Origin",
        frontendUrl,
      );
      reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
      reply.raw.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      reply.raw.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Cookie",
      );

      if (req.method === "OPTIONS") {
        reply.raw.statusCode = 204;
        reply.raw.end();
        return;
      }

      return toNodeHandler(auth)(req.raw, reply.raw);
    });
  });

  // The user routes are outside the plugin above, so they use the default JSON parser
  fastify.patch(
    "/api/users/me",
    {
      preHandler: requireAuth,
      config: {
        rateLimit: {
          max: 10, // Max 10 profile updates...
          timeWindow: "1 minute", // ...per 1 minute window
        },
      },
    },
    async (req, reply) => {
      // 1. Validate the body using the shared schema
      const result = updateUserSchema.safeParse(req.body);

      if (!result.success) {
        return reply.status(400).send({ error: result.error.format() });
      }

      // 2. Map 'image' from the schema to whatever your frontend calls it (avatar/image)
      // Your schema used 'image' to match Prisma, but your req.body uses 'avatar'
      const user = await userService.updateUser(req.user.id, {
        name: result.data.name,
        image: result.data.image, // result.data is already cleaned by Zod
      });

      return { data: user };
    },
  );
}
