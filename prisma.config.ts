import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

// Local development reads DATABASE_URL from .env. Hosted builds (Vercel, CI)
// inject env vars directly and ship no .env file, so a missing one is fine.
try {
  loadEnvFile();
} catch {
  // No .env on disk — fall back to the ambient environment.
}

// `prisma generate` (run from postinstall) only reads the schema — it never
// connects to a database — but prisma.config's `env()` helper throws immediately
// if DATABASE_URL is unresolved. That turned a missing *build-time* env var into
// a hard install failure. The app's actual runtime connection goes through
// src/lib/prisma.ts, which reads process.env.DATABASE_URL directly and never
// touches this file, so a placeholder here is safe: only `prisma migrate`/
// `prisma studio` would need the real value, and those aren't run at build time.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    path: "prisma/migrations",
  },
});
