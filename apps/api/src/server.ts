import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { authRoutes } from "./routes/users/index.js";

import websocket from "@fastify/websocket";

import { createRouteHandler } from "uploadthing/fastify";
import { ourFileRouter } from "./lib/uploadthing";

import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { prisma } from "@repo/database";

import fastifyRawBody from "fastify-raw-body";
import fastifyRateLimit from "@fastify/rate-limit";
import { redisConnection } from "./lib/queue";

import stripeWebhookRoute from "./routes/webhooks/stripe";

import "./workers/notificationWorker";
import "./workers/emailWorker";
import "./workers/canvasWorker";
import "./workers/cleanupWorker";

export async function buildServer() {
  const fastify = Fastify({
    trustProxy: true,
    logger:
      process.env.NODE_ENV !== "production"
        ? { transport: { target: "pino-pretty" } }
        : {
            level: "info",
            transport: {
              target: "pino-loki",
              options: {
                batching: true,
                interval: 5,
                host: process.env.GRAFANA_LOKI_URL,
                basicAuth: {
                  username: process.env.GRAFANA_LOKI_USER,
                  password: process.env.GRAFANA_API_TOKEN,
                },
                labels: { application: "taskflow-backend" }, // Tags all logs in Grafana!
              },
            },
          },
  });

  // Call this right before fastify.listen()

  await fastify.register(websocket);

  fastify.register(fastifyRateLimit, {
    global: true, // 🟢 ON BY DEFAULT FOR ALL ROUTES
    max: 150, // 150 requests...
    timeWindow: "1 minute", // ...per minute
    redis: redisConnection,
    errorResponseBuilder: (request, context) => ({
      success: false,
      message: `Whoa there! You're moving too fast. Please wait ${context.after}.`,
    }),
  });

  await fastify.register(fastifyRawBody, {
    field: "rawBody", // This adds request.rawBody
    global: false, // We only want to use this on specific webhook routes
    encoding: "utf8",
  });

  // 🟢 Add this Global Test Route to bypass all middleware!
  fastify.get("/ws-test", { websocket: true }, (connection, request) => {
    console.log("🟢 GLOBAL WS TEST HIT!");
    connection.send("Hello from the Global Bypass Route!");

    connection.on("message", (msg) => {
      console.log("Global received:", msg.toString());
    });
  });

  const hocuspocusServer = new Hocuspocus({
    extensions: [
      new Database({
        // A. FETCH: Get Yjs state from Postgres
        fetch: async ({ documentName }) => {
          const doc = await prisma.document.findUnique({
            where: { id: documentName },
            select: { yjsState: true },
          });
          // Ensure you return a Uint8Array or null
          return doc?.yjsState ? new Uint8Array(doc.yjsState) : null;
        },

        // B. STORE: Save binary state to Postgres
        store: async ({ documentName, state }) => {
          await prisma.document.update({
            where: { id: documentName },
            data: {
              // Prisma handles Buffer/Uint8Array for Bytes fields
              yjsState: Buffer.from(state),
              updatedAt: new Date(),
            },
          });
        },
      }),
    ],
  });

  // 2. Fastify WebSocket Route
  // Note: In newer @fastify/websocket, the first arg is the 'socket' directly
  fastify.get("/api/collaboration", { websocket: true }, (socket, request) => {
    // Pass the socket and the raw internal Node request to Hocuspocus
    hocuspocusServer.handleConnection(socket, request.raw);
  });

  await fastify.register(cors, {
    origin: true,
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
    // Dynamically redirect to Vercel in production, or localhost in development
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return reply.redirect(`${frontendUrl}/dashboard`);
  });

  // Routes will be registered here as you build them
  await fastify.register(authRoutes);

  fastify.register(createRouteHandler, {
    router: ourFileRouter,
  });

  fastify.register(stripeWebhookRoute, { prefix: "/api/webhooks" });

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

  await fastify.register(import("./routes/documents/index.js"), {
    prefix: "/api",
  });

  await fastify.register(import("./routes/search/index.js"), {
    prefix: "/api/search",
  });

  await fastify.register(import("./routes/chat/index.js"), {
    prefix: "/api/chat",
  });

  await fastify.register(import("./routes/calls/index.js"), {
    prefix: "/api/calls",
  });

  await fastify.register(import("./routes/canvas/index.js"), {
    prefix: "/api/canvas",
  });

  await fastify.register(import("./routes/billing/index.js"), {
    prefix: "/api",
  });

  await fastify.register(import("./routes/integrations/slack.js"), {
    prefix: "/api/integrations/slack",
  });

  await fastify.register(import("./routes/api/zapier.js"), {
    prefix: "/api/external/zapier",
  });

  return fastify;
}

