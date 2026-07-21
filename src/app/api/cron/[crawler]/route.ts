import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

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
  const normalizedCrawler =
    crawler === "kith-monday-program" ? "kith" : crawler === "sole-retriever" ? "soleretriever" : crawler;
  const runner = `${process.cwd()}/scripts/run-crawler.mjs`;

  await execFileAsync(process.execPath, [runner, normalizedCrawler], {
    cwd: process.cwd(),
    env: process.env,
    timeout: Number(process.env.CRAWLER_ROUTE_TIMEOUT_MS || 290_000),
    maxBuffer: 1024 * 1024 * 8,
  });
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
