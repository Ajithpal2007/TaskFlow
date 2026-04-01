


import { buildServer } from "./server.js";


// Load the .env file from the project root.


// As you requested, this log will confirm if the variables are loaded.
console.log(`[api entry] GOOGLE_ID_CHECK: ${process.env.GOOGLE_CLIENT_ID ? "LOADED" : "NOT FOUND"}`);

console.log("🔍 REDIS_URL IS:", process.env.REDIS_URL);


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