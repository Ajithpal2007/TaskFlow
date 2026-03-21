import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { authRoutes } from "./routes/users/index.js";

export async function buildServer() {
  const fastify = Fastify({
    logger:
      process.env.NODE_ENV !== "production"
        ? { transport: { target: "pino-pretty" } }
        : true,
  });

  await fastify.register(cors, {
    origin: "http://localhost:3000",
    credentials: true, // Crucial for sharing sessions between ports
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "x-requested-with",
    ],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // Routes will be registered here as you build them
  await fastify.register(authRoutes);

  await fastify.register(import("./routes/workspaces/index.js"), {
    prefix: "/api/workspaces",
  });
  await fastify.register(import("./routes/projects/index.js"), {
    prefix: "/api/projects",
  });

  await fastify.register(import("./routes/task/index.js"), {
  prefix: "/api/tasks", 
});

  return fastify;
}
