/* eslint-disable */
const cheerio = require("cheerio");
const axios = require("axios");
const md5 = require("md5");
const querystring = require("querystring");
const { launchBrowser } = require("./browser");
const { logSaveResult } = require("./logSaveResult");

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

          const release = await getReleaseDetails(detailPage, fullUrl, entry.title);

          release.title = !isBadTitle(release.title) ? release.title : (entry.title || release.title);
          release.releaseDate = release.releaseDate || entry.releaseDate || "";
          release.price = release.price || entry.price || "";
          release.sku = release.sku || entry.sku || "";

          // Prefer the detail page's scoped `.embla` gallery (up to 6 photos
          // for this product). Fall back to the listing card's single
          // thumbnail only when the gallery came back empty.
          if (!release.images) {
            release.images = cleanImageUrl(entry.image || "");
          }

          // The ingest pipeline re-encodes every image to WebP on save, and
          // Sole Retriever's own product photos are natively served as
          // .webp — rejecting that format here just discards real images.

          if (!release || isBadTitle(release.title) || !isValidReleaseDate(release.releaseDate) || !release.images) {
            console.log(`⏭️  ${entry.title} — skipped, failed validation (title/date/image)`);
            continue;
          }

          const response = await sendRequest(release);
          if (response) logSaveResult(release.title, response, { testMode: TEST_MODE });
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

        const dateMatch = text.match(
          /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/i
        );
        const priceMatch = text.match(/\$(\d{2,4}(?:,\d{3})?(?:\.\d{2})?)/);
        const skuMatch = text.match(/(?:SKU|Style|Style Code|Product Code)\s*[:#]?\s*([A-Z0-9-]{5,})/i);

        const heading = card?.querySelector("h1,h2,h3,[class*='title']");
        let title = (heading?.textContent || a.textContent || "").trim().replace(/\s+/g, " ");
        title = title.replace(
          /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}\s+at\s+\d{1,2}:\d{2}\s*[AP]M/i,
          ""
        ).trim();

        // Most cards have no matching heading element — the product name only
        // exists as plain text in the card, sandwiched between the "Upcoming
        // <date>" prefix and the "$price • SKU" suffix (e.g. "UpcomingJuly 23,
        // 2026Nike Mind 002 Camo Green$145 • HQ4308-300"). Strip those known
        // pieces out to recover it rather than dropping the candidate.
        if (title.length < 6) {
          title = text
            .replace(/^Upcoming/i, "")
            .replace(dateMatch ? dateMatch[0] : "", "")
            .replace(priceMatch ? new RegExp(`\\$${priceMatch[1]}.*$`) : "", "")
            .trim();
        }

        if (title.length < 6) continue;

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

  // The "Release details" sidebar is the real structured data (Product name,
  // SKU, Colorway, Retail Price, Release Date) as label/value rows. The page
  // <h1> is an editorial article headline ("Sue Bird's Nike Air Zoom Huarache
  // 2K4 Will Finally be Released...") — never use it as the product name.
  const extractReleaseDetailsPanel = async (page) => {
    return page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("*"));
      const heading = all.find(
        (el) => /^release details$/i.test((el.textContent || "").trim()) && el.children.length === 0
      );
      if (!heading) return null;

      let panel = heading;
      for (let i = 0; i < 6; i++) {
        if (panel.parentElement) panel = panel.parentElement;
        const t = panel.textContent || "";
        if (/Product/.test(t) && /SKU/.test(t) && /Colorway/.test(t)) break;
      }

      const leaves = [];
      const walk = (el) => {
        for (const child of el.childNodes) {
          if (child.nodeType === 3) {
            const t = child.textContent.trim();
            if (t) leaves.push(t);
          } else if (child.nodeType === 1) {
            walk(child);
          }
        }
      };
      walk(panel);

      // leaves are an ordered [label, value, label, value, ...] sequence.
      const valueAfter = (label) => {
        const idx = leaves.findIndex((l) => l.toLowerCase() === label.toLowerCase());
        return idx >= 0 && idx + 1 < leaves.length ? leaves[idx + 1] : "";
      };

      return {
        product: valueAfter("Product"),
        releaseDate: valueAfter("Release Date"),
        sku: valueAfter("SKU"),
        colorway: valueAfter("Colorway"),
        retailPrice: valueAfter("Retail Price"),
      };
    });
  };

  // Most product photos live in a grid lower in the article body and are
  // lazy-loaded — they don't exist in the DOM until scrolled into view.
  const autoScrollDetail = async (page) => {
    await page.evaluate(async () => {
      let last = -1;
      for (let i = 0; i < 40; i++) {
        window.scrollBy(0, 600);
        await new Promise((r) => setTimeout(r, 150));
        const y = window.scrollY;
        if (y === last) break; // reached the bottom
        last = y;
      }
      window.scrollTo(0, 0);
    });
    await delay(400);
  };

  // Real product photos are the top carousel image plus a grid of extra angles
  // in the article body. Every one carries alt text that STARTS WITH the
  // product name — the bare name for the hero, or "… - Lateral" / "… - Medial"
  // / "… - Heel Detail" for the angles. Everything else on the page is for a
  // different product or is chrome: related-news thumbnails, the author
  // avatar, the branded header, and the "Similar Releases" strip. Note that
  // "Similar Releases" is ALSO a /sb/products/ embla carousel, so we must NOT
  // trust /sb/products/ or embla membership on their own — the startsWith test
  // on the product name is the only thing that reliably isolates this
  // release's photos (the hero image's alt is the bare product name, so it is
  // covered too).
  const extractGalleryImages = async (page, productName) => {
    return page.evaluate((name) => {
      const target = (name || "").trim().toLowerCase();
      if (!target) return [];

      const srcs = [];
      for (const img of document.querySelectorAll("img")) {
        const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
        if (!src) continue;
        const alt = (img.getAttribute("alt") || "").trim().toLowerCase();
        if (alt.startsWith(target)) srcs.push(src);
      }
      return srcs;
    }, productName);
  };

  const getReleaseDetails = async (page, url, fallbackTitle = "") => {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });
    await delay(1200);

    const panel = await extractReleaseDetailsPanel(page);
    await autoScrollDetail(page);
    const galleryImages = await extractGalleryImages(page, panel?.product || fallbackTitle);

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

    // Prefer the sidebar's "Product" field; fall back to the listing card
    // title, never the article <h1>.
    if (panel?.product) {
      release.title = panel.product.replace(/\s+/g, " ").trim();
    } else if (fallbackTitle) {
      release.title = fallbackTitle.replace(/\s+/g, " ").trim();
    }

    if (panel?.colorway) release.color = panel.colorway.replace(/\s+/g, " ").trim();

    const bodyText = $("body").text();

    const panelPrice = panel?.retailPrice ? panel.retailPrice.match(/(\d{2,4}(?:\.\d{2})?)/) : null;
    if (panelPrice) {
      const p = parseFloat(panelPrice[1]);
      if (!isNaN(p) && p > 10) release.price = p.toFixed(2);
    }

    if (panel?.releaseDate) release.releaseDate = panel.releaseDate.trim();
    else {
      const namedMonth = bodyText.match(
        /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}/i
      );
      if (namedMonth) release.releaseDate = namedMonth[0];
    }

    if (panel?.sku) release.sku = panel.sku.toUpperCase().trim();
    else {
      const skuMatch = bodyText.match(/(?:SKU|Style|Style Code|Product Code)\s*[:#]?\s*([A-Z0-9-]{5,})/i);
      if (skuMatch) release.sku = skuMatch[1].toUpperCase();
    }

    // Try selectors in order of specificity; `main`/`article` alone are too
    // broad on this site (they pull in nav, search bar, and JSON-LD <script>
    // text since cheerio's .text() walks every descendant text node).
    const contentSelectors = [
      ".description",
      "[class*='description']",
      "[data-testid*='description']",
      "article",
    ];

    let contentBlock = "";
    for (const selector of contentSelectors) {
      const el = $(selector).first();
      if (!el.length) continue;

      const text = el.clone().find("script, style, nav, header, footer").remove().end().text().trim();

      if (text && text.length > 60 && text.length < 4000 && !text.startsWith("{")) {
        contentBlock = text;
        break;
      }
    }

    if (contentBlock) release.content = contentBlock.replace(/\s+/g, " ").trim();

    // Collect up to 6 gallery photos. The same image is served at several
    // widths (?width=1600, 740, 392) — cleanImageUrl strips the query, so a
    // Set collapses those duplicates to one entry per distinct photo.
    const seenImages = new Set();
    const collected = [];
    for (let src of galleryImages) {
      if (src.startsWith("//")) src = "https:" + src;
      if (src.startsWith("/")) src = BASE_URL + src;
      const cleaned = cleanImageUrl(src);
      if (!cleaned || seenImages.has(cleaned)) continue;
      seenImages.add(cleaned);
      collected.push(cleaned);
      if (collected.length >= 6) break;
    }
    release.images = collected.join(",");

    release.hash = md5(url);

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

      if (TEST_MODE) {
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
      const res = await axios.post(postUrl, body, config);
      return res;
    } catch (err) {
      console.log(`❌ ${release.title} — request failed: ${err.message}`);
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
