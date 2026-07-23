import path from "node:path";
import { createRequire } from "node:module";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

loadEnvFile();

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] || "all";
const crawlerFiles = {
  kith: "kithMondayProgram.js",
  supdrops: "supdrops.js",
  nicekicks: "niceKicks.js",
  soleretriever: "soleRetrieverPuppeteer.js",
  kicksonfire: "kicksonfirePuppiteer.js",
};

const selected =
  source === "all"
    ? ["kith", "supdrops", "nicekicks", "soleretriever", "kicksonfire"]
    : [source];

for (const crawler of selected) {
  if (!crawlerFiles[crawler]) {
    console.error(`Unknown crawler "${crawler}". Available: ${Object.keys(crawlerFiles).join(", ")}`);
    process.exitCode = 1;
    continue;
  }

  console.log(`Starting ${crawler} crawler...`);

  try {
    await runCrawler(crawler);
  } catch (error) {
    console.error(`${crawler} crawler failed:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

async function runCrawler(crawler) {
  const crawlerModule = require(path.join(root, "scripts", "crawlers", "legacy", crawlerFiles[crawler]));

  if (crawler !== "kicksonfire") {
    await crawlerModule.run();
    return;
  }

  const startPage = Number(process.env.KICKSONFIRE_START_PAGE || 1);
  const pages = Number(process.env.KICKSONFIRE_PAGES || 3);
  const waitMs = Number(process.env.KICKSONFIRE_PAGE_WAIT_MS || 60_000);

  for (let offset = 0; offset < pages; offset += 1) {
    const page = startPage + offset;
    const url = `https://www.kicksonfire.com/sneaker-release-dates?page=${page}`;
    crawlerModule.run(url, page);
    await delay(waitMs);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
