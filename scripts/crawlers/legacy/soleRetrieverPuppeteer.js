/* eslint-disable */
const cheerio = require("cheerio");
const axios = require("axios");
const md5 = require("md5");
const querystring = require("querystring");
const { launchBrowser } = require("./browser");

// Set SOLERETRIEVER_TEST_MODE=1 in env to log payloads without sending
const TEST_MODE = process.env.SOLERETRIEVER_TEST_MODE === "1";
const MAX_ITEMS = Number(process.env.SOLERETRIEVER_MAX_ITEMS || 30);

exports.run = async function () {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const BASE_URL = "https://www.soleretriever.com";
  const START_URL = `${BASE_URL}/sneaker-release-dates`;

  const isLikelyDetailPath = (href = "") => {
    const path = href.replace(/^https?:\/\/[^/]+/i, "");
    const parts = path.split("/").filter(Boolean);
    if (parts[0] !== "sneaker-release-dates") return false;
    if (parts.length < 4) return false;
    const slug = parts[parts.length - 1] || "";
    return slug.length >= 8 && /-/.test(slug);
  };

  const isValidReleaseDate = (value = "") => {
    if (!value || !value.trim()) return false;
    if (/^0|1970/i.test(value.trim())) return false;
    const ts = Date.parse(value);
    if (Number.isNaN(ts)) return false;
    return new Date(ts).getUTCFullYear() >= 2020;
  };

  const isBadTitle = (title = "") => {
    const t = (title || "").trim().toLowerCase();
    if (!t || t.length < 8) return true;
    if (/^www\.|^soleretriever\.com$|^home$|^sneaker release dates$/i.test(t)) return true;
    return false;
  };

  const cleanImageUrl = (imageUrl) => {
    try {
      let u = (imageUrl || "").split("?")[0].split("#")[0];
      u = u.replace(/\/([^/]+)\//g, (m, seg) => {
        if (seg.includes(",")) {
          const tok = seg.split(",").find((t) => /^w_\d+$/i.test(t));
          return tok ? `/${tok}/` : "/";
        }
        return m;
      });
      return u;
    } catch (_) {
      return imageUrl;
    }
  };

  const grab = async () => {
    let browser;
    try {
      console.log("🚀 Starting SoleRetriever scraper (Puppeteer)...");
      if (TEST_MODE) console.log("🧪 TEST MODE ENABLED - will not POST to ingest endpoint");

      browser = await launchBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      console.log(`📡 Navigating: ${START_URL}`);
      await page.goto(START_URL, { waitUntil: "networkidle2", timeout: 45000 });
      await delay(1500);
      await autoScrollToLoadMore(page);

      let releases = await collectListingReleases(page);
      console.log(`📊 Found ${releases.length} release entries on listing (pre-cap)`);

      releases = releases.slice(0, MAX_ITEMS);
      console.log(`📊 Processing first ${releases.length} releases (SOLERETRIEVER_MAX_ITEMS=${MAX_ITEMS})`);
      if (releases.length === 0) {
        console.log("❌ No releases found - site may have changed structure.");
        return 0;
      }

      const detailPage = await browser.newPage();
      await detailPage.setViewport({ width: 1280, height: 800 });
      await detailPage.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      let processed = 0;
      for (let i = 0; i < releases.length; i++) {
        try {
          const entry = releases[i];
          const fullUrl = entry.href.startsWith("http") ? entry.href : `${BASE_URL}${entry.href}`;

          console.log(`\n📝 Processing ${i + 1}/${releases.length}: ${entry.title.substring(0, 60)}...`);
          console.log(`🔗 URL: ${fullUrl}`);

          const release = await getReleaseDetails(detailPage, fullUrl, entry.title);

          release.title = !isBadTitle(release.title) ? release.title : (entry.title || release.title);
          release.releaseDate = release.releaseDate || entry.releaseDate || "";
          release.price = release.price || entry.price || "";
          release.sku = release.sku || entry.sku || "";
          release.images = release.images || cleanImageUrl(entry.image || "");

          if (!release.images || /\.webp(?:$|\?)/i.test(release.images)) release.images = "";

          if (!release || isBadTitle(release.title) || !isValidReleaseDate(release.releaseDate) || !release.images) {
            console.log("  ⏭️  Skipping - failed validation (title/date/image)");
            continue;
          }

          await sendRequest(release);
          processed++;
          await delay(800 + Math.random() * 900);
        } catch (err) {
          console.log(`  ⚠️  Error on item ${i + 1}: ${err.message}`);
          continue;
        }
      }

      await detailPage.close();
      console.log(`\n🎉 SoleRetriever completed. Processed: ${processed}`);
      return processed;
    } catch (error) {
      console.error("❌ SoleRetriever error:", error.message);
      return 0;
    } finally {
      if (browser) await browser.close();
    }
  };

  // The listing renders only a handful of cards up front and lazy-loads more
  // as you scroll — without this, collectListingReleases only ever sees
  // whatever fit in the initial viewport (as few as 2 entries).
  const autoScrollToLoadMore = async (page) => {
    const maxScrolls = Number(process.env.SOLERETRIEVER_MAX_SCROLLS || 8);
    let previousHeight = 0;

    for (let i = 0; i < maxScrolls; i++) {
      const currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (currentHeight === previousHeight) break;
      previousHeight = currentHeight;

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(1200);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(300);
  };

  const collectListingReleases = async (page) => {
    try { await page.waitForSelector("main", { timeout: 15000 }); } catch (_) {}

    const items = await page.evaluate(() => {
      const monthNames = /(January|February|March|April|May|June|July|August|September|October|November|December)/i;
      const deny = /(news|journal|guide|privacy|terms|login|signup|account|raffle|store)/i;
      const isLikelyDetailPath = (href = "") => {
        const path = href.replace(/^https?:\/\/[^/]+/i, "");
        const parts = path.split("/").filter(Boolean);
        if (parts[0] !== "sneaker-release-dates") return false;
        if (parts.length < 4) return false;
        const slug = parts[parts.length - 1] || "";
        return slug.length >= 8 && slug.includes("-");
      };
      const anchors = Array.from(document.querySelectorAll("a"));
      const candidates = [];
      for (const a of anchors) {
        const href = a.getAttribute("href") || "";
        if (!href) continue;
        if (deny.test(href)) continue;
        if (!/\/sneaker-release-dates\//i.test(href)) continue;
        if (!isLikelyDetailPath(href)) continue;

        const card = a.closest("article, section, div, li");
        const text = (card?.textContent || a.textContent || "").trim().replace(/\s+/g, " ");
        const hasSignal = /\$\d{2,4}/.test(text) || monthNames.test(text) || /\bPrice TBD\b/i.test(text) || /Upcoming/i.test(text);
        const hasImg = !!(card?.querySelector("img") || a.querySelector("img"));
        if (!hasSignal || !hasImg) continue;

        const heading = card?.querySelector("h1,h2,h3,[class*='title']");
        let title = (heading?.textContent || a.textContent || "").trim().replace(/\s+/g, " ");
        title = title.replace(
          /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\s+at\s+\d{1,2}:\d{2}\s*[AP]M/i,
          ""
        ).trim();
        if (title.length < 6) continue;

        const dateMatch = text.match(
          /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/i
        );
        const priceMatch = text.match(/\$(\d{2,4}(?:,\d{3})?(?:\.\d{2})?)/);
        const skuMatch = text.match(/(?:SKU|Style|Style Code|Product Code)\s*[:#]?\s*([A-Z0-9-]{5,})/i);

        let image = "";
        const img = card?.querySelector("img") || a.querySelector("img");
        if (img) {
          image = img.getAttribute("src") || img.getAttribute("data-src") || "";
          if (image.startsWith("//")) image = "https:" + image;
          if (image.startsWith("/")) image = "https://www.soleretriever.com" + image;
        }

        candidates.push({
          href,
          title,
          releaseDate: dateMatch ? dateMatch[0] : "",
          price: priceMatch ? priceMatch[1].replace(/,/g, "") : "",
          sku: skuMatch ? skuMatch[1].toUpperCase() : "",
          image,
        });
      }

      const seen = new Set();
      return candidates.filter((x) => {
        if (seen.has(x.href)) return false;
        seen.add(x.href);
        return true;
      });
    });

    return items;
  };

  const getReleaseDetails = async (page, url, fallbackTitle = "") => {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await delay(1200);
    const html = await page.content();
    const $ = cheerio.load(html);

    const release = {
      url,
      color: "",
      price: "",
      content: "",
      sku: "",
      releaseDate: "",
      hash: "",
      images: "",
      type: "sneakers",
      title: "",
    };

    let title =
      $("h1, [data-testid*='title'], [class*='title']").first().text().trim() ||
      fallbackTitle ||
      $("title").text().trim();
    if (title) release.title = title.replace(/\s+\|\s*Sole Retriever.*/i, "").replace(/\s+/g, " ").trim();

    const bodyText = $("body").text();
    const priceMatch = bodyText.match(/\$(\d{2,4}(?:,\d{3})?(?:\.\d{2})?)/);
    if (priceMatch) {
      const p = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (!isNaN(p) && p > 10) release.price = p.toFixed(2);
    }

    const namedMonth = bodyText.match(
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/i
    );
    if (namedMonth) release.releaseDate = namedMonth[0];

    const skuMatch = bodyText.match(/(?:SKU|Style|Style Code|Product Code)\s*[:#]?\s*([A-Z0-9-]{5,})/i);
    if (skuMatch) release.sku = skuMatch[1].toUpperCase();

    const contentBlock = $(".description, [class*='description'], [data-testid*='description'], article, main").first().text().trim();
    if (contentBlock && contentBlock.length > 60) release.content = contentBlock.replace(/\s+/g, " ").trim();

    let img = $("meta[property='og:image']").attr("content") || $("meta[name='twitter:image']").attr("content") || "";
    if (!img) {
      img = $("img")
        .filter((_, el) => {
          const src = $(el).attr("src") || "";
          return /\.(png|jpe?g|webp)(\?|$)/i.test(src) && !/logo|sprite|icon/i.test(src);
        })
        .first()
        .attr("src");
    }
    if (img) {
      if (img.startsWith("//")) img = "https:" + img;
      if (img.startsWith("/")) img = BASE_URL + img;
      const cleaned = cleanImageUrl(img);
      if (!/\.webp(?:$|\?)/i.test(cleaned)) release.images = cleaned;
    }

    release.hash = md5(url);

    console.log(`  📋 Title: ${release.title}`);
    console.log(`  💰 Price: ${release.price || ""}`);
    console.log(`  📅 Date: ${release.releaseDate || ""}`);
    console.log(`  🏷️  SKU: ${release.sku || ""}`);
    console.log(`  🖼️  Image: ${release.images ? release.images.substring(0, 80) + "..." : ""}`);

    return release;
  };

  const sendRequest = async (release) => {
    try {
      const payload = {
        title: release.title,
        url: release.url,
        color: release.color,
        price: release.price,
        content: release.content,
        sku: release.sku,
        releaseDate: release.releaseDate,
        hash: release.hash,
        images: release.images,
        type: release.type,
      };

      console.log("  📋 Payload preview:");
      console.log(`  - title: ${payload.title}`);
      console.log(`  - url: ${payload.url}`);
      console.log(`  - releaseDate: ${payload.releaseDate}`);
      console.log(`  - price: ${payload.price}`);
      console.log(`  - images: ${payload.images}`);

      if (TEST_MODE) {
        const body = querystring.stringify(payload);
        console.log(`  🧪 TEST MODE body (${body.length} chars): ${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`);
        return { status: 200, statusText: "OK (TEST MODE)" };
      }

      const postUrl =
        process.env.SOLEINSIDER_INGEST_URL || "http://localhost:3000/public/ingest/saveRelease";
      const body = querystring.stringify(payload);
      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(process.env.CRAWLER_INGEST_SECRET
            ? { "x-cron-secret": process.env.CRAWLER_INGEST_SECRET }
            : {}),
        },
        timeout: 30000,
      };
      console.log(`  🌐 POST URL: ${postUrl}`);
      console.log(`  🧾 x-www-form-urlencoded body (${body.length} chars): ${body.substring(0, 500)}${body.length > 500 ? "..." : ""}`);
      const res = await axios.post(postUrl, body, config);
      console.log(`  ✅ Server response: ${res.status} ${res.statusText}`);
      return res;
    } catch (err) {
      console.error(`  ❌ Error sending request: ${err.message}`);
      if (err.response) {
        console.error(`    Status: ${err.response.status} ${err.response.statusText}`);
        console.error("    Data:", err.response.data);
      }
      return null;
    }
  };

  return grab();
};

module.exports = exports;
