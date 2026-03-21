// apps/api/src/env.ts
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Go up 3 levels to reach the root .env
const envPath = join(__dirname, "..", "..", "..", ".env");

config({ path: envPath });

console.log("✅ Environment Variables Initialized");