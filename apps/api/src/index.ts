


import { buildServer } from "./server.js";






const PORT = Number(process.env.API_PORT ?? 4000);

// Call this right before fastify.listen()
 

async function start() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 API running on http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();