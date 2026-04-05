import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  clean: true,
  
  // 🟢 THE FIX: Remove the wildcard regex! 
  // Explicitly list ONLY the local packages you actually want to bundle.
  noExternal: ["auth", "@repo/validators"], 
  
  // Now, tsup will actually respect this rule and leave Prisma alone!
  external: ["@repo/database"], 
});