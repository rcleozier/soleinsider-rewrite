import { loadEnvFile } from "node:process";
import { defineConfig, env } from "prisma/config";

// Local development reads DATABASE_URL from .env. Hosted builds (Vercel, CI)
// inject env vars directly and ship no .env file, so a missing one is fine.
try {
  loadEnvFile();
} catch {
  // No .env on disk — fall back to the ambient environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
