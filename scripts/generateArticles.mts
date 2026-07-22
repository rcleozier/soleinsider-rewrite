import { loadEnvFile } from "node:process";

try {
  loadEnvFile();
} catch {
  // No .env on disk — fine on hosted runners that inject env vars directly.
}

// Dynamic import, deliberately: static `import` statements evaluate before
// this file's own top-level code runs, so src/lib/prisma.ts would construct
// its client (reading process.env.DATABASE_URL) before loadEnvFile() above
// ever ran, silently falling back to a local Postgres default.
const { generateArticles } = await import("../src/lib/articleGenerator");
type ArticleCategory = import("../src/lib/articleTopics").ArticleCategory;

const args = process.argv.slice(2);
const countArg = args.find((arg) => arg.startsWith("--count="));
const categoryArg = args.find((arg) => arg.startsWith("--category="));

const count = countArg ? Number(countArg.split("=")[1]) : 3;
const category = categoryArg?.split("=")[1] as ArticleCategory | undefined;

if (!Number.isFinite(count) || count < 1) {
  console.error("Usage: npm run articles:generate -- --count=3 [--category=sports|authentication|lifestyle]");
  process.exit(1);
}

if (category && !["sports", "authentication", "lifestyle"].includes(category)) {
  console.error(`Unknown category "${category}". Use sports, authentication, or lifestyle.`);
  process.exit(1);
}

console.log(`Generating ${count} article(s)${category ? ` in "${category}"` : ""}...`);

const results = await generateArticles({ count, category });

if (!results.length) {
  console.log("No unused topics available — every seeded topic has already been published.");
  process.exit(0);
}

let failures = 0;

for (const result of results) {
  if (result.success) {
    console.log(`  ✓ [${result.topic.category}] ${result.topic.subject} — ${result.topic.angle} (article #${result.articleId})`);
  } else {
    failures += 1;
    console.error(`  ✗ [${result.topic.category}] ${result.topic.subject} — ${result.topic.angle}: ${result.error}`);
  }
}

console.log(`Done: ${results.length - failures} created, ${failures} failed.`);
process.exit(failures ? 1 : 0);
