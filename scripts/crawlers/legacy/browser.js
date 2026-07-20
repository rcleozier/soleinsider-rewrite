const puppeteer = require("puppeteer");

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
