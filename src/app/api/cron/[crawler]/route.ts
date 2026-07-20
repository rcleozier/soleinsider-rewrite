import path from "node:path";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const require = createRequire(import.meta.url);

const crawlers = {
  kith: "kithMondayProgram.js",
  "kith-monday-program": "kithMondayProgram.js",
  supdrops: "supdrops.js",
  nicekicks: "niceKicks.js",
  soleretriever: "soleRetrieverPuppeteer.js",
  "sole-retriever": "soleRetrieverPuppeteer.js",
  kicksonfire: "kicksonfirePuppiteer.js",
} as const;

type CrawlerName = keyof typeof crawlers;

type CronRouteProps = {
  params: Promise<{
    crawler: string;
  }>;
};

export async function GET(request: Request, { params }: CronRouteProps) {
  return runCron(request, (await params).crawler);
}

export async function POST(request: Request, { params }: CronRouteProps) {
  return runCron(request, (await params).crawler);
}

async function runCron(request: Request, crawler: string) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isCrawlerName(crawler)) {
    return Response.json(
      {
        success: false,
        error: "Unknown crawler.",
        available: Object.keys(crawlers),
      },
      { status: 404 },
    );
  }

  const startedAt = Date.now();
  const ingestUrl = new URL("/public/ingest/saveRelease", request.url).toString();
  process.env.SOLEINSIDER_INGEST_URL = ingestUrl;

  if (process.env.CRON_SECRET && !process.env.CRAWLER_INGEST_SECRET) {
    process.env.CRAWLER_INGEST_SECRET = process.env.CRON_SECRET;
  }

  try {
    await runCrawler(crawler);

    return Response.json({
      success: true,
      crawler,
      ingestUrl,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        crawler,
        error: error instanceof Error ? error.message : "Crawler failed.",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

async function runCrawler(crawler: CrawlerName) {
  const filePath = path.join(process.cwd(), "scripts", "crawlers", "legacy", crawlers[crawler]);
  const module = require(filePath) as {
    run: (url?: string, page?: number) => Promise<unknown> | void;
  };

  if (crawler !== "kicksonfire") {
    await module.run();
    return;
  }

  const startPage = Number(process.env.KICKSONFIRE_START_PAGE || 1);
  const pages = Number(process.env.KICKSONFIRE_PAGES || 3);
  const waitMs = Number(process.env.KICKSONFIRE_PAGE_WAIT_MS || 60_000);

  for (let offset = 0; offset < pages; offset += 1) {
    const page = startPage + offset;
    const url = `https://www.kicksonfire.com/sneaker-release-dates?page=${page}`;
    module.run(url, page);
    await delay(waitMs);
  }
}

function isCrawlerName(crawler: string): crawler is CrawlerName {
  return crawler in crawlers;
}

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return (
    request.headers.get("x-cron-secret") === secret ||
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
