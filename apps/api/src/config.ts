import { config } from "dotenv";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

// This block of code reliably finds the root .env file
// It works by getting the path of the current file (config.ts)
// and then navigating three directories up to the project root.
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", "..", "..", ".env");

config({ path: envPath });

// These logs will now appear and confirm if the variables are loaded
console.log(`[api config] Attempting to load .env from: ${envPath}`);
console.log(`[api config] DATABASE_URL is: ${process.env.DATABASE_URL ? "Loaded" : "NOT LOADED"}`);
console.log(`[api config] GOOGLE_CLIENT_ID is: ${process.env.GOOGLE_CLIENT_ID ? "Loaded" : "NOT LOADED"}`);