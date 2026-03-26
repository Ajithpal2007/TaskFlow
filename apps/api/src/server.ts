import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { authRoutes } from "./routes/users/index.js";

import websocket from "@fastify/websocket";

import { createRouteHandler } from "uploadthing/fastify";
import { ourFileRouter } from "./lib/uploadthing";

export async function buildServer() {
  const fastify = Fastify({
    logger:
      process.env.NODE_ENV !== "production"
        ? { transport: { target: "pino-pretty" } }
        : true,
  });

  await fastify.register(websocket);

  // 🟢 Add this Global Test Route to bypass all middleware!
  fastify.get("/ws-test", { websocket: true }, (connection, request) => {
    console.log("🟢 GLOBAL WS TEST HIT!");
    connection.send("Hello from the Global Bypass Route!");

    connection.on("message", (msg) => {
      console.log("Global received:", msg.toString());
    });
  });

  await fastify.register(cors, {
    origin: "http://localhost:3000",
    credentials: true, // Crucial for sharing sessions between ports
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Origin",
      "Accept",
      "Content-Type",
      "Authorization",
      "Cookie",
      "x-requested-with",
      "x-uploadthing-package",
      "x-uploadthing-version",
      "traceparent",
      "tracestate",
      "b3",
      "x-b3-traceid",
      "x-b3-spanid",
      "x-b3-sampled",
    ],
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  });

  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  fastify.get("/", async (request, reply) => {
    // When Google OAuth drops them on localhost:4000, 
    // instantly ping them back to localhost:3000/dashboard
    return reply.redirect("http://localhost:3000/dashboard");
  });

  // Routes will be registered here as you build them
  await fastify.register(authRoutes);

  fastify.register(createRouteHandler, {
    router: ourFileRouter,
  });

  await fastify.register(import("./routes/workspaces/index.js"), {
    prefix: "/api/workspaces",
  });
  await fastify.register(import("./routes/projects/index.js"), {
    prefix: "/api/projects",
  });

  await fastify.register(import("./routes/task/index.js"), {
    prefix: "/api/tasks",
  });

  await fastify.register(import("./routes/notification/index.js"), {
    prefix: "/api/notifications",
  });

  await fastify.register(import("./routes/ai/index.js"), {
    prefix: "/api/ai",
  });

 

  return fastify;
}

