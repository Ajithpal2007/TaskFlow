import { buildServer } from "./server.js";


const PORT = Number(process.env.PORT || process.env.API_PORT || 4000);

async function start() {
  try {
    const server = await buildServer();
    // Listening on 0.0.0.0 is perfect for Docker/Render!
    await server.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 API running on port ${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();