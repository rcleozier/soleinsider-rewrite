/* eslint-disable */
// puppeteer-extra + stealth: several crawl targets (kicksonfire.com in
// particular) sit behind Cloudflare's bot challenge, which fingerprints and
// blocks plain headless Chrome (navigator.webdriver, missing GPU/canvas
// signals, etc.) before it ever reaches the real page. The stealth plugin
// patches those tells; plain puppeteer.launch() gets served a "Just a
// moment..." challenge page instead of real HTML.
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

let chromium = null;
try {
  chromium = require("@sparticuz/chromium");
} catch (_) {
  chromium = null;
}

const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

async function launchBrowser(extra = {}) {
  const baseArgs = ["--no-sandbox", "--disable-setuid-sandbox"];

  if (isVercel && chromium) {
    const executablePath = await chromium.executablePath();
    return puppeteer.launch({
      headless: true,
      executablePath,
      args: [...chromium.args, ...baseArgs],
      defaultViewport: chromium.defaultViewport || { width: 1280, height: 800 },
      ignoreHTTPSErrors: true,
      ...extra,
    });
  }

  return puppeteer.launch({
    headless: true,
    args: baseArgs,
    ignoreHTTPSErrors: true,
    ...extra,
  });
}

module.exports = { launchBrowser };
